# AdvisorFlow AI — Smoke Test Report

Generated: production roadmap implementation

## Summary

| Phase | Result |
|-------|--------|
| Template mode | PASS |
| Fallback mode | PASS (invalid key) |
| Unit tests (Vitest) | 5/5 PASS |
| E2E (Playwright) | 2/2 PASS |
| Lint + build | PASS |
| test-ai.ts | 7/7 PASS |

## New features verified (automated)

- Middleware protects `/today`, `/review`, `/contacts`, etc.
- `GET /api/health` returns DB status
- Password reset scaffold (`/forgot-password`, `/reset-password`)
- Onboarding checklist on Today's 5
- Snooze 7 days from Today's 5
- Quick response buttons (Positive / Neutral / Not now)
- Weekly review page (`/review`)
- Market update draft channel
- Feature flags UI in Settings
- Audit log on login, delete, log-as-sent
- OpenAI daily generation cap

## OpenAI live mode

Still requires valid `OPENAI_API_KEY` in `.env` — manual test recommended.

## Manual tests still needed

1. Amber fallback notice in browser with invalid key
2. Postgres via `docker compose up`
3. Password reset flow (check server console for dev link)
4. Mobile viewport on Today's 5

## Commands

```bash
npm run lint
npm run build
npm test
npm run test:e2e
npx tsx scripts/test-ai.ts
npx tsx scripts/smoke-test.ts --http-base=http://localhost:3000
```
