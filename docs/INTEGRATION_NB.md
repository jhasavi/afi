# Namaste Boston ↔ AdvisorFlow Integration

## Do not replace Mission Control with AdvisorFlow

| Layer | Owns | Does not own |
|-------|------|--------------|
| **NB `/nbadmin/mc`** | System of record: people, pipeline, tasks, milestones, household, lead intake, portal | Morning scored outreach list + AI drafts |
| **AdvisorFlow AI** | Daily action layer: Today's list, why today, drafts, log-as-sent discipline | Lead forms, multi-service CRM depth, team portal |

They are **complementary**. Using only MC skips consistent outreach drafting. Using only AFI loses inbound capture and CRM ops. Replacing MC with AFI would throw away households, milestones, service journeys, and website lead flows.

## Architecture

```
NB website forms → captureLead → clients table (MC CRM)
                                      ↓
                    GET /api/plugin/advisorflow/contacts
                                      ↓
                    AdvisorFlow import → Today's list → AI drafts
                                      ↓
              Advisor sends from own email/phone (draft-first)
                                      ↓
              PATCH /api/plugin/advisorflow/contacts/[id]  (touch dates)
```

Requires **Team plan** in AdvisorFlow for NB sync and **Send via NB mail** (see [BILLING.md](./BILLING.md)).

## Setup

### 1. NB server (`~/nb`)

Add to `.env.local`:

```env
ADVISORFLOW_EXPORT_API_KEY="your-long-random-secret-here"
```

Deploy or restart NB. Endpoints:

```
GET  /api/plugin/advisorflow/contacts
PATCH /api/plugin/advisorflow/contacts/[id]
Authorization: Bearer your-long-random-secret-here
```

Query params on GET:
- `limit` (default 500, max 2000)
- `overdueOnly=true` — only contacts with overdue or missing `next_touch_date`

### 2. AdvisorFlow (`~/afi`)

Add to `.env`:

```env
NB_API_BASE_URL="https://your-nb-domain.com"
NB_API_KEY="same-secret-as-ADVISORFLOW_EXPORT_API_KEY"
```

Restart AdvisorFlow. Go to **Import** → **Sync from Namaste Boston Mission Control** (Team plan).

Auto-sync runs on login if last sync was over 7 days ago, plus a weekly Vercel cron.

## Sync behavior

- **New contacts** — created in AFI with `nbClientId`
- **Matched contacts** — refresh touch dates, status, town, opportunity from MC (MC remains source of truth for those fields)
- **Log as sent** — writes `last_contact_date` / `next_touch_date` back to MC
- **MC-only data** — tasks, milestones, service flags stay in MC; open MC for deep nurturing notes

## Daily workflow (win more business)

1. **NB** captures leads from website, mortgage forms, H1B Academy, referrals
2. **MC admin** (`/nbadmin/mc`) — new leads, overdue tasks, milestones, pipeline
3. **AdvisorFlow** sync overdue → Today's list → drafts
4. **Log as sent** in AFI — dates flow back to MC
5. Rich notes / service journey updates stay in MC when needed

See NB `docs/WIN_MORE_BUSINESS.md` for the weekly playbook.

## Write-back

```
PATCH https://your-nb-domain.com/api/plugin/advisorflow/contacts/{nbClientId}
Authorization: Bearer your-long-random-secret-here
Content-Type: application/json

{
  "lastContactDate": "2026-06-04",
  "nextTouchDate": "2026-06-18"
}
```

## Optional: send email via MC ZeptoMail

When the advisor explicitly clicks **Send via NB mail** on an email draft:

```
POST https://your-nb-domain.com/api/plugin/advisorflow/send-email
Authorization: Bearer your-long-random-secret-here
Content-Type: application/json

{
  "nbClientId": "uuid-from-mc",
  "subject": "Following up",
  "message": "Plain text body",
  "nextTouchDate": "2026-06-18",
  "fromName": "Advisor display name",
  "replyTo": "advisor@broker.com",
  "replyToName": "Advisor display name"
}
```

Uses ZeptoMail on the NB server (same verified From domain as MC). Per-advisor **display name** and **reply-to** come from AdvisorFlow Settings → Email sending (Team). Not auto-send.

## Security

- Export and write-back use service role on NB — never expose the API key to browsers
- AdvisorFlow stores imports per user account
- No auto-send email/SMS from either system (except explicit **Send via NB mail** click on email drafts)

## GitHub

- AdvisorFlow: https://github.com/jhasavi/afi
- Namaste Boston: https://github.com/jhasavi/NB
