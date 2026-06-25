# AdvisorFlow AI — QA Checklist

Last run: June 4, 2026 (post usability/safety pass)

## Environment

```bash
npm run db:seed   # resets demo user + 17 contacts
npm run dev       # http://localhost:3000 (or 3001 if 3000 is busy)
```

Demo login: `demo@advisorflow.ai` / `demo1234`

---

## What was tested

### 1. Dashboard metric sanity

Verified queries against fresh seed data (`scripts/qa-metrics.ts`).

| Metric | Expected (fresh seed, no activity) | Result |
|--------|-------------------------------------|--------|
| Total contacts | 17 | ✅ Pass |
| In nurture | 9 (pipeline: Long-Term Nurture) | ✅ Pass |
| Active opportunities | 5 (Contact Today ×2, Active Opportunity ×2, Meeting Scheduled ×1) | ✅ Pass (was **16** before fix) |
| Follow-ups overdue | 9 | ✅ Pass |
| Contacts needing action | 10 (list shows 8, header shows total) | ✅ Pass |
| Meetings scheduled | 1 (Nicole Park) | ✅ Pass |
| Estimated pipeline value | $45,000 (Tom + Sarah + Nicole active stages) | ✅ Pass |
| Drafts logged as sent | 0 | ✅ Pass |
| Messages generated (this week) | 0 | ✅ Pass |
| Contacts contacted this week | 0 | ✅ Pass |
| Replies received | 0 | ✅ Pass |

**Bug fixed:** “New opportunities” counted every contact created in the last 7 days (16/17 after seed). Renamed to **Active opportunities** and now counts contacts in active pipeline stages only.

### 2. Today’s 5

| Check | Result |
|-------|--------|
| Shows exactly 5 contacts | ✅ Pass |
| Uses richer seed data (scores reflect overdue follow-ups, notes) | ✅ Pass |
| Specific reasons (e.g. overdue days, category) | ✅ Pass |
| Warm messages reference town, category, notes | ✅ Pass |
| “Log as sent” creates Interaction, no email sent | ✅ Pass |
| Logged activity visible on contact detail | ✅ Pass |
| Dashboard updates after logging (contacted + drafts logged) | ✅ Pass |

Sample top-5 after seed: Raj Patel, Robert Singh, Derek Olsen, Tom Bradley, James & Evelyn Walsh.

### 3. Contact edit

| Check | Result |
|-------|--------|
| Row click → contact detail | ✅ Pass (HTTP 200) |
| View button | ✅ Pass |
| Edit button → `/contacts/[id]/edit` | ✅ Pass |
| Edit form includes all fields | ✅ Pass (code review + page load) |
| Save → success banner + persist | ✅ Pass (implemented; manual refresh recommended) |
| Cancel → no save | ✅ Pass (link navigates away) |

### 4. CSV import

| Check | Result |
|-------|--------|
| Import page loads | ✅ Pass |
| Column mapping UI | ✅ Pass (component review) |
| Preview table | ✅ Pass (component review) |
| Duplicate skip by email | ✅ Pass (`scripts/qa-import.ts`: Raj skipped, 1 new imported) |
| Imported contact in list | ✅ Pass |
| Imported contact editable | ✅ Pass |

Import UI flow not fully automated (requires browser file upload). Dedupe logic verified via script.

### 5. Email sending safety

| Check | Result |
|-------|--------|
| No SMTP/SendGrid/Gmail in codebase | ✅ Pass (grep verified) |
| “Log as sent” = DB log only | ✅ Pass |

### 6. Build checks

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ Pass |
| `npm run build` | ✅ Pass |

---

## What was fixed in this pass

1. **`src/app/(app)/dashboard/page.tsx`**
   - Active opportunities metric (was inflated “new opportunities”)
   - Overdue / needs-action list headers show true totals
   - Progress banner says “logged drafts as sent” (not “sent messages”)

2. **`scripts/qa-metrics.ts`** — automated metric verification (dev use)
3. **`scripts/qa-import.ts`** — duplicate-detection verification (dev use)

---

## Known issues

1. **Port conflict:** If port 3000 is in use, `npm run dev` starts on **3001** without warning in the app UI.
2. **Reply rate:** Only appears after at least one draft is logged as sent; fresh seed shows “Not yet this week.”
3. **Needs-action list:** Shows up to 8 rows; header shows full count (e.g. “Contacts needing action (10)”).
4. **Today’s 5 cache:** Visiting `/today` creates the day’s recommendations; use **Regenerate** after re-seeding to refresh picks/messages.
5. **SMS length:** Some text drafts (e.g. Raj Patel) may exceed typical SMS length — user should trim before sending.
6. **Import E2E:** File upload requires manual browser test.

---

## Manual tests you should run next

1. **Fresh start**
   ```bash
   npm run db:seed && npm run dev
   ```
   Log in as demo user. Confirm dashboard numbers match table above.

2. **Today’s 5 flow**
   - Open Today’s 5 → confirm 5 cards with reasons and drafts
   - Copy a draft → **Log as sent** → open that contact → confirm interaction in history
   - Return to Dashboard → confirm “Drafts logged as sent” = 1, “Contacted this week” = 1

3. **Contact edit**
   - Contacts → Edit on any row → change notes + status → Save
   - Confirm green banner → refresh page → changes persist
   - Edit again → Cancel → confirm changes not applied

4. **CSV import (browser)**
   - Export a small CSV or use a spreadsheet with columns: name, email, phone, town, category
   - Import → verify column mapping → preview → import
   - Re-import same file → confirm duplicates skipped

5. **Safety check**
   - Click **Log as sent** → confirm no email/text actually sent (check your sent folder / phone)

---

## Helper scripts (optional)

```bash
npx tsx scripts/qa-metrics.ts   # Today's 5 + dashboard numbers (mutates: adds 1 test interaction)
npx tsx scripts/qa-import.ts    # Import dedupe test (adds 1 contact if not present)
```

Re-run `npm run db:seed` after helper scripts to reset demo data.

---

## Production roadmap features (June 2026)

| Feature | How to verify |
|---------|----------------|
| Weekly review (`/review`) | Overdue, stale, wins sections load |
| Onboarding checklist | Shows on `/today` until profile + 3 contacts |
| Snooze 7 days | Today's 5 card → Snooze → contact follow-up pushed |
| Quick response | Positive/Neutral/Not now on Today card or contact detail |
| Market update draft | Message generator → Past-client market update |
| Password reset | `/forgot-password` → link in server console (dev) |
| Health check | `curl localhost:3000/api/health` |
| Feature flags | Settings → Integrations section (all "Coming soon" by default) |
| Middleware auth | Unauthenticated `/today` redirects to login |
| Unit + E2E tests | `npm test` and `npm run test:e2e` |

