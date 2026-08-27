-- OREOBET wallet requests, admin crypto addresses, manual blackjack, crash and roulette.
-- Run after the existing OREOBET migrations.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS wallet_address text,
  ADD COLUMN IF NOT EXISTS admin_note text;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_currency_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_currency_check CHECK (currency IN ('LTC','SOL','ETH','BTC'));

CREATE TABLE IF NOT EXISTS public.crypto_addresses (
  currency text PRIMARY KEY CHECK (currency IN ('LTC','SOL','ETH','BTC')),
  address text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.crypto_addresses ENABLE ROW LEVEL SECURITY;

INSERT INTO public.crypto_addresses(currency,address) VALUES
('BTC',''),('SOL',''),('LTC',''),('ETH','')
ON CONFLICT(currency) DO NOTHING;

DROP POLICY IF EXISTS "crypto addresses authenticated read" ON public.crypto_addresses;
CREATE POLICY "crypto addresses authenticated read" ON public.crypto_addresses
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_transactions" ON public.transactions;
DROP POLICY IF EXISTS "update_own_transactions" ON public.transactions;
DROP POLICY IF EXISTS "admin transaction read" ON public.transactions;
CREATE POLICY "admin transaction read" ON public.transactions
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.is_admin=true));

DROP POLICY IF EXISTS "admin transaction update" ON public.transactions;
CREATE POLICY "admin transaction update" ON public.transactions
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.is_admin=true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.is_admin=true));

CREATE OR REPLACE FUNCTION public.get_crypto_addresses()
RETURNS SETOF public.crypto_addresses
LANGUAGE sql SECURITY DEFINER STABLE SET search_path=public AS $$
  SELECT * FROM public.crypto_addresses ORDER BY CASE currency WHEN 'BTC' THEN 1 WHEN 'SOL' THEN 2 WHEN 'LTC' THEN 3 ELSE 4 END;
$$;
GRANT EXECUTE ON FUNCTION public.get_crypto_addresses() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_deposit_request(p_currency text,p_amount numeric,p_tx_hash text DEFAULT NULL)
RETURNS public.transactions
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.transactions;
BEGIN
  IF p_currency NOT IN ('BTC','SOL','LTC','ETH') THEN RAISE EXCEPTION 'Unsupported currency'; END IF;
  IF p_amount < 1 THEN RAISE EXCEPTION 'Minimum deposit is $1'; END IF;
  INSERT INTO public.transactions(user_id,type,amount,currency,status,tx_hash)
  VALUES(auth.uid(),'deposit',round(p_amount,2),p_currency,'pending',NULLIF(trim(p_tx_hash),'')) RETURNING * INTO r;
  RETURN r;
END; $$;
GRANT EXECUTE ON FUNCTION public.create_deposit_request(text,numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_withdraw_request(p_currency text,p_amount numeric,p_wallet text)
RETURNS public.transactions
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.transactions; p public.profiles;
BEGIN
  IF p_currency NOT IN ('BTC','SOL','LTC','ETH') THEN RAISE EXCEPTION 'Unsupported currency'; END IF;
  IF p_amount < 1 THEN RAISE EXCEPTION 'Minimum withdrawal is $1'; END IF;
  IF length(trim(p_wallet)) < 8 THEN RAISE EXCEPTION 'Enter a valid wallet address'; END IF;
  SELECT * INTO p FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
  IF p.balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE public.profiles SET balance=balance-p_amount WHERE id=p.id;
  INSERT INTO public.transactions(user_id,type,amount,currency,status,wallet_address)
  VALUES(p.id,'withdraw',round(p_amount,2),p_currency,'pending',trim(p_wallet)) RETURNING * INTO r;
  RETURN r;
END; $$;
GRANT EXECUTE ON FUNCTION public.create_withdraw_request(text,numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_crypto_address(p_currency text,p_address text)
RETURNS public.crypto_addresses
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.crypto_addresses;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin=true) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_currency NOT IN ('BTC','SOL','LTC','ETH') THEN RAISE EXCEPTION 'Unsupported currency'; END IF;
  IF length(trim(p_address)) < 8 THEN RAISE EXCEPTION 'Address is too short'; END IF;
  UPDATE public.crypto_addresses SET address=trim(p_address),updated_at=now(),updated_by=auth.uid() WHERE currency=p_currency RETURNING * INTO r;
  RETURN r;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_update_crypto_address(text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_transaction(p_id uuid,p_status text,p_note text DEFAULT NULL)
RETURNS public.transactions
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.transactions; old public.transactions;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin=true) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_status NOT IN ('pending','completed','failed') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT * INTO old FROM public.transactions WHERE id=p_id FOR UPDATE;
  IF old.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF old.status='completed' AND p_status<>'completed' THEN RAISE EXCEPTION 'Completed requests cannot be changed'; END IF;
  IF old.status='pending' AND p_status='completed' AND old.type='deposit' THEN
    UPDATE public.profiles SET balance=balance+old.amount WHERE id=old.user_id;
  ELSIF old.status='pending' AND p_status='failed' AND old.type='withdraw' THEN
    UPDATE public.profiles SET balance=balance+old.amount WHERE id=old.user_id;
  END IF;
  UPDATE public.transactions SET status=p_status,admin_note=NULLIF(trim(p_note),'') WHERE id=p_id RETURNING * INTO r;
  RETURN r;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_update_transaction(uuid,text,text) TO authenticated;

-- Manual blackjack state.
DROP POLICY IF EXISTS "insert_own_bets" ON public.bets;
DROP POLICY IF EXISTS "update_own_bets" ON public.bets;

CREATE TABLE IF NOT EXISTS public.blackjack_hands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bet numeric NOT NULL,
  current_bet numeric NOT NULL,
  player_cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  dealer_cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','won','lost','push')),
  payout numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
);
ALTER TABLE public.blackjack_hands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own blackjack hands" ON public.blackjack_hands;
CREATE POLICY "own blackjack hands" ON public.blackjack_hands FOR SELECT TO authenticated USING(auth.uid()=user_id);

CREATE OR REPLACE FUNCTION public.bj_card() RETURNS jsonb LANGUAGE plpgsql VOLATILE AS $$
DECLARE n int; s text;
BEGIN
 n:=floor(random()*13)+1; s:=CASE floor(random()*4)::int WHEN 0 THEN '♠' WHEN 1 THEN '♥' WHEN 2 THEN '♦' ELSE '♣' END;
 RETURN jsonb_build_object('rank',CASE WHEN n=1 THEN 'A' WHEN n=11 THEN 'J' WHEN n=12 THEN 'Q' WHEN n=13 THEN 'K' ELSE n::text END,'suit',s,'value',CASE WHEN n>10 THEN 10 ELSE n END);
END; $$;

-- Replace total helper with a simpler robust ace calculation.
CREATE OR REPLACE FUNCTION public.bj_total(cards jsonb) RETURNS int LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE c jsonb; total int:=0; aces int:=0; v int;
BEGIN
 FOR c IN SELECT * FROM jsonb_array_elements(cards) LOOP total:=total+(c->>'value')::int; IF c->>'rank'='A' THEN aces:=aces+1; END IF; END LOOP;
 WHILE total>21 AND aces>0 LOOP total:=total-10; aces:=aces-1; END LOOP; RETURN total;
END; $$;

CREATE OR REPLACE FUNCTION public.blackjack_start(p_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.profiles; h public.blackjack_hands; cards jsonb; dealer jsonb;
BEGIN
 IF p_amount<1 THEN RAISE EXCEPTION 'Minimum bet is $1'; END IF;
 SELECT * INTO p FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 IF p.balance<p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
 IF EXISTS(SELECT 1 FROM public.blackjack_hands WHERE user_id=p.id AND status='active') THEN RAISE EXCEPTION 'Finish your current hand first'; END IF;
 cards=jsonb_build_array(public.bj_card(),public.bj_card()); dealer=jsonb_build_array(public.bj_card(),public.bj_card());
 UPDATE public.profiles SET balance=balance-p_amount WHERE id=p.id;
 INSERT INTO public.blackjack_hands(user_id,bet,current_bet,player_cards,dealer_cards) VALUES(p.id,p_amount,p_amount,cards,dealer) RETURNING * INTO h;
 RETURN jsonb_build_object('id',h.id,'player_cards',h.player_cards,'dealer_cards',jsonb_build_array(h.dealer_cards->0),'player_total',public.bj_total(h.player_cards),'dealer_total',public.bj_total(jsonb_build_array(h.dealer_cards->0)),'status','active');
END; $$;
GRANT EXECUTE ON FUNCTION public.blackjack_start(numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.blackjack_action(p_hand uuid,p_action text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE h public.blackjack_hands; p public.profiles; pc jsonb; dc jsonb; pt int; dt int; payout numeric:=0; newcard jsonb;
BEGIN
 SELECT * INTO h FROM public.blackjack_hands WHERE id=p_hand AND user_id=auth.uid() FOR UPDATE;
 IF h.id IS NULL OR h.status<>'active' THEN RAISE EXCEPTION 'No active hand'; END IF;
 SELECT * INTO p FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 pc:=h.player_cards; dc:=h.dealer_cards;
 IF p_action='double' THEN
   IF jsonb_array_length(pc)<>2 THEN RAISE EXCEPTION 'Double is only available on the first two cards'; END IF;
   IF p.balance<h.bet THEN RAISE EXCEPTION 'Insufficient balance to double'; END IF;
   UPDATE public.profiles SET balance=balance-h.bet WHERE id=p.id; h.current_bet:=h.bet*2; pc:=pc||jsonb_build_array(public.bj_card());
   pt:=public.bj_total(pc); IF pt>21 THEN h.status:='lost'; h.payout:=0; h.settled_at:=now();
   END IF;
 ELSIF p_action='hit' THEN pc:=pc||jsonb_build_array(public.bj_card()); pt:=public.bj_total(pc); IF pt>21 THEN h.status:='lost'; h.payout:=0; h.settled_at:=now(); END IF;
 ELSIF p_action='stand' OR (p_action='double' AND h.status='active') THEN
   pt:=public.bj_total(pc); dt:=public.bj_total(dc);
   WHILE dt<17 LOOP dc:=dc||jsonb_build_array(public.bj_card()); dt:=public.bj_total(dc); END LOOP;
   IF dt>21 OR pt>dt THEN h.status:='won'; payout:=h.current_bet*2; ELSIF pt=dt THEN h.status:='push'; payout:=h.current_bet; ELSE h.status:='lost'; payout:=0; END IF;
   h.payout:=payout; h.settled_at:=now();
 ELSE RAISE EXCEPTION 'Invalid blackjack action'; END IF;
 h.player_cards:=pc; h.dealer_cards:=dc;
 UPDATE public.blackjack_hands SET player_cards=h.player_cards,dealer_cards=h.dealer_cards,current_bet=h.current_bet,status=h.status,payout=h.payout,settled_at=h.settled_at WHERE id=h.id;
 IF h.status<>'active' THEN UPDATE public.profiles SET balance=balance+h.payout WHERE id=p.id; INSERT INTO public.bets(user_id,game,amount,multiplier,payout,result) VALUES(p.id,'Blackjack',h.bet,CASE WHEN h.payout>0 THEN h.payout/h.current_bet ELSE 0 END,h.payout,CASE WHEN h.status='lost' THEN 'loss' ELSE 'win' END); END IF;
 RETURN jsonb_build_object('id',h.id,'player_cards',h.player_cards,'dealer_cards',CASE WHEN h.status='active' THEN jsonb_build_array(h.dealer_cards->0) ELSE h.dealer_cards END,'player_total',public.bj_total(h.player_cards),'dealer_total',public.bj_total(CASE WHEN h.status='active' THEN jsonb_build_array(h.dealer_cards->0) ELSE h.dealer_cards END),'status',h.status,'payout',h.payout,'current_bet',h.current_bet);
END; $$;
GRANT EXECUTE ON FUNCTION public.blackjack_action(uuid,text) TO authenticated;

-- Crash round state. Client receives the round point for this prototype; production should hide it behind a server-authoritative ticker.
CREATE TABLE IF NOT EXISTS public.crash_rounds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 bet numeric NOT NULL, crash_point numeric NOT NULL, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','cashed','crashed')),
 cashout_multiplier numeric, payout numeric DEFAULT 0, created_at timestamptz DEFAULT now(), settled_at timestamptz
);
ALTER TABLE public.crash_rounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own crash rounds" ON public.crash_rounds;
CREATE POLICY "own crash rounds" ON public.crash_rounds FOR SELECT TO authenticated USING(auth.uid()=user_id);

CREATE OR REPLACE FUNCTION public.crash_start(p_amount numeric) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.profiles; r public.crash_rounds; cp numeric;
BEGIN
 IF p_amount<1 THEN RAISE EXCEPTION 'Minimum bet is $1'; END IF;
 SELECT * INTO p FROM public.profiles WHERE id=auth.uid() FOR UPDATE; IF p.balance<p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
 IF EXISTS(SELECT 1 FROM public.crash_rounds WHERE user_id=p.id AND status='active') THEN RAISE EXCEPTION 'Finish current crash round'; END IF;
 cp:=greatest(1.01,least(1000,round(((1/greatest(random(),0.01))*0.97)::numeric,2)));
 UPDATE public.profiles SET balance=balance-p_amount WHERE id=p.id;
 INSERT INTO public.crash_rounds(user_id,bet,crash_point) VALUES(p.id,p_amount,cp) RETURNING * INTO r;
 RETURN jsonb_build_object('id',r.id,'crash_point',r.crash_point,'status','active');
END; $$;
GRANT EXECUTE ON FUNCTION public.crash_start(numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.crash_cashout(p_id uuid,p_multiplier numeric) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.crash_rounds; payout numeric;
BEGIN
 SELECT * INTO r FROM public.crash_rounds WHERE id=p_id AND user_id=auth.uid() FOR UPDATE; IF r.id IS NULL OR r.status<>'active' THEN RAISE EXCEPTION 'Round is no longer active'; END IF;
 IF p_multiplier>r.crash_point THEN
   UPDATE public.crash_rounds SET status='crashed',settled_at=now() WHERE id=r.id;
   INSERT INTO public.bets(user_id,game,amount,multiplier,payout,result) VALUES(auth.uid(),'Crash',r.bet,0,0,'loss');
   RETURN jsonb_build_object('status','crashed','payout',0,'crash_point',r.crash_point);
 END IF;
 payout:=round(r.bet*p_multiplier,2);
 UPDATE public.profiles SET balance=balance+payout WHERE id=auth.uid();
 UPDATE public.crash_rounds SET status='cashed',cashout_multiplier=p_multiplier,payout=payout,settled_at=now() WHERE id=r.id;
 INSERT INTO public.bets(user_id,game,amount,multiplier,payout,result) VALUES(auth.uid(),'Crash',r.bet,p_multiplier,payout,'win');
 RETURN jsonb_build_object('status','cashed','payout',payout,'crash_point',r.crash_point);
END; $$;
GRANT EXECUTE ON FUNCTION public.crash_cashout(uuid,numeric) TO authenticated;

-- Roulette: red/yellow 2x, green 14.7x. Green is deliberately rare.
CREATE OR REPLACE FUNCTION public.play_roulette(p_amount numeric,p_color text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.profiles; r numeric; outcome text; mult numeric; won boolean; payout numeric:=0;
BEGIN
 IF p_amount<1 THEN RAISE EXCEPTION 'Minimum bet is $1'; END IF; IF lower(p_color) NOT IN ('red','yellow','green') THEN RAISE EXCEPTION 'Invalid color'; END IF;
 SELECT * INTO p FROM public.profiles WHERE id=auth.uid() FOR UPDATE; IF p.balance<p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
 r:=random(); IF r<0.483 THEN outcome:='red'; ELSIF r<0.966 THEN outcome:='yellow'; ELSE outcome:='green'; END IF;
 mult:=CASE outcome WHEN 'green' THEN 14.7 ELSE 2 END; won:=lower(p_color)=outcome; IF won THEN payout:=round(p_amount*mult,2); END IF;
 UPDATE public.profiles SET balance=balance-p_amount+payout WHERE id=p.id;
 INSERT INTO public.bets(user_id,game,amount,multiplier,payout,result) VALUES(p.id,'Roulette',p_amount,CASE WHEN won THEN mult ELSE 0 END,payout,CASE WHEN won THEN 'win' ELSE 'loss' END);
 RETURN jsonb_build_object('won',won,'color',outcome,'multiplier',CASE WHEN won THEN mult ELSE 0 END,'payout',payout);
END; $$;
GRANT EXECUTE ON FUNCTION public.play_roulette(numeric,text) TO authenticated;
