export interface TwitterOAuthConfig {
  clientId: string;
  redirectUri: string;
}

export class TwitterAuthService {
  private config: TwitterOAuthConfig;

  constructor() {
    this.config = {
      clientId: '1941139719099924480',
      clientSecret: 'XxYsGSRd5y4oYSlSWvw9epwdNXc1pvPAtCqu3RxPDOvJlkjZ6t',
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
    console.log('Redirecting to:', authUrl);
    window.location.href = authUrl;
  }

  async handleCallback(code: string, state: string): Promise<any> {
    const codeVerifier = sessionStorage.getItem('twitter_code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    console.log('Exchanging code for token...');
    
    console.log('Exchanging code for token via Supabase Edge Function...');
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Failed to exchange code for token: ${errorText}`);
    // Call our secure Supabase Edge Function instead of Twitter directly
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/twitter-auth`;
    console.log('Tokens received:', { access_token: !!tokens.access_token });
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        code,
        codeVerifier,
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge function failed:', errorData);
      const errorText = await userResponse.text();
      console.error('User info failed:', errorText);
      throw new Error(`Failed to get user info: ${errorText}`);
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