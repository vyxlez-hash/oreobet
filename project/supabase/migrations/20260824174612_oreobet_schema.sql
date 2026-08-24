/*
# OREOBET Core Schema — profiles, transactions, bets, chat_messages

## Overview
Creates the core data layer for OREOBET, a crypto gaming platform.
Users authenticate via Supabase Auth (email/password). This migration
creates supporting tables for user profiles (with USD balance), deposit/
withdraw transactions, bet history, and a global live chat.

## Tables

### 1. profiles
- `id` (uuid, PK, references auth.users) — one row per user
- `username` (text, unique) — display name
- `balance` (numeric, default 0) — USD balance for gaming
- `level` (int, default 1) — player level
- `verified` (boolean, default false) — KYC status
- `created_at` (timestamptz)

### 2. transactions
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, default auth.uid())
- `type` (text) — 'deposit' | 'withdraw'
- `amount` (numeric) — USD amount
- `currency` (text) — 'LTC' | 'SOL' | 'ETH'
- `status` (text, default 'pending') — 'pending' | 'completed' | 'failed'
- `tx_hash` (text) — crypto transaction hash
- `created_at` (timestamptz)

### 3. bets
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, default auth.uid())
- `game` (text) — game name
- `amount` (numeric) — USD bet amount
- `multiplier` (numeric) — payout multiplier
- `payout` (numeric) — USD payout (0 if loss)
- `result` (text) — 'win' | 'loss'
- `created_at` (timestamptz)

### 4. chat_messages
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, default auth.uid())
- `username` (text) — denormalized for read performance
- `message` (text) — chat content
- `created_at` (timestamptz)

## Security (RLS)
- profiles: owner-scoped update, all authenticated can SELECT (for usernames)
- transactions: owner-scoped CRUD
- bets: owner-scoped CRUD
- chat_messages: all authenticated can SELECT (global chat), owner-scoped INSERT/DELETE
- All owner columns default to auth.uid()
*/

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  balance numeric DEFAULT 0,
  level int DEFAULT 1,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_profiles" ON profiles;
CREATE POLICY "select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  amount numeric NOT NULL,
  currency text NOT NULL CHECK (currency IN ('LTC', 'SOL', 'ETH')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  tx_hash text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- bets table
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  game text NOT NULL,
  amount numeric NOT NULL,
  multiplier numeric NOT NULL DEFAULT 0,
  payout numeric NOT NULL DEFAULT 0,
  result text NOT NULL CHECK (result IN ('win', 'loss')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bets" ON bets;
CREATE POLICY "select_own_bets" ON bets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bets" ON bets;
CREATE POLICY "insert_own_bets" ON bets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bets" ON bets;
CREATE POLICY "update_own_bets" ON bets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_chat" ON chat_messages;
CREATE POLICY "select_all_chat" ON chat_messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_chat" ON chat_messages;
CREATE POLICY "insert_own_chat" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chat" ON chat_messages;
CREATE POLICY "delete_own_chat" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages(created_at DESC);


-- Automatically create a profile for every newly registered auth user.
-- This is important when email confirmation is enabled because the browser
-- does not have an authenticated session immediately after signUp().
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
BEGIN
  base_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(COALESCE(NEW.email, 'user'), '@', 1)
  );

  -- Keep usernames within the UI's 20 character limit.
  base_username := left(base_username, 20);
  final_username := base_username;

  -- Make the username unique if necessary.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) THEN
    final_username := left(base_username, 15) || '_' ||
      substr(replace(NEW.id::text, '-', ''), 1, 4);
  END IF;

  INSERT INTO public.profiles (id, username, balance, level, verified, username_chosen)
  VALUES (NEW.id, final_username, 0, 1, false, false)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Username onboarding + admin balance controls
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username_chosen boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Secure server-side balance adjustment. Only profiles marked is_admin can use it.
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  target_username text,
  amount_delta numeric
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
  updated_profile public.profiles;
BEGIN
  SELECT is_admin INTO caller_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF COALESCE(caller_is_admin, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF amount_delta = 0 THEN
    RAISE EXCEPTION 'Amount must not be zero';
  END IF;

  IF amount_delta < -1000000 OR amount_delta > 1000000 THEN
    RAISE EXCEPTION 'Amount is outside the allowed range';
  END IF;

  UPDATE public.profiles
  SET balance = GREATEST(0, balance + amount_delta)
  WHERE lower(username) = lower(trim(target_username))
  RETURNING * INTO updated_profile;

  IF updated_profile.id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN updated_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_balance(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance(text, numeric) TO authenticated;
