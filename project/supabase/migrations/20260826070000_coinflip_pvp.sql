-- PvP Coinflip lobby: users create a side, another user joins, server settles once.
CREATE TABLE IF NOT EXISTS public.coinflip_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opponent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_side text NOT NULL CHECK (creator_side IN ('heads','tails')),
  amount numeric NOT NULL CHECK (amount >= 1),
  result_side text CHECK (result_side IN ('heads','tails')),
  winner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','playing','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
);
ALTER TABLE public.coinflip_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coinflip matches read" ON public.coinflip_matches;
CREATE POLICY "coinflip matches read" ON public.coinflip_matches FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "coinflip matches insert" ON public.coinflip_matches;
CREATE POLICY "coinflip matches insert" ON public.coinflip_matches FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_coinflip_match(p_amount numeric,p_side text)
RETURNS public.coinflip_matches LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.profiles; r public.coinflip_matches;
BEGIN
  IF p_amount < 1 THEN RAISE EXCEPTION 'Minimum coinflip is $1'; END IF;
  IF lower(p_side) NOT IN ('heads','tails') THEN RAISE EXCEPTION 'Invalid side'; END IF;
  SELECT * INTO p FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF p.balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE public.profiles SET balance=balance-p_amount WHERE id=p.id;
  INSERT INTO public.coinflip_matches(creator_id,creator_side,amount) VALUES(p.id,lower(p_side),round(p_amount,2)) RETURNING * INTO r;
  RETURN r;
END; $$;
GRANT EXECUTE ON FUNCTION public.create_coinflip_match(numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_coinflip_match(p_match uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.coinflip_matches; p public.profiles; side text; winner uuid; payout numeric;
BEGIN
  SELECT * INTO m FROM public.coinflip_matches WHERE id=p_match FOR UPDATE;
  IF m.id IS NULL OR m.status <> 'open' THEN RAISE EXCEPTION 'Match is no longer open'; END IF;
  IF m.creator_id=auth.uid() THEN RAISE EXCEPTION 'You cannot join your own match'; END IF;
  SELECT * INTO p FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
  IF p.balance < m.amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE public.profiles SET balance=balance-m.amount WHERE id=p.id;
  side := CASE WHEN random() < 0.5 THEN 'heads' ELSE 'tails' END;
  winner := CASE WHEN side=m.creator_side THEN m.creator_id ELSE p.id END;
  payout := round(m.amount*2*0.98,2);
  UPDATE public.profiles SET balance=balance+payout WHERE id=winner;
  UPDATE public.coinflip_matches SET opponent_id=p.id,status='completed',result_side=side,winner_id=winner,settled_at=now() WHERE id=m.id;
  INSERT INTO public.bets(user_id,game,amount,multiplier,payout,result) VALUES(m.creator_id,'Coinflip PvP',m.amount,CASE WHEN winner=m.creator_id THEN 1.96 ELSE 0 END,CASE WHEN winner=m.creator_id THEN payout ELSE 0 END,CASE WHEN winner=m.creator_id THEN 'win' ELSE 'loss' END);
  INSERT INTO public.bets(user_id,game,amount,multiplier,payout,result) VALUES(p.id,'Coinflip PvP',m.amount,CASE WHEN winner=p.id THEN 1.96 ELSE 0 END,CASE WHEN winner=p.id THEN payout ELSE 0 END,CASE WHEN winner=p.id THEN 'win' ELSE 'loss' END);
  RETURN jsonb_build_object('id',m.id,'status','completed','result_side',side,'winner_id',winner,'payout',payout);
END; $$;
GRANT EXECUTE ON FUNCTION public.join_coinflip_match(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_coinflip_match(p_match uuid)
RETURNS public.coinflip_matches LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.coinflip_matches; r public.coinflip_matches;
BEGIN
  SELECT * INTO m FROM public.coinflip_matches WHERE id=p_match FOR UPDATE;
  IF m.id IS NULL OR m.creator_id<>auth.uid() OR m.status<>'open' THEN RAISE EXCEPTION 'Match cannot be cancelled'; END IF;
  UPDATE public.profiles SET balance=balance+m.amount WHERE id=auth.uid();
  UPDATE public.coinflip_matches SET status='cancelled',settled_at=now() WHERE id=m.id RETURNING * INTO r;
  RETURN r;
END; $$;
GRANT EXECUTE ON FUNCTION public.cancel_coinflip_match(uuid) TO authenticated;
