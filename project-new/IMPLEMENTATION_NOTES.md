# OREOBET implementation notes

## Included changes

- Blackjack is manual: Deal Hand, Hit, Double, Stand.
- Blackjack dealer reveals/plays only after Stand or Double.
- Crash has a rocket animation, live multiplier and CASH OUT button next to the launch button.
- Roulette uses a horizontal sliding reel with a visible pattern. Red = 2x, Yellow = 2x, Green = 14.7x. It auto-spins visually on a cooldown even when nobody has a bet.
- Roulette bets are only charged when the user explicitly presses BET & SPIN. Automatic spins without a bet are visual-only.
- Deposit modal supports BTC, SOL, LTC and ETH, minimum $1, optional transaction hash, and creates a pending request instead of immediately crediting the account.
- Withdrawals support BTC, SOL, LTC and ETH, minimum $1, reserve the user's balance immediately, and create a pending request for admin review.
- Admin dashboard has editable deposit addresses and a full deposit/withdraw request table showing the requesting user, amount, coin, hash/wallet and status.
- Only admins can approve/fail requests or change deposit addresses.
- Home is hidden from the navigation after login and the authenticated landing page is Games.
- Game cooldowns remain enforced in the UI; wallet changes are server-side.

## Supabase migration

Run the existing migrations first, then:

`supabase/migrations/20260826050000_wallet_blackjack_games.sql`

The migration adds the wallet request flow, admin crypto-address controls, manual blackjack state, crash rounds, and roulette settlement.

## Important production note

This is still a prototype casino implementation. Before accepting real money, move game secrets/outcomes fully server-side, use a reviewed provably-fair scheme, add idempotency and audit logging, verify blockchain deposits independently, implement a real crypto payment provider/wallet infrastructure, and complete the legal/KYC/AML/licensing requirements for the jurisdictions where the service is offered.
