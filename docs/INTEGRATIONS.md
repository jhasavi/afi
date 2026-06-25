# AdvisorFlow AI — Integrations Architecture

## Philosophy

Integrations are **optional** and **behind feature flags**. AdvisorFlow never auto-sends messages. Even when Gmail or CRM sync is enabled, the app only **reads** data to enrich contact context and **writes** drafts for you to send manually.

## Feature flags

| Flag | Default | Purpose |
|------|---------|---------|
| `FEATURE_GMAIL_SYNC` | `false` | Read email threads for last-contact detection |
| `FEATURE_CRM_SYNC` | `false` | Import/sync contacts from external CRM |
| `FEATURE_SMS_SEND` | `false` | Future: send via Twilio (requires explicit user action) |

Flags are read in [`src/lib/features.ts`](../src/lib/features.ts). Settings shows "Coming soon" cards when flags are off.

## Provider interfaces

```
src/lib/integrations/
├── types.ts       # IntegrationProvider interface
├── gmail.ts       # No-op stub (future: OAuth read-only)
├── crm.ts         # No-op stub (future: HubSpot/Salesforce)
└── index.ts       # Registry
```

### Gmail (planned v0.2)

- OAuth read-only scope
- Detect last inbound/outbound date per contact email
- Update `lastContactedAt` suggestion (user confirms)
- **No send scope**

### CRM (planned v0.2)

- One-way import: contacts + notes
- Dedupe by email
- **No two-way sync** until trust is established

### SMS (planned v0.3)

- Requires `FEATURE_SMS_SEND=true` + Twilio credentials
- User must click "Send" per message — never batch auto-send
- Logged to `Interaction` table

## Data sent externally

When OpenAI is enabled, see README → "What data is sent to OpenAI". Integration providers will only receive data necessary for their scope (documented per integration at launch).

## Adding a new integration

1. Add flag to `src/lib/features.ts`
2. Implement `IntegrationProvider` in `src/lib/integrations/`
3. Register in `src/lib/integrations/index.ts`
4. Add Settings card with flag gate
5. Document in this file
