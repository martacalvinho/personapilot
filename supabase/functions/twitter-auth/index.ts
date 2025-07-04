import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, codeVerifier, redirectUri } = await req.json()

    if (!code || !codeVerifier || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Twitter credentials from environment variables
    const clientId = Deno.env.get('TWITTER_CLIENT_ID')
    const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Twitter credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Twitter token exchange failed:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to exchange code for token', details: errorText }),
        { 
          status: tokenResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokens = await tokenResponse.json()

    // Get user information from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,verified', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('Twitter user info failed:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to get user info', details: errorText }),
        { 
          status: userResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const userData = await userResponse.json()

    return new Response(
      JSON.stringify({
        tokens,
        user: userData.data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in twitter-auth function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})