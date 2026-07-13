# AdvisorFlow AI — Billing

## Plans

| Plan | Price | Key limits |
|------|-------|------------|
| **Free** | $0 | 50 contacts, Today's 3, template-only drafts |
| **Solo Pro** | $39/mo | 2,000 contacts, Today's list of 5, 500 AI gens/mo, 14-day trial |
| **Team** | $99/mo + seats | NB sync, 10,000 contacts/org, 2,000 AI gens/mo |
| **Brokerage** | Custom | White-label, SSO — contact sales |

Entitlements are enforced in **server actions** (`src/lib/billing/entitlements.ts`), not UI-only.

## Stripe setup

1. Create products/prices in Stripe Dashboard:
   - `solo_pro_monthly` → set `STRIPE_PRICE_SOLO_PRO`
   - `team_monthly` → set `STRIPE_PRICE_TEAM`

2. Set environment variables:

   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_SOLO_PRO=price_...
   STRIPE_PRICE_TEAM=price_...
   NEXT_PUBLIC_APP_URL=https://app.advisorflow.ai
   ```

3. Webhook endpoint: `POST /api/billing/webhook`

   Events to enable:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

4. Customer Portal: enable in Stripe Dashboard (Settings → Billing → Customer portal).

## User flows

- **Signup** → free org created automatically (`Organization` + `OrganizationMember`).
- **Upgrade** → Settings or `/pricing` → Stripe Checkout → webhook updates `Organization.plan`.
- **Manage** → Settings → Stripe Customer Portal (cancel, update card).

## Solo Pro trial

14-day trial on first Solo Pro checkout (`TRIAL_DAYS` in `src/lib/billing/plans.ts`). Trial status stored on `Organization.trialEndsAt` and `subscriptionStatus`.

## What each plan gates

| Feature | Enforced in |
|---------|-------------|
| OpenAI drafts/briefs | `requireAiGeneration()` in `src/lib/actions/ai.ts` |
| Contact import limit | `requireContactCapacity()` in contacts/import actions |
| NB sync | `requireNbSync()` in `src/lib/actions/nb-sync.ts` |
| Today's N count | `effectiveTodaysCount()` in `src/lib/today.ts` |

Free users always get **template mode** — never blocked from drafting.

## Local development

Stripe is optional locally. Without `STRIPE_SECRET_KEY`, billing UI shows "not configured" and all users stay on Free unless you seed a Team org (demo user is Team for NB testing).

Test webhooks with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

## Data model

- `Organization` — plan, Stripe IDs, trial, seats
- `OrganizationMember` — user ↔ org (admin | advisor)
- `SubscriptionEvent` — webhook audit trail

See `prisma/schema.prisma`.
