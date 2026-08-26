# OREOBET Chat + Games Update

## 1. Supabase
Run **all** SQL migrations in `supabase/migrations/` in Supabase SQL Editor, including:

- `20260824174612_oreobet_schema.sql`
- `20260825020000_profile_avatars.sql`
- `20260825120000_chat_games.sql`

The new migration adds:

- deterministic illustrated SVG avatars (generated in the browser from username)
- chat roles: Member, VIP, Moderator, Admin
- server-enforced chat roles and mute protection
- `/clear`
- `/mute username [minutes]`
- `/unmute username`
- `/rain start amount minutes` with a 1–30 minute limit
- `/tip username amount`
- clickable chat profiles with stats and a Tip button
- atomic server-side game settlement for Dice, Crash, Roulette, Blackjack, Coinflip and Mines
- admin role management

## 2. Admin
An admin can set roles from Dashboard -> Admin -> Role.
Your existing `is_admin = true` account is treated as Admin.

## 3. Render
Keep:

- Root Directory: `project`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

## 4. Important
The game settlement function is intended for this prototype. For a production real-money casino, replace the random outcome logic with a reviewed provably-fair server/edge-function implementation and add the required legal/compliance controls.
