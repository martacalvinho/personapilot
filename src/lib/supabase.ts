import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          twitter_id: string
          username: string
          display_name: string
          profile_image: string
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          twitter_id: string
          username: string
          display_name: string
          profile_image: string
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          twitter_id?: string
          username?: string
          display_name?: string
          profile_image?: string
          verified?: boolean
          updated_at?: string
        }
      }
      tweets: {
        Row: {
          id: string
          user_id: string
          tweet_id: string
          text: string
          created_at: string
          likes: number
          retweets: number
          replies: number
          is_reply: boolean
          reply_to_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tweet_id: string
          text: string
          created_at?: string
          likes?: number
          retweets?: number
          replies?: number
          is_reply?: boolean
          reply_to_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tweet_id?: string
          text?: string
          likes?: number
          retweets?: number
          replies?: number
          is_reply?: boolean
          reply_to_id?: string | null
        }
      }
      personas: {
        Row: {
          id: string
          user_id: string
          tone: string
          main_topics: string[]
          interaction_style: string
          identity: string
          confidence: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tone: string
          main_topics: string[]
          interaction_style: string
          identity: string
          confidence: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tone?: string
          main_topics?: string[]
          interaction_style?: string
          identity?: string
          confidence?: number
          updated_at?: string
        }
      }
      engagement_suggestions: {
        Row: {
          id: string
          user_id: string
          tweet_id: string
          author_username: string
          tweet_content: string
          suggested_reply: string
          confidence: number
          topic: string
          engagement_count: number
          status: 'pending' | 'approved' | 'rejected' | 'posted'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tweet_id: string
          author_username: string
          tweet_content: string
          suggested_reply: string
          confidence: number
          topic: string
          engagement_count: number
          status?: 'pending' | 'approved' | 'rejected' | 'posted'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tweet_id?: string
          author_username?: string
          tweet_content?: string
          suggested_reply?: string
          confidence?: number
          topic?: string
          engagement_count?: number
          status?: 'pending' | 'approved' | 'rejected' | 'posted'
          updated_at?: string
        }
      }
    }
  }
}