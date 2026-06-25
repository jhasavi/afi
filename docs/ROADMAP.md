# AdvisorFlow AI — Roadmap

## Shipped (v0.1)

- [x] Auth, contacts CRUD, CSV import
- [x] Today's 5 scoring + draft messages
- [x] Advisory briefs (8 types)
- [x] Pipeline board + weekly dashboard
- [x] Template mode + optional OpenAI with fallback
- [x] Interaction logging (draft-only, no outbound send)
- [x] Production foundations: env validation, middleware, Docker, CI, tests
- [x] Onboarding, snooze, response workflow, weekly review
- [x] Feature flags + integration stubs

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

## v0.4 — Revenue (future)

- [ ] Stripe billing (solo + team tiers)
- [ ] Usage-based OpenAI passthrough or bundled credits
- [ ] White-label for brokerages

## Explicit non-goals

- Auto-send email/SMS without user action
- MLS listing search or transaction management
- Mortgage rate quoting without user-supplied data
- Legal or tax advice generation
