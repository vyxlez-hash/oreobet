
-- OREOBET social + game expansion
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS muted_until timestamptz;

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'user';

UPDATE public.profiles
SET role = 'admin'
WHERE is_admin = true;

UPDATE public.chat_messages cm
SET role = COALESCE(p.role, CASE WHEN p.is_admin THEN 'admin' ELSE 'member' END)
FROM public.profiles p
WHERE p.id = cm.user_id;

CREATE TABLE IF NOT EXISTS public.rain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL CHECK (amount > 0),
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 1 AND 30),
  started_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.rain_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_active_rain" ON public.rain_events;
CREATE POLICY "select_active_rain" ON public.rain_events FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.is_chat_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (is_admin = true OR role IN ('admin','moderator'))
  );
$$;

CREATE OR REPLACE FUNCTION public.clear_chat()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF NOT public.is_chat_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.chat_messages;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  INSERT INTO public.chat_messages (user_id, username, role, message_type, message)
  VALUES (auth.uid(), 'System', 'system', 'system', 'Chat was cleared by a moderator.');

  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.mute_user(target_username text, duration_minutes integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
  until_time timestamptz;
BEGIN
  IF NOT public.is_chat_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF duration_minutes < 1 OR duration_minutes > 1440 THEN
    RAISE EXCEPTION 'Mute duration must be between 1 and 1440 minutes';
  END IF;

  SELECT id INTO target_id FROM public.profiles
  WHERE lower(username) = lower(trim(target_username));
  IF target_id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF target_id = auth.uid() THEN RAISE EXCEPTION 'You cannot mute yourself'; END IF;

  until_time := now() + make_interval(mins => duration_minutes);
  UPDATE public.profiles SET muted_until = until_time WHERE id = target_id;

  RETURN jsonb_build_object('username', trim(target_username), 'muted_until', until_time);
END;
$$;

CREATE OR REPLACE FUNCTION public.unmute_user(target_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_chat_staff() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.profiles SET muted_until = NULL
  WHERE lower(username) = lower(trim(target_username));
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_rain(rain_amount numeric, duration_minutes integer)
RETURNS public.rain_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_row public.rain_events;
  caller_name text;
BEGIN
  IF NOT public.is_chat_staff() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF rain_amount <= 0 THEN RAISE EXCEPTION 'Rain amount must be greater than zero'; END IF;
  IF duration_minutes < 1 OR duration_minutes > 30 THEN
    RAISE EXCEPTION 'Rain duration must be between 1 and 30 minutes';
  END IF;

  UPDATE public.rain_events SET active = false WHERE active = true AND ends_at <= now();
  UPDATE public.rain_events SET active = false WHERE active = true;

  SELECT username INTO caller_name FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.rain_events (amount, duration_minutes, started_by, ends_at, active)
  VALUES (rain_amount, duration_minutes, auth.uid(), now() + make_interval(mins => duration_minutes), true)
  RETURNING * INTO event_row;

  INSERT INTO public.chat_messages (user_id, username, role, message_type, message)
  VALUES (
    auth.uid(), 'System', 'system', 'system',
    format('🌧 Rain started by @%s: $%s pool for %s minute%s.', caller_name, to_char(rain_amount, 'FM999999990.00'), duration_minutes, CASE WHEN duration_minutes = 1 THEN '' ELSE 's' END)
  );

  RETURN event_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.tip_user(target_username text, tip_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender public.profiles;
  receiver public.profiles;
BEGIN
  IF tip_amount <= 0 OR tip_amount > 100000 THEN RAISE EXCEPTION 'Invalid tip amount'; END IF;

  SELECT * INTO sender FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  SELECT * INTO receiver FROM public.profiles
  WHERE lower(username) = lower(trim(target_username)) FOR UPDATE;

  IF receiver.id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF receiver.id = sender.id THEN RAISE EXCEPTION 'You cannot tip yourself'; END IF;
  IF COALESCE(sender.balance,0) < tip_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.profiles SET balance = balance - tip_amount WHERE id = sender.id;
  UPDATE public.profiles SET balance = balance + tip_amount WHERE id = receiver.id;

  RETURN jsonb_build_object(
    'from', sender.username,
    'to', receiver.username,
    'amount', tip_amount,
    'receiver_balance', receiver.balance + tip_amount
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_user_stats(target_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  p public.profiles;
  total_wagered numeric;
  total_won integer;
  total_lost integer;
  games_played integer;
BEGIN
  SELECT * INTO p FROM public.profiles
  WHERE lower(username) = lower(trim(target_username));
  IF p.id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  SELECT COALESCE(SUM(amount),0), COUNT(*) FILTER (WHERE result='win'), COUNT(*) FILTER (WHERE result='loss'), COUNT(*)
  INTO total_wagered, total_won, total_lost, games_played
  FROM public.bets WHERE user_id = p.id;

  RETURN jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'balance', p.balance,
    'level', p.level,
    'verified', p.verified,
    'role', CASE WHEN p.is_admin THEN 'admin' ELSE p.role END,
    'created_at', p.created_at,
    'total_wagered', total_wagered,
    'wins', total_won,
    'losses', total_lost,
    'games_played', games_played
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_role(target_username text, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF new_role NOT IN ('member','vip','moderator','admin') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  UPDATE public.profiles SET role = new_role WHERE lower(username) = lower(trim(target_username));
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  RETURN true;
END;
$$;

-- Atomic server-side game round. This keeps the balance mutation off the browser.
CREATE OR REPLACE FUNCTION public.play_casino_game(p_game text, p_amount numeric, p_choice text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  player public.profiles;
  roll numeric;
  outcome numeric;
  won boolean := false;
  multiplier numeric := 0;
  payout numeric := 0;
  detail jsonb := '{}'::jsonb;
  target numeric;
  choice_num integer;
  mine_count integer;
  cell integer;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Bet must be greater than zero'; END IF;

  SELECT * INTO player FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF player.id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF COALESCE(player.muted_until, now()) > now() THEN
    -- Muting only affects chat, not games; keep this branch intentionally absent.
  END IF;
  IF player.balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  IF p_game = 'Dice' THEN
    target := split_part(p_choice, ':', 2)::numeric;
    IF target < 2 OR target > 98 THEN RAISE EXCEPTION 'Invalid dice target'; END IF;
    roll := floor(random() * 10000) / 100;
    IF split_part(p_choice, ':', 1) = 'under' THEN
      won := roll < target;
    ELSE
      won := roll > target;
    END IF;
    multiplier := round((99 / CASE WHEN split_part(p_choice, ':', 1) = 'under' THEN target ELSE 100-target END)::numeric, 2);
    detail := jsonb_build_object('roll', roll, 'target', target, 'mode', split_part(p_choice, ':', 1));
  ELSIF p_game = 'Coinflip' THEN
    roll := random();
    won := (roll < 0.5 AND lower(p_choice)='heads') OR (roll >= 0.5 AND lower(p_choice)='tails');
    multiplier := 1.96;
    detail := jsonb_build_object('side', CASE WHEN roll < 0.5 THEN 'heads' ELSE 'tails' END);
  ELSIF p_game = 'Roulette' THEN
    choice_num := CASE WHEN p_choice ~ '^([0-9]|[1-2][0-9]|3[0-6])$' THEN p_choice::integer ELSE -1 END;
    roll := floor(random() * 37);
    IF choice_num >= 0 THEN
      won := roll = choice_num; multiplier := 35;
      detail := jsonb_build_object('number', roll, 'bet_type', 'number', 'choice', choice_num);
    ELSE
      won := (roll % 2 = 0 AND lower(p_choice)='black') OR (roll % 2 = 1 AND lower(p_choice)='red');
      IF roll = 0 THEN won := false; END IF;
      multiplier := 1.95;
      detail := jsonb_build_object('number', roll, 'bet_type', lower(p_choice));
    END IF;
  ELSIF p_game = 'Crash' THEN
    target := p_choice::numeric;
    IF target < 1.2 OR target > 50 THEN RAISE EXCEPTION 'Crash target must be 1.2x to 50x'; END IF;
    -- 1% house edge style crash distribution.
    roll := greatest(1.00, floor(((1 / greatest(random(),0.000001)) * 0.99) * 100) / 100);
    won := roll >= target;
    multiplier := target;
    detail := jsonb_build_object('crash', least(roll, 100000), 'cashout', target);
  ELSIF p_game = 'Blackjack' THEN
    -- Quick blackjack round: server generates player/dealer totals and settles atomically.
    outcome := floor(random()*10) + 12; -- 12..21
    target := floor(random()*5) + 17; -- 17..21
    won := outcome > target;
    multiplier := CASE WHEN outcome = 21 AND outcome > target THEN 2.5 WHEN won THEN 2 ELSE 0 END;
    IF outcome = target THEN multiplier := 1; won := true; END IF;
    detail := jsonb_build_object('player_total', outcome, 'dealer_total', target);
  ELSIF p_game = 'Mines' THEN
    mine_count := split_part(p_choice, ':', 1)::integer;
    cell := split_part(p_choice, ':', 2)::integer;
    IF mine_count < 1 OR mine_count > 24 OR cell < 0 OR cell > 24 THEN RAISE EXCEPTION 'Invalid mines selection'; END IF;
    roll := floor(random()*25);
    won := roll <> cell;
    multiplier := round((25.0 / (25-mine_count)) * 0.96, 2);
    detail := jsonb_build_object('mine_count', mine_count, 'cell', cell, 'mine', CASE WHEN won THEN floor(random()*25) ELSE cell END);
  ELSE
    RAISE EXCEPTION 'Unknown game';
  END IF;

  IF multiplier = 1 AND won THEN payout := p_amount; ELSE payout := CASE WHEN won THEN round(p_amount * multiplier, 2) ELSE 0 END; END IF;

  UPDATE public.profiles SET balance = balance - p_amount + payout WHERE id = player.id;
  INSERT INTO public.bets (user_id, game, amount, multiplier, payout, result)
  VALUES (player.id, p_game, p_amount, CASE WHEN won THEN multiplier ELSE 0 END, payout, CASE WHEN won THEN 'win' ELSE 'loss' END);

  RETURN detail || jsonb_build_object(
    'won', won,
    'multiplier', CASE WHEN won THEN multiplier ELSE 0 END,
    'payout', payout,
    'balance', player.balance - p_amount + payout
  );
END;
$$;

REVOKE ALL ON FUNCTION public.play_casino_game(text,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.play_casino_game(text,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tip_user(text,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_user_stats(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_chat() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mute_user(text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unmute_user(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_rain(numeric,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.prepare_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.profiles;
  staff boolean;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
  IF p.id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  staff := (p.is_admin = true OR p.role IN ('admin','moderator'));

  IF NEW.message_type = 'system' AND staff THEN
    NEW.user_id := auth.uid();
    NEW.username := 'System';
    NEW.role := 'system';
    RETURN NEW;
  END IF;

  IF p.muted_until IS NOT NULL AND p.muted_until > now() THEN
    RAISE EXCEPTION 'You are muted until %', p.muted_until;
  END IF;

  NEW.user_id := auth.uid();
  NEW.username := p.username;
  NEW.role := CASE WHEN p.is_admin THEN 'admin' ELSE p.role END;
  NEW.message_type := 'user';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepare_chat_message ON public.chat_messages;
CREATE TRIGGER prepare_chat_message
BEFORE INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.prepare_chat_message();
