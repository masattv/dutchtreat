import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'owner' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role: 'owner' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          created_at?: string
        }
      }
      group_invites: {
        Row: {
          id: string
          group_id: string
          email: string
          role: 'owner' | 'member'
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          created_by: string
          invite_link: string | null
        }
        Insert: {
          id?: string
          group_id: string
          email: string
          role: 'owner' | 'member'
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          created_by: string
          invite_link?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          email?: string
          role?: 'owner' | 'member'
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          created_by?: string
          invite_link?: string | null
        }
      }
    }
  }
} 