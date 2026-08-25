# OREOBET deployment

This archive is now a complete Vite/React project at the repository root.

## Render

Use:
- Root Directory: `.`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Do not use `project/` as the root directory.

## Supabase

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Render environment variables.
2. Run `supabase/migrations/20260826_oreobet_profile_fix.sql` in Supabase SQL Editor.
3. For an admin, edit `make-admin.sql` and replace `YOUR_USERNAME_HERE`.

The game pages in this archive are animated frontend/demo UI. Authoritative balances, game results, deposits and withdrawals should remain server-side.
