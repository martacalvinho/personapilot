import { supabase } from '../lib/supabase';
import { twitterAuthService } from './auth';
import { twitterAuthService } from './auth';

export interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  profileImage: string;
  verified: boolean;
}

export interface TwitterTweet {
  id: string;
  text: string;
  author: TwitterUser;
  createdAt: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
  };
  isReply?: boolean;
  replyToId?: string;
}

export interface TwitterGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
}

export class TwitterService {
  private currentUser: TwitterUser | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async authenticate(): Promise<TwitterUser> {
    // Initiate Twitter OAuth flow
    await twitterAuthService.initiateOAuth();
    // This will redirect to Twitter, so we don't return anything here
    return Promise.reject(new Error('Redirecting to Twitter OAuth'));
  }

  async storeTwitterUser(twitterUser: any, tokens: any): Promise<TwitterUser> {
    try {
      // Store tokens
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      
      // Check if user already exists in Supabase
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('twitter_id', twitterUser.id)
        .limit(1);

      let user;
      if (existingUsers && existingUsers.length > 0) {
        // Update existing user
        const { data: updatedUser, error } = await supabase
          .from('users')
          .update({
            username: twitterUser.username,
            display_name: twitterUser.name,
            profile_image: twitterUser.profile_image_url || '',
            verified: twitterUser.verified || false,
            updated_at: new Date().toISOString()
          })
          .eq('twitter_id', twitterUser.id)
          .select()
          .single();

        if (error) throw error;
        user = updatedUser;
      } else {
        // Create new user with Supabase Auth
        const tempEmail = `${twitterUser.id}@twitter.local`;
        const tempPassword = 'twitter_' + crypto.randomUUID();
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: tempEmail,
          password: tempPassword,
        });

        if (authError) throw authError;

        // Create user record
        const userToInsert = {
          id: authData.user?.id,
          twitter_id: twitterUser.id,
          username: twitterUser.username,
          display_name: twitterUser.name,
          profile_image: twitterUser.profile_image_url || '',
          verified: twitterUser.verified || false
        };

        const { data: newUser, error } = await supabase
          .from('users')
          .insert([userToInsert])
          .select()
          .single();

        if (error) throw error;
        user = newUser;
      }

      // Store tokens securely (in production, encrypt these)
      localStorage.setItem('twitter_access_token', this.accessToken);
      localStorage.setItem('twitter_refresh_token', this.refreshToken);
      localStorage.setItem('user_data', JSON.stringify(user));

      this.currentUser = {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        profileImage: user.profile_image,
        verified: user.verified
      };

      return this.currentUser;
    } catch (error) {
      console.error('Error storing Twitter user:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('twitter_access_token');
    localStorage.removeItem('twitter_refresh_token');
    localStorage.removeItem('user_data');
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('twitter_access_token');
    localStorage.removeItem('twitter_refresh_token');
    localStorage.removeItem('user_data');
    await supabase.auth.signOut();
  }

  isLoggedIn(): boolean {
    if (this.currentUser) return true;
    
    // Check if we have stored user data
    const storedUser = localStorage.getItem('user_data');
    const storedToken = localStorage.getItem('twitter_access_token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        this.currentUser = {
          id: userData.id,
          username: userData.username,
          displayName: userData.display_name,
          profileImage: userData.profile_image,
          verified: userData.verified
        };
        this.accessToken = storedToken;
        this.refreshToken = localStorage.getItem('twitter_refresh_token');
        return true;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.logout();
      }
    }
    
    return false;
  }

  getCurrentUser(): TwitterUser | null {
    return this.currentUser;
  }

  async scrapeUserTweets(userId: string): Promise<TwitterTweet[]> {
    try {
      // Try to use Twitter API first if we have valid tokens
      if (this.accessToken) {
        const response = await fetch(`https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=created_at,public_metrics`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const tweets = data.data || [];
          
          // Store tweets in Supabase
          const tweetsToInsert = tweets.map((tweet: any) => ({
            user_id: userId,
            tweet_id: tweet.id,
            text: tweet.text,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
            is_reply: false,
            reply_to_id: null
          }));

          if (tweetsToInsert.length > 0) {
            await supabase
              .from('tweets')
              .upsert(tweetsToInsert, { onConflict: 'tweet_id' });
          }

          return tweets.map((tweet: any) => ({
            id: tweet.id,
            text: tweet.text,
            author: this.currentUser!,
            createdAt: tweet.created_at,
            metrics: {
              likes: tweet.public_metrics?.like_count || 0,
              retweets: tweet.public_metrics?.retweet_count || 0,
              replies: tweet.public_metrics?.reply_count || 0
            }
          }));
        }
      }
    } catch (error) {
      console.warn('API call failed, falling back to mock data:', error);
    }

    // Fallback to mock data if API fails
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockTweets = [
      {
        tweet_id: 'tweet_' + Date.now() + '_1',
        text: 'Just shipped a new feature for my SaaS! The power of building in public is real - got 3 feature requests from this tweet alone. What\'s your experience with transparent development?',
        likes: 24,
        retweets: 8,
        replies: 12,
        is_reply: false,
        reply_to_id: null
      },
      {
        tweet_id: 'tweet_' + Date.now() + '_2',
        text: 'AI is transforming how we build products, but the human element remains crucial. The best AI tools amplify human creativity rather than replace it. Thoughts?',
        likes: 67,
        retweets: 23,
        replies: 31,
        is_reply: false,
        reply_to_id: null
      },
      {
        tweet_id: 'tweet_' + Date.now() + '_3',
        text: 'Indie hacker tip: Start with a problem you personally face. If you\'re not your own target customer, you\'re building blind. What problem are you solving for yourself?',
        likes: 156,
        retweets: 45,
        replies: 28,
        is_reply: false,
        reply_to_id: null
      }
    ];

    // Store tweets in Supabase
    const tweetsToInsert = mockTweets.map(tweet => ({
      user_id: userId,
      tweet_id: tweet.tweet_id,
      text: tweet.text,
      likes: tweet.likes,
      retweets: tweet.retweets,
      replies: tweet.replies,
      is_reply: tweet.is_reply,
      reply_to_id: tweet.reply_to_id
    }));

    const { data, error } = await supabase
      .from('tweets')
      .upsert(tweetsToInsert, { onConflict: 'tweet_id' })
      .select();

    if (error) throw error;

    // Convert to TwitterTweet format
    return data.map(tweet => ({
      id: tweet.tweet_id,
      text: tweet.text,
      author: this.currentUser!,
      createdAt: tweet.created_at,
      metrics: {
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies
      },
      isReply: tweet.is_reply,
      replyToId: tweet.reply_to_id
    }));
  }

  async scrapeUserReplies(userId: string): Promise<TwitterTweet[]> {
    // Simulate scraping delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    const mockReplies = [
      {
        tweet_id: 'reply_' + Date.now() + '_1',
        text: 'Great question! I\'ve found that user interviews are gold. Even 5-10 conversations can reveal patterns you\'d never see in analytics. What\'s your approach to gathering feedback?',
        likes: 12,
        retweets: 2,
        replies: 4,
        is_reply: true,
        reply_to_id: 'original_tweet_1'
      },
      {
        tweet_id: 'reply_' + Date.now() + '_2',
        text: 'This resonates! I use Claude for code review and GPT-4 for brainstorming. The key is knowing which tool fits which task. Have you experimented with different models for different use cases?',
        likes: 8,
        retweets: 1,
        replies: 2,
        is_reply: true,
        reply_to_id: 'original_tweet_2'
      }
    ];

    // Store replies in Supabase
    const repliesToInsert = mockReplies.map(reply => ({
      user_id: userId,
      tweet_id: reply.tweet_id,
      text: reply.text,
      likes: reply.likes,
      retweets: reply.retweets,
      replies: reply.replies,
      is_reply: reply.is_reply,
      reply_to_id: reply.reply_to_id
    }));

    const { data, error } = await supabase
      .from('tweets')
      .upsert(repliesToInsert, { onConflict: 'tweet_id' })
      .select();

    if (error) throw error;

    return data.map(tweet => ({
      id: tweet.tweet_id,
      text: tweet.text,
      author: this.currentUser!,
      createdAt: tweet.created_at,
      metrics: {
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies
      },
      isReply: tweet.is_reply,
      replyToId: tweet.reply_to_id
    }));
  }

  async getUserGroups(userId: string): Promise<TwitterGroup[]> {
    // Mock groups - in production this would be scraped
    return [
      {
        id: 'group_1',
        name: 'Indie Hackers',
        description: 'Community of independent entrepreneurs building profitable online businesses',
        memberCount: 45000,
        isPrivate: false
      },
      {
        id: 'group_2',
        name: 'AI Builders',
        description: 'Developers and entrepreneurs building with AI',
        memberCount: 12000,
        isPrivate: false
      },
      {
        id: 'group_3',
        name: 'SaaS Founders',
        description: 'Software as a Service founders sharing insights and experiences',
        memberCount: 28000,
        isPrivate: false
      }
    ];
  }

  async searchTweets(query: string, limit: number = 10): Promise<TwitterTweet[]> {
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock search results - in production this would scrape Twitter search
    const mockSearchResults: TwitterTweet[] = [
      {
        id: 'search_' + Date.now() + '_1',
        text: 'Struggling with product-market fit for my new SaaS. Any advice on how to validate demand before building more features?',
        author: {
          id: 'user_456',
          username: 'startup_founder',
          displayName: 'Sarah Chen',
          profileImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
          verified: false
        },
        createdAt: new Date().toISOString(),
        metrics: { likes: 5, retweets: 1, replies: 3 }
      },
      {
        id: 'search_' + Date.now() + '_2',
        text: 'What\'s the best AI model for code generation? I\'ve been using GPT-4 but wondering if there are better alternatives for specific programming tasks.',
        author: {
          id: 'user_789',
          username: 'dev_mike',
          displayName: 'Mike Rodriguez',
          profileImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
          verified: false
        },
        createdAt: new Date().toISOString(),
        metrics: { likes: 12, retweets: 3, replies: 8 }
      }
    ];

    return mockSearchResults;
  }

  async postReply(tweetId: string, replyText: string): Promise<TwitterTweet> {
    // Simulate posting delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newReply: TwitterTweet = {
      id: `reply_${Date.now()}`,
      text: replyText,
      author: this.currentUser!,
      createdAt: new Date().toISOString(),
      metrics: { likes: 0, retweets: 0, replies: 0 },
      isReply: true,
      replyToId: tweetId
    };

    return newReply;
  }

  async saveEngagementSuggestion(
    userId: string,
    tweetId: string,
    authorUsername: string,
    tweetContent: string,
    suggestedReply: string,
    confidence: number,
    topic: string,
    engagementCount: number
  ) {
    const { data, error } = await supabase
      .from('engagement_suggestions')
      .insert([{
        user_id: userId,
        tweet_id: tweetId,
        author_username: authorUsername,
        tweet_content: tweetContent,
        suggested_reply: suggestedReply,
        confidence,
        topic,
        engagement_count: engagementCount,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getEngagementSuggestions(userId: string, status: string = 'pending') {
    const { data, error } = await supabase
      .from('engagement_suggestions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async updateEngagementSuggestionStatus(suggestionId: string, status: string) {
    const { data, error } = await supabase
      .from('engagement_suggestions')
      .update({ status })
      .eq('id', suggestionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const twitterService = new TwitterService();