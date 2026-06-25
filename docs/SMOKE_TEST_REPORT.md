# AdvisorFlow AI — Smoke Test Report

Generated: 2026-06-25T18:44:04.649Z

## Environment

- HTTP base: http://localhost:3000
- `OPENAI_API_KEY` in `.env`: missing
- Dev server: run separately with `npm run dev` after `npm run db:seed`

## 1. Fresh local reset

- `npm run db:seed` — run before this script
- `npm run dev` — required for HTTP checks; lib/DB tests do not need it

## 2. Template mode results

| Check | Result |
|-------|--------|
| OpenAI disabled without key | ✅ Pass |
| Generate draft (template) | ✅ Pass |
| Generate advisory brief (template) | ✅ Pass |
| Today's 5 regenerated | ✅ Pass (count=5) |
| Fresh-seed dashboard: in nurture = 9 | ✅ Pass (got 9) |
| Fresh-seed dashboard: active opportunities = 5 | ✅ Pass (got 5) |
| Fresh-seed dashboard: overdue = 9 | ✅ Pass (got 9) |
| Fresh-seed dashboard: needs action = 10 | ✅ Pass (got 10) |
| Fresh-seed dashboard: meetings = 1 | ✅ Pass (got 1) |
| Fresh-seed dashboard: pipeline value = 45000 | ✅ Pass (got 45000) |

## 3. OpenAI mode results

| Check | Result |
|-------|--------|
| OpenAI disabled without key | ✅ Pass |
| OpenAI mode skipped | ✅ Pass (No valid OPENAI_API_KEY in .env — add key and re-run) |
| OpenAI appears enabled with invalid key | ✅ Pass |

_OpenAI mode was skipped — no valid key in `.env`._


## 4. Fallback test results

| Check | Result |
|-------|--------|
| OpenAI appears enabled with invalid key | ✅ Pass |
| Fallback returns template draft | ✅ Pass |
| Fallback notice constant defined | ✅ Pass |

## 5. Email/SMS sending

| Check | Result |
|-------|--------|
| No email/SMS packages | ✅ None |

**Conclusion:** No real email or SMS sending exists. `Log as sent` only writes to SQLite.

## 6. Bugs found

- **HTTP smoke tests**: dev server unreachable: fetch failed

## 7. Bugs fixed

_See failed checks above; fixes applied in this session if any._

## 8. Files changed

- `docs/SMOKE_TEST_REPORT.md` (this report)
- `scripts/smoke-test.ts` (automated smoke harness)

## 9. Manual tests still needed

1. **Browser UI** — Log in as `demo@advisorflow.ai` / `demo1234`, confirm Settings banner matches your `.env` (template vs OpenAI).
2. **Copy draft** — Click Copy on a generated draft; confirm clipboard text (browser permission).
3. **Amber fallback notice** — With invalid `OPENAI_API_KEY`, restart dev server, generate a draft in UI; confirm amber notice appears.
4. **Failed to fetch** — With session expired, trigger Generate draft; confirm friendly error (not raw fetch failure).
5. **Dashboard UI** — After Log as sent, refresh dashboard and confirm weekly activity counters update visually.

## 10. Verification commands

```bash
npm run lint
npm run build
npx tsx scripts/test-ai.ts
npx tsx scripts/smoke-test.ts --http-base=http://localhost:3000
```
