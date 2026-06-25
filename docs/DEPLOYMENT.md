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

See [`.env.example`](../.env.example). **Required in production:**

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
