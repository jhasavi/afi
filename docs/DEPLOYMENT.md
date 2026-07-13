# AdvisorFlow AI — Deployment Guide

## Local development

```bash
npm install
cp .env.example .env
npm run setup    # SQLite + seed
npm run dev
```

Demo login: `demo@advisorflow.ai` / `demo1234`

## Environment variables

See project root env template and [BILLING.md](./BILLING.md). **Required in production:**

| Variable | Notes |
|----------|-------|
| `AUTH_SECRET` | Min 32 characters; never use the dev default |
| `DATABASE_URL` | PostgreSQL connection string (Neon recommended) |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://app.advisorflow.ai` |

**Billing (when charging):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SOLO_PRO`, `STRIPE_PRICE_TEAM`

**NB sync (Team plan):** `NB_API_BASE_URL`, `NB_API_KEY`

**Cron:** `CRON_SECRET` for weekly NB sync job

## Vercel + Neon (recommended production)

1. Create a [Neon](https://neon.tech) Postgres database and copy the connection string.

2. Import the GitHub repo in [Vercel](https://vercel.com):
   - Framework: Next.js
   - Build command: `npm run build:vercel` (uses `prisma/schema.postgres.prisma`)
   - Install command: `npm install`

3. Set environment variables in Vercel (Production):
   - `DATABASE_URL` — Neon pooled connection string
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `NEXT_PUBLIC_APP_URL` — your Vercel URL or custom domain
   - Optional: OpenAI, Stripe, NB keys per tables above

4. Deploy. First build runs `prisma db push` against Neon.

5. Seed production (once):

   ```bash
   DATABASE_URL="postgresql://..." npx prisma db push --schema=prisma/schema.postgres.prisma
   DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
   ```

6. Verify `GET https://your-app.vercel.app/api/health`

`vercel.json` includes a weekly cron for NB sync (`/api/cron/nb-sync`) — set `CRON_SECRET` in Vercel.

## Environment variables (local)

| Variable | Notes |
|----------|-------|
| `AUTH_SECRET` | Min 32 characters; never use the dev default |
| `DATABASE_URL` | PostgreSQL connection string for production |
| `NODE_ENV` | `production` |

## SQLite (development)

Default `DATABASE_URL="file:./dev.db"` uses SQLite via Prisma.

## PostgreSQL (production)

1. Set in `.env`:

   ```
   DATABASE_URL="postgresql://user:pass@host:5432/advisorflow"
   ```

2. Push schema:

   ```bash
   npm run db:push:postgres
   npm run db:seed
   ```

3. Or use Docker Compose (includes Postgres):

   ```bash
   docker compose up --build
   ```

## Docker

```bash
docker compose up --build
```

App: http://localhost:3000  
Postgres: `localhost:5432` (user/pass/db: `advisorflow`)

## Health check

```
GET /api/health
```

Returns `{ "status": "ok", "database": "connected" }` or 503 if DB unreachable.

## Git setup

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
```

When ready to push to GitHub:

```bash
git remote add origin https://github.com/YOUR_ORG/advisorflow-ai.git
git push -u origin main
```

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push:

- `npm run lint`
- `npm run build`
- `npm test`
- `npx tsx scripts/test-ai.ts`

## Production checklist

- [ ] Set strong `AUTH_SECRET`
- [ ] Use PostgreSQL (not SQLite)
- [ ] Set `OPENAI_API_KEY` only if using OpenAI mode
- [ ] Configure `OPENAI_DAILY_GENERATION_CAP` for cost control
- [ ] Keep all feature flags `false` until integrations are ready
- [ ] Run `npm run build` and verify `/api/health`
