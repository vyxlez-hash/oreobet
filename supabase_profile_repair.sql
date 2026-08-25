-- OREOBET profile repair for existing Supabase users
-- Run once in Supabase SQL Editor.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_chosen boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Existing accounts created before the signup trigger need a profile row.
INSERT INTO public.profiles (id, username, balance, level, verified, username_chosen, is_admin, avatar_url)
SELECT
  u.id,
  left(regexp_replace(coalesce(nullif(u.raw_user_meta_data->>'username',''), split_part(coalesce(u.email,'user'),'@',1)), '[^a-zA-Z0-9_]+', '_', 'g'), 20),
  0, 1, false, false, false,
  'https://api.dicebear.com/9.x/adventurer/svg?seed=' || replace(u.id::text,'-','')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id=u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Repair duplicate username collisions from the backfill by giving affected users a stable suffix.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.id, p.username FROM public.profiles p WHERE p.username IN (SELECT username FROM public.profiles GROUP BY username HAVING count(*) > 1) LOOP
    UPDATE public.profiles SET username=left(regexp_replace(coalesce(r.username,'user'),'[^a-zA-Z0-9_]+','_','g'),15) || '_' || substr(replace(r.id::text,'-',''),1,4) WHERE id=r.id;
  END LOOP;
END $$;

-- Allow a signed-in user to create only their own profile if a trigger/backfill missed it.
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id AND coalesce(is_admin,false)=false AND coalesce(balance,0)=0);

-- Existing users can read all profiles for avatars/usernames; only owners can update.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_all_profiles" ON public.profiles;
CREATE POLICY "select_all_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()=id) WITH CHECK (auth.uid()=id);
