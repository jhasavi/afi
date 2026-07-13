# AdvisorFlow AI

An AI follow-up and advisory copilot for real estate and mortgage professionals.

> **AdvisorFlow AI tells you who to contact today, why it matters, what to say, and what happens next — drafts only, you send.**

See [docs/VISION.md](docs/VISION.md) for product vision and [docs/ROADMAP.md](docs/ROADMAP.md) for the roadmap.

---

## What works now

- Sign up / log in / password reset (dev scaffold) / profile settings
- Contact list, search, filters, view, and edit
- CSV import with column mapping and duplicate detection
- **Today's list** — plan-capped daily prioritized outreach with snooze and response tracking
- **Weekly review** — overdue, stale contacts, and wins
- Message drafts (text, email, call, voicemail, social, market update, follow-ups)
- Advisory briefs (buyer, seller, mortgage, investor, referral partner, etc.)
- Interaction logging and follow-up dates (draft-only — no auto-send)
- Pipeline board + weekly dashboard
- Onboarding checklist for new users
- Plans & billing: Free / Solo Pro (14-day trial) / Team — see [docs/BILLING.md](docs/BILLING.md)
- Namaste Boston Mission Control sync + write-back (Team) — see [docs/INTEGRATION_NB.md](docs/INTEGRATION_NB.md)
- Production: Postgres schema, CI, health check, audit log, feature flags

## Demo / template mode (default)

By default AdvisorFlow runs in **built-in template mode** — no OpenAI key required. See **Settings → AI engine status**. Free plans always stay template-only even when an API key is configured.

## Are emails or texts actually sent?

**No.** Copy draft → send from your phone/email → **Log as sent** records activity only. On Team + NB sync, log-as-sent can write touch dates back to Mission Control.

## How to run locally

```bash
npm install
cp .env.example .env
npm run setup
npm run dev
```

Open http://localhost:3000 — login: `demo@advisorflow.ai` / `demo1234`

## OpenAI mode (optional)

| Mode | When | What happens |
|------|------|----------------|
| **Template** | `OPENAI_API_KEY` empty, or Free plan | Local guardrail-safe templates |
| **OpenAI** | Valid key + Solo Pro / Team | Server-side `gpt-4o-mini` (default) |
| **Fallback** | API fails | Templates + amber notice |

Set `OPENAI_DAILY_GENERATION_CAP` to limit generations per user per day (in addition to monthly plan caps).

```bash
npx tsx scripts/test-ai.ts
npx tsx scripts/smoke-test.ts --http-base=http://localhost:3000
```

## Production deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Postgres, Vercel + Neon, and CI.

```bash
curl http://localhost:3000/api/health
```

## Integrations (future, behind flags)

Gmail sync, CRM sync, and SMS are scaffolded but **disabled by default**. See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md).

## Tech stack

Next.js 14 · React · TypeScript · Tailwind · Prisma · SQLite (dev) / PostgreSQL (prod) · Stripe · OpenAI (optional)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run setup` | SQLite DB + seed |
| `npm run db:seed` | Re-seed demo data |
| `npm run db:push:postgres` | Push schema to PostgreSQL |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke tests |

## Project structure

```
src/app/(app)/     today, contacts, pipeline, dashboard, review, import, settings
src/app/pricing/   public pricing + checkout entry
src/lib/ai/        scoring, messages, briefs, openai, guardrails
src/lib/billing/   plans, entitlements, Stripe helpers
src/lib/integrations/   NB sync/writeback + feature-flagged stubs
docs/              VISION, ROADMAP, BILLING, NB_PILOT, DEPLOYMENT
```
