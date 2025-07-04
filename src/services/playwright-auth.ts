import { supabase } from '../lib/supabase';

export interface PlaywrightTwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url: string;
  verified: boolean;
}

export class PlaywrightAuthService {
  private isAuthenticated = false;
  private currentUser: PlaywrightTwitterUser | null = null;

  async loginWithPlaywright(credentials: { username: string; password: string }): Promise<PlaywrightTwitterUser> {
    try {
      // Simulate Playwright login process
      console.log('Starting Playwright Twitter login...');
      
      // Simulate login delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful login with test user data
      const mockUser: PlaywrightTwitterUser = {
        id: 'test_user_' + Date.now(),
        username: credentials.username || 'testuser',
        name: 'Test User',
        profile_image_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
        verified: false
      };

      // Create a test user in Supabase Auth
      const tempEmail = `${mockUser.username}@test.local`;
      const tempPassword = 'test_password_123';
      
      // Try to sign up or sign in
      let authResult = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
      });

      // If user already exists, sign in instead
      if (authResult.error && authResult.error.message.includes('already registered')) {
        authResult = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: tempPassword,
        });
      }

      if (authResult.error) {
        throw new Error(`Auth error: ${authResult.error.message}`);
      }

      const user = authResult.data.user;
      if (!user) {
        throw new Error('No user returned from auth');
      }

      // Store user data in our users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          twitter_id: mockUser.id,
          username: mockUser.username,
          display_name: mockUser.name,
          profile_image: mockUser.profile_image_url,
          verified: mockUser.verified,
          updated_at: new Date().toISOString()
        });

      if (userError) {
        console.error('Error storing user data:', userError);
        throw userError;
      }

      this.currentUser = mockUser;
      this.isAuthenticated = true;

      // Store in localStorage for persistence
      localStorage.setItem('playwright_user', JSON.stringify(mockUser));
      localStorage.setItem('playwright_authenticated', 'true');

      console.log('Playwright login successful:', mockUser.username);
      return mockUser;

    } catch (error) {
      console.error('Playwright login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.currentUser = null;
      this.isAuthenticated = false;
      localStorage.removeItem('playwright_user');
      localStorage.removeItem('playwright_authenticated');
      console.log('Playwright logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  isLoggedIn(): boolean {
    if (this.isAuthenticated && this.currentUser) {
      return true;
    }

    // Check localStorage for persisted session
    const storedUser = localStorage.getItem('playwright_user');
    const storedAuth = localStorage.getItem('playwright_authenticated');

    if (storedUser && storedAuth === 'true') {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.isAuthenticated = true;
        return true;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.logout();
      }
    }

    return false;
  }

  getCurrentUser(): PlaywrightTwitterUser | null {
    return this.currentUser;
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && this.isLoggedIn()) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }

  // Mock methods for testing Twitter functionality
  async scrapeUserTweets(): Promise<any[]> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    // Simulate scraping delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockTweets = [
      {
        id: 'tweet_1',
        text: 'Just shipped a new feature for my SaaS! The power of building in public is real - got 3 feature requests from this tweet alone. What\'s your experience with transparent development?',
        created_at: new Date().toISOString(),
        public_metrics: { like_count: 24, retweet_count: 8, reply_count: 12 }
      },
      {
        id: 'tweet_2', 
        text: 'AI is transforming how we build products, but the human element remains crucial. The best AI tools amplify human creativity rather than replace it. Thoughts?',
        created_at: new Date().toISOString(),
        public_metrics: { like_count: 67, retweet_count: 23, reply_count: 31 }
      },
      {
        id: 'tweet_3',
        text: 'Indie hacker tip: Start with a problem you personally face. If you\'re not your own target customer, you\'re building blind. What problem are you solving for yourself?',
        created_at: new Date().toISOString(),
        public_metrics: { like_count: 156, retweet_count: 45, reply_count: 28 }
      }
    ];

    return mockTweets;
  }

  async scrapeUserReplies(): Promise<any[]> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    // Simulate scraping delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    const mockReplies = [
      {
        id: 'reply_1',
        text: 'Great question! I\'ve found that user interviews are gold. Even 5-10 conversations can reveal patterns you\'d never see in analytics. What\'s your approach to gathering feedback?',
        created_at: new Date().toISOString(),
        public_metrics: { like_count: 12, retweet_count: 2, reply_count: 4 },
        in_reply_to_user_id: 'other_user_1'
      },
      {
        id: 'reply_2',
        text: 'This resonates! I use Claude for code review and GPT-4 for brainstorming. The key is knowing which tool fits which task. Have you experimented with different models for different use cases?',
        created_at: new Date().toISOString(),
        public_metrics: { like_count: 8, retweet_count: 1, reply_count: 2 },
        in_reply_to_user_id: 'other_user_2'
      }
    ];

    return mockReplies;
  }
}

export const playwrightAuthService = new PlaywrightAuthService();