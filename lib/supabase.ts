import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
          updated_at?: string
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
      receipts: {
        Row: {
          id: string
          group_id: string
          file_path: string
          created_by: string
          ocr_text: string | null
          total_amount: number | null
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          file_path: string
          created_by: string
          ocr_text?: string | null
          total_amount?: number | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          file_path?: string
          created_by?: string
          ocr_text?: string | null
          total_amount?: number | null
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 