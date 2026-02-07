/*
  # UGC Factory Platform Schema

  ## Overview
  This migration sets up the complete database schema for a premium UGC Factory platform
  that generates product images and converts them into UGC-style videos.

  ## New Tables
  
  ### 1. `user_profiles`
  - `id` (uuid, FK to auth.users) - User identifier
  - `credits` (integer) - Available generation credits
  - `subscription_tier` (text) - User's subscription level
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `product_assets`
  - `id` (uuid, PK) - Asset identifier
  - `user_id` (uuid, FK) - Owner of the asset
  - `asset_type` (text) - 'uploaded' or 'generated'
  - `image_url` (text) - URL to the image
  - `prompt` (text) - Generation prompt (if generated)
  - `enhanced_prompt` (text) - AI-enhanced prompt
  - `metadata` (jsonb) - Additional metadata
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. `prompt_history`
  - `id` (uuid, PK) - Prompt record identifier
  - `user_id` (uuid, FK) - User who created the prompt
  - `original_prompt` (text) - User's original input
  - `enhanced_prompt` (text) - AI-enhanced version
  - `prompt_type` (text) - 'image' or 'video'
  - `model_used` (text) - Model identifier
  - `success_indicators` (jsonb) - Performance metrics
  - `regenerated` (boolean) - Whether user regenerated
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. `video_generations`
  - `id` (uuid, PK) - Video generation identifier
  - `user_id` (uuid, FK) - User who generated the video
  - `asset_ids` (uuid[]) - Array of product asset IDs used
  - `product_name` (text) - Product name
  - `product_context` (text) - Use-case and audience info
  - `model_used` (text) - Video generation model
  - `original_prompt` (text) - User's idea prompt
  - `enhanced_prompt` (text) - AI-enhanced prompt
  - `video_url` (text) - URL to generated video
  - `status` (text) - 'processing', 'completed', 'failed'
  - `metadata` (jsonb) - Additional generation data
  - `created_at` (timestamptz) - Creation timestamp
  - `completed_at` (timestamptz) - Completion timestamp

  ### 5. `credit_transactions`
  - `id` (uuid, PK) - Transaction identifier
  - `user_id` (uuid, FK) - User account
  - `amount` (integer) - Credits added/removed (negative for usage)
  - `transaction_type` (text) - 'purchase', 'image_gen', 'video_gen', etc.
  - `reference_id` (uuid) - Reference to asset or generation
  - `created_at` (timestamptz) - Transaction timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Policies enforce authentication and ownership
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits integer DEFAULT 100,
  subscription_tier text DEFAULT 'starter',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create product_assets table
CREATE TABLE IF NOT EXISTS product_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('uploaded', 'generated')),
  image_url text NOT NULL,
  prompt text,
  enhanced_prompt text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON product_assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assets"
  ON product_assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON product_assets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create prompt_history table
CREATE TABLE IF NOT EXISTS prompt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_prompt text NOT NULL,
  enhanced_prompt text NOT NULL,
  prompt_type text NOT NULL CHECK (prompt_type IN ('image', 'video')),
  model_used text NOT NULL,
  success_indicators jsonb DEFAULT '{}'::jsonb,
  regenerated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompt history"
  ON prompt_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create prompt history"
  ON prompt_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create video_generations table
CREATE TABLE IF NOT EXISTS video_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_ids uuid[] NOT NULL,
  product_name text NOT NULL,
  product_context text NOT NULL,
  model_used text NOT NULL,
  original_prompt text NOT NULL,
  enhanced_prompt text NOT NULL,
  video_url text,
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video generations"
  ON video_generations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create video generations"
  ON video_generations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'image_gen', 'video_gen', 'refund')),
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions"
  ON credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_assets_user_id ON product_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_product_assets_created_at ON product_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_status ON video_generations(status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, credits, subscription_tier)
  VALUES (NEW.id, 100, 'starter');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();