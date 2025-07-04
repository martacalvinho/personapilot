import { supabase } from '../lib/supabase';
import { twitterAuthService } from './auth';

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url: string;
  verified?: boolean;
}

export interface TwitterTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
  };
  in_reply_to_user_id?: string;
  referenced_tweets?: Array<{
    type: string;
    id: string;
  }>;
}

export class TwitterService {
  async getCurrentUser(): Promise<TwitterUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !userData) return null;

      return {
        id: userData.twitter_id,
        username: userData.username,
        name: userData.display_name,
        profile_image_url: userData.profile_image,
        verified: userData.verified
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async saveUserData(twitterUser: TwitterUser): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          twitter_id: twitterUser.id,
          username: twitterUser.username,
          display_name: twitterUser.name,
          profile_image: twitterUser.profile_image_url,
          verified: twitterUser.verified || false,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  async getUserPersona(): Promise<any | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: persona, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching persona:', error);
        return null;
      }

      return persona;
    } catch (error) {
      console.error('Error getting user persona:', error);
      return null;
    }
  }

  async saveUserPersona(persona: {
    tone: string;
    main_topics: string[];
    interaction_style: string;
    identity: string;
    confidence: number;
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('personas')
        .upsert({
          user_id: user.id,
          ...persona,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving persona:', error);
      throw error;
    }
  }

  async getEngagementSuggestions(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: suggestions, error } = await supabase
        .from('engagement_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching suggestions:', error);
        return [];
      }

      return suggestions || [];
    } catch (error) {
      console.error('Error getting engagement suggestions:', error);
      return [];
    }
  }

  async updateSuggestionStatus(suggestionId: string, status: 'approved' | 'rejected' | 'posted'): Promise<void> {
    try {
      const { error } = await supabase
        .from('engagement_suggestions')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      throw error;
    }
  }

  async saveTweet(tweet: TwitterTweet, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tweets')
        .upsert({
          user_id: userId,
          tweet_id: tweet.id,
          text: tweet.text,
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          is_reply: !!tweet.in_reply_to_user_id,
          reply_to_id: tweet.referenced_tweets?.find(ref => ref.type === 'replied_to')?.id || null,
          created_at: tweet.created_at
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving tweet:', error);
      throw error;
    }
  }

  async getUserTweets(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: tweets, error } = await supabase
        .from('tweets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching tweets:', error);
        return [];
      }

      return tweets || [];
    } catch (error) {
      console.error('Error getting user tweets:', error);
      return [];
    }
  }

  // Delegate authentication to the auth service
  async initiateAuth(): Promise<void> {
    return twitterAuthService.initiateOAuth();
  }

  async handleAuthCallback(code: string, state: string): Promise<any> {
    return twitterAuthService.handleCallback(code, state);
  }
}

export const twitterService = new TwitterService();