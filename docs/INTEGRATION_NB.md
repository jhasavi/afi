# Namaste Boston ↔ AdvisorFlow Integration

AdvisorFlow AI is the **daily outreach copilot**. NB Mission Control is the **system of record**.

## Architecture

```
NB website forms → captureLead → clients table (MC CRM)
                                      ↓
                    GET /api/plugin/advisorflow/contacts
                                      ↓
                    AdvisorFlow import → Today's 5 → AI drafts
                                      ↓
              Advisor logs activity (copy/paste from own email/phone)
```

## Setup

### 1. NB server (`~/nb`)

Add to `.env.local`:

```env
ADVISORFLOW_EXPORT_API_KEY="your-long-random-secret-here"
```

Deploy or restart NB. The export endpoint is:

```
GET https://your-nb-domain.com/api/plugin/advisorflow/contacts
Authorization: Bearer your-long-random-secret-here
```

Query params:
- `limit` (default 500, max 2000)
- `overdueOnly=true` — only contacts with overdue or missing `next_touch_date`

### 2. AdvisorFlow (`~/afi`)

Add to `.env`:

```env
NB_API_BASE_URL="https://your-nb-domain.com"
NB_API_KEY="same-secret-as-ADVISORFLOW_EXPORT_API_KEY"
FEATURE_CRM_SYNC=true
```

Restart AdvisorFlow. Go to **Import** → **Sync from Namaste Boston Mission Control**.

## Daily workflow (win more business)

1. **NB** captures leads from website, mortgage forms, H1B Academy, referrals
2. **MC admin** nurtures in `/nbadmin/mc` — tasks, milestones, service tags
3. **AdvisorFlow** imports overdue/high-value contacts weekly (or daily)
4. **Today's 5** prioritizes who to contact; AI drafts warm, compliant messages
5. **Log as sent** in AdvisorFlow; log full interaction in MC when needed

## Security

- Export uses service role on NB — never expose the API key to browsers
- AdvisorFlow stores imports per user account
- No auto-send; no write-back to NB yet (planned v0.2)

## GitHub

- AdvisorFlow: https://github.com/jhasavi/afi
- Namaste Boston: https://github.com/jhasavi/NB
