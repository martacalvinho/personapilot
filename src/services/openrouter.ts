import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    "HTTP-Referer": import.meta.env.VITE_SITE_URL,
    "X-Title": import.meta.env.VITE_SITE_NAME,
  },
});

export interface PersonaAnalysis {
  tone: string;
  mainTopics: string[];
  interactionStyle: string;
  identity: string;
  confidence: number;
}

export interface ReplyGeneration {
  reply: string;
  confidence: number;
  reasoning: string;
}

export class OpenRouterService {
  private model = "meta-llama/llama-3.3-70b-instruct:free";

  async analyzePersona(userId: string, tweets: string[], replies: string[]): Promise<PersonaAnalysis> {
    const { supabase } = await import('../lib/supabase');
    
    const allContent = [...tweets, ...replies].join('\n\n');
    
    const prompt = `Analyze the following tweets and replies from a user. Based on their content, generate a JSON object describing their persona. 

Content to analyze:
${allContent}

Please respond with ONLY a valid JSON object in this exact format:
{
  "tone": "description of their communication tone",
  "mainTopics": ["topic1", "topic2", "topic3"],
  "interactionStyle": "how they interact with others",
  "identity": "their professional/personal identity",
  "confidence": 85
}

Focus on:
- Communication style and tone
- Main topics they discuss
- How they engage with others
- Their professional identity
- Rate confidence 1-100 based on content quality`;

    try {
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      if (!response) throw new Error('No response from AI');

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const persona = JSON.parse(jsonMatch[0]);
      
      // Save persona to Supabase
      const { data, error } = await supabase
        .from('personas')
        .upsert([{
          user_id: userId,
          tone: persona.tone,
          main_topics: persona.mainTopics,
          interaction_style: persona.interactionStyle,
          identity: persona.identity,
          confidence: persona.confidence
        }], { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      
      return persona;
    } catch (error) {
      console.error('Error analyzing persona:', error);
      throw error;
    }
  }

  async generateReply(persona: PersonaAnalysis, tweetContent: string, author: string): Promise<ReplyGeneration> {
    const prompt = `You are an AI assistant emulating the following persona:
- Tone: ${persona.tone}
- Main Topics: ${persona.mainTopics.join(', ')}
- Interaction Style: ${persona.interactionStyle}
- Identity: ${persona.identity}

Your task is to draft an insightful, engaging reply to the tweet below. The reply must:
1. Match the persona's tone and style exactly
2. Be authentic and add value to the conversation
3. Be concise (under 280 characters)
4. Feel natural and human-like

Tweet by ${author}:
"${tweetContent}"

Respond with ONLY a valid JSON object:
{
  "reply": "your drafted reply here",
  "confidence": 85,
  "reasoning": "brief explanation of why this reply fits the persona"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;
      if (!response) throw new Error('No response from AI');

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating reply:', error);
      throw error;
    }
  }

  async generateSearchQueries(persona: PersonaAnalysis): Promise<string[]> {
    const prompt = `Based on this user persona, generate 5 diverse search queries for Twitter to find conversations they would likely want to join.

Persona:
- Tone: ${persona.tone}
- Main Topics: ${persona.mainTopics.join(', ')}
- Interaction Style: ${persona.interactionStyle}
- Identity: ${persona.identity}

Focus on their main topics and interaction style. Generate queries that would find:
1. Questions they could answer
2. Discussions in their expertise areas
3. Community conversations they'd engage with
4. Trending topics in their field
5. Opportunities to share insights

Respond with ONLY a JSON array of strings:
["query1", "query2", "query3", "query4", "query5"]`;

    try {
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
      });

      const response = completion.choices[0].message.content;
      if (!response) throw new Error('No response from AI');

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating search queries:', error);
      throw error;
    }
  }

  async getPersona(userId: string): Promise<PersonaAnalysis | null> {
    const { supabase } = await import('../lib/supabase');
    
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return {
      tone: data.tone,
      mainTopics: data.main_topics,
      interactionStyle: data.interaction_style,
      identity: data.identity,
      confidence: data.confidence
    };
  }
}

export const openRouterService = new OpenRouterService();