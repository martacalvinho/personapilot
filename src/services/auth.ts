export interface TwitterOAuthConfig {
  clientId: string;
  redirectUri: string;
}

export class TwitterAuthService {
  private config: TwitterOAuthConfig;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || '1941139719099924480',
      redirectUri: `${window.location.origin}/auth/callback`
    };
  }

  generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async initiateOAuth(): Promise<void> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    // Store code verifier for later use
    sessionStorage.setItem('twitter_code_verifier', codeVerifier);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'tweet.read users.read tweet.write offline.access follows.read',
      state: crypto.randomUUID(),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
    console.log('Redirecting to:', authUrl);
    window.location.href = authUrl;
  }

  async handleCallback(code: string, state: string): Promise<any> {
    const codeVerifier = sessionStorage.getItem('twitter_code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    console.log('Exchanging code for token via Supabase Edge Function...');
    
    // Call our secure Supabase Edge Function instead of Twitter directly
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/twitter-auth`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        code,
        codeVerifier,
        redirectUri: this.config.redirectUri
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge function failed:', errorData);
      throw new Error(`Failed to exchange code for token: ${errorData.error}`);
    }

    const data = await response.json();
    console.log('Tokens received from edge function:', { access_token: !!data.tokens.access_token });
    
    // Clean up
    sessionStorage.removeItem('twitter_code_verifier');
    
    return {
      tokens: data.tokens,
      user: data.user
    };
  }
}

export const twitterAuthService = new TwitterAuthService();