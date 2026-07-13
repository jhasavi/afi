# AdvisorFlow AI — Roadmap

## Shipped (v0.1)

- [x] Auth, contacts CRUD, CSV import
- [x] Today's list scoring + draft messages (plan-capped N)
- [x] Advisory briefs (8 types)
- [x] Pipeline board + weekly dashboard
- [x] Template mode + optional OpenAI with fallback
- [x] Interaction logging (draft-only, no outbound send)
- [x] Production foundations: env validation, middleware, Docker, CI, tests
- [x] Onboarding, snooze, response workflow, weekly review
- [x] Feature flags + integration stubs

- [x] NB Mission Control import + write-back (Team plan)
- [x] Subscription billing: Organization model, Stripe Checkout/webhooks, entitlements
- [x] Public landing + `/pricing` with Solo Pro 14-day trial
- [x] Vercel + Neon deployment guide

## v0.2 — Advisor depth

- [ ] Gmail read-only sync (detect last contact date) — behind `FEATURE_GMAIL_SYNC`
- [ ] Google Contacts import — behind flag
- [ ] Team / brokerage shared contacts
- [ ] Custom scoring weights per user
- [ ] SMS length indicator + auto-trim suggestions

## v0.3 — Scale

- [ ] Postgres managed hosting guides (Railway, Fly.io, Vercel + Neon)
- [ ] Email-based password reset (optional SMTP)
- [ ] Mobile PWA install prompt
- [ ] Webhook API for Zapier

## v0.4 — Revenue

- [x] Stripe billing (Solo Pro + Team tiers) — see [BILLING.md](./BILLING.md)
- [x] Usage caps per plan (OpenAI generations/month)
- [ ] White-label for brokerages

## Vision guardrails (v0.2+)

Every roadmap item should strengthen: **who → why today → what to say → what next → log as sent**.
If it does not, defer it.

## Explicit non-goals

- Auto-send email/SMS without user action
- MLS listing search or transaction management
- Mortgage rate quoting without user-supplied data
- Legal or tax advice generation
- Replacing a full CRM or transaction platform
