# Namaste Boston — AdvisorFlow pilot

Customer-zero pilot for validating AdvisorFlow before public Solo launch.

## Goals

| Metric | Target |
|--------|--------|
| Week-4 retention (active weekly) | 60%+ |
| Today's list completion | 3+ of 5 days/week |
| Log-as-sent / drafts generated | 40%+ |
| Time to first Today's list | under 5 min |
| Support tickets per advisor | under 0.5/mo |

## Pilot cohort

- **2–3 NB advisors** (start with Jordan Avery demo profile → real NB users)
- **Plan:** Team at founder price ($49/mo org) while validating
- **Integration:** NB Mission Control one-way import + write-back on log-as-sent

## Setup checklist

### AdvisorFlow (production)

1. Deploy to Vercel + Neon — see [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Set `NB_API_BASE_URL` (NB production URL) and `NB_API_KEY` (= NB `ADVISORFLOW_EXPORT_API_KEY`)
3. Set org plan to `team` for pilot users (or complete Team Stripe checkout)
4. Verify weekly cron: `GET /api/cron/nb-sync` with `CRON_SECRET`

### NB Mission Control

1. Set `ADVISORFLOW_EXPORT_API_KEY` on NB server
2. Confirm `GET /api/plugin/advisorflow/contacts` returns clients
3. Confirm `PATCH /api/plugin/advisorflow/contacts/[id]` updates `last_contact_date` / `next_touch_date`

### Per-advisor onboarding

1. Create AFI account (or invite to shared org when multi-seat UI ships)
2. Settings → sync from NB (or wait for weekly auto-sync on login)
3. Complete onboarding checklist in app
4. Run Today's list once; log at least one message as sent
5. Confirm NB client shows updated touch dates after write-back

## Weekly review (pilot lead)

Each Monday, capture for each advisor:

- Days they opened `/today`
- Recommendations completed vs skipped
- Drafts generated (template vs OpenAI)
- Messages logged as sent
- Overdue contact count trend (from `/review`)

## Exit criteria (ready for public Solo)

- [ ] 2+ advisors use AFI weekly for 4+ weeks
- [ ] NB write-back reliable in production
- [ ] Stripe webhooks update plan status without manual fixes
- [ ] No P0 bugs in draft generation or Today's list
- [ ] `/pricing` live with 14-day Solo Pro trial

## Founder pricing note

NB Team bundle at **$49/mo org** during pilot — set manually on `Organization.plan = 'team'` or via Stripe coupon on Team price. Document actual Stripe setup in internal runbook.

## Support

- Product issues: GitHub [jhasavi/afi](https://github.com/jhasavi/afi)
- NB integration: [INTEGRATION_NB.md](./INTEGRATION_NB.md)
- Billing: [BILLING.md](./BILLING.md)
