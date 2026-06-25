# AdvisorFlow AI

An AI follow-up and advisory copilot for real estate and mortgage professionals.

> **AdvisorFlow AI tells you who to contact today, why it matters, what to say, and how to follow up.**

See [docs/VISION.md](docs/VISION.md) for product vision and [docs/ROADMAP.md](docs/ROADMAP.md) for the roadmap.

---

## What works now

- Sign up / log in / password reset (dev scaffold) / profile settings
- Contact list, search, filters, view, and edit
- CSV import with column mapping and duplicate detection
- **Today's 5** — daily prioritized outreach with snooze and response tracking
- **Weekly review** — overdue, stale contacts, and wins
- Message drafts (text, email, call, voicemail, social, market update, follow-ups)
- Advisory briefs (buyer, seller, mortgage, investor, referral partner, etc.)
- Interaction logging and follow-up dates (draft-only — no auto-send)
- Pipeline board + weekly dashboard
- Onboarding checklist for new users
- Production: Docker, Postgres schema, CI, health check, audit log, feature flags

## Demo / template mode (default)

By default AdvisorFlow runs in **built-in template mode** — no OpenAI key required. See **Settings → AI engine status**.

## Are emails or texts actually sent?

**No.** Copy draft → send from your phone/email → **Log as sent** records activity only.

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
| **Template** | `OPENAI_API_KEY` empty | Local guardrail-safe templates |
| **OpenAI** | Valid key in `.env` | Server-side `gpt-4o-mini` (default) |
| **Fallback** | API fails | Templates + amber notice |

Set `OPENAI_DAILY_GENERATION_CAP` to limit generations per user per day.

```bash
npx tsx scripts/test-ai.ts
npx tsx scripts/smoke-test.ts --http-base=http://localhost:3000
```

## Production deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Postgres, Docker, and CI.

```bash
docker compose up --build
curl http://localhost:3000/api/health
```

## Integrations (future, behind flags)

Gmail sync, CRM sync, and SMS are scaffolded but **disabled by default**. See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md).

## Tech stack

Next.js 14 · React · TypeScript · Tailwind · Prisma · SQLite (dev) / PostgreSQL (prod) · OpenAI (optional)

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
src/lib/ai/        scoring, messages, briefs, openai, guardrails
src/lib/integrations/   feature-flagged stubs
docs/              VISION, ROADMAP, DEPLOYMENT, INTEGRATIONS
```
