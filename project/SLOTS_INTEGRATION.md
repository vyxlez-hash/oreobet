# Slots integration notes

The frontend can host a slots lobby, but real-money/provider slots should be connected through a licensed game provider's official API/SDK rather than scraping or embedding another casino.

Recommended architecture:
1. React lobby -> your backend/edge function.
2. Backend authenticates the user and creates a provider game session.
3. Provider returns an official launch URL/token or SDK session.
4. Provider sends round/wallet callbacks to your backend.
5. Your backend verifies callbacks and updates the user's wallet atomically.
6. Never put provider secrets in Vite/React client code.

For this project, Supabase Edge Functions are a reasonable backend layer for provider authentication, callbacks, and wallet reconciliation.
