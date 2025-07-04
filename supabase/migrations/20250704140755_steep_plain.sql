/*
  # Initial Schema for PersonaPilot

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `twitter_id` (text, unique) - Twitter user ID
      - `username` (text) - Twitter username
      - `display_name` (text) - Twitter display name
      - `profile_image` (text) - Profile image URL
      - `verified` (boolean) - Twitter verification status
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `tweets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `tweet_id` (text, unique) - Twitter tweet ID
      - `text` (text) - Tweet content
      - `created_at` (timestamp) - When tweet was posted
      - `likes` (integer) - Like count
      - `retweets` (integer) - Retweet count
      - `replies` (integer) - Reply count
      - `is_reply` (boolean) - Whether this is a reply
      - `reply_to_id` (text, nullable) - ID of tweet being replied to

    - `personas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `tone` (text) - Communication tone
      - `main_topics` (text array) - Main topics of interest
      - `interaction_style` (text) - How user interacts
      - `identity` (text) - Professional identity
      - `confidence` (integer) - Analysis confidence score
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `engagement_suggestions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `tweet_id` (text) - Target tweet ID
      - `author_username` (text) - Tweet author
      - `tweet_content` (text) - Original tweet content
      - `suggested_reply` (text) - AI-generated reply
      - `confidence` (integer) - Reply confidence score
      - `topic` (text) - Topic category
      - `engagement_count` (integer) - Original tweet engagement
      - `status` (enum) - pending, approved, rejected, posted
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_id text UNIQUE NOT NULL,
  username text NOT NULL,
  display_name text NOT NULL,
  profile_image text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tweets table
CREATE TABLE IF NOT EXISTS tweets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tweet_id text UNIQUE NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  likes integer DEFAULT 0,
  retweets integer DEFAULT 0,
  replies integer DEFAULT 0,
  is_reply boolean DEFAULT false,
  reply_to_id text
);

-- Create personas table
CREATE TABLE IF NOT EXISTS personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tone text NOT NULL,
  main_topics text[] NOT NULL,
  interaction_style text NOT NULL,
  identity text NOT NULL,
  confidence integer NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create engagement_suggestions table
CREATE TABLE IF NOT EXISTS engagement_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tweet_id text NOT NULL,
  author_username text NOT NULL,
  tweet_content text NOT NULL,
  suggested_reply text NOT NULL,
  confidence integer NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  topic text NOT NULL,
  engagement_count integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'posted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

-- Create policies for tweets table
CREATE POLICY "Users can read own tweets"
  ON tweets
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

CREATE POLICY "Users can insert own tweets"
  ON tweets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

CREATE POLICY "Users can update own tweets"
  ON tweets
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

-- Create policies for personas table
CREATE POLICY "Users can read own personas"
  ON personas
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

CREATE POLICY "Users can insert own personas"
  ON personas
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

CREATE POLICY "Users can update own personas"
  ON personas
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

-- Create policies for engagement_suggestions table
CREATE POLICY "Users can read own suggestions"
  ON engagement_suggestions
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

CREATE POLICY "Users can insert own suggestions"
  ON engagement_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

CREATE POLICY "Users can update own suggestions"
  ON engagement_suggestions
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON tweets(user_id);
CREATE INDEX IF NOT EXISTS idx_tweets_tweet_id ON tweets(tweet_id);
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_suggestions_user_id ON engagement_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_suggestions_status ON engagement_suggestions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engagement_suggestions_updated_at BEFORE UPDATE ON engagement_suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();