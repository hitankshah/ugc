import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          credits: number;
          subscription_tier: string;
          created_at: string;
          updated_at: string;
        };
      };
      product_assets: {
        Row: {
          id: string;
          user_id: string;
          asset_type: 'uploaded' | 'generated';
          image_url: string;
          prompt: string | null;
          enhanced_prompt: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset_type: 'uploaded' | 'generated';
          image_url: string;
          prompt?: string | null;
          enhanced_prompt?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      video_generations: {
        Row: {
          id: string;
          user_id: string;
          asset_ids: string[];
          product_name: string;
          product_context: string;
          model_used: string;
          original_prompt: string;
          enhanced_prompt: string;
          video_url: string | null;
          status: 'processing' | 'completed' | 'failed';
          metadata: Record<string, unknown>;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset_ids: string[];
          product_name: string;
          product_context: string;
          model_used: string;
          original_prompt: string;
          enhanced_prompt: string;
          video_url?: string | null;
          status?: 'processing' | 'completed' | 'failed';
          metadata?: Record<string, unknown>;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      prompt_history: {
        Insert: {
          id?: string;
          user_id: string;
          original_prompt: string;
          enhanced_prompt: string;
          prompt_type: 'image' | 'video';
          model_used: string;
          success_indicators?: Record<string, unknown>;
          regenerated?: boolean;
          created_at?: string;
        };
      };
      credit_transactions: {
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          transaction_type: 'purchase' | 'image_gen' | 'video_gen' | 'refund';
          reference_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
