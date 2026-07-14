# HubSpot newsletter sync

AdvisorFlow is your **daily outreach** tool. HubSpot stays your **newsletter** tool on the free plan.

## Recommended workflow

1. Nurture and score contacts in AdvisorFlow (Today, drafts, log as sent).
2. **Import → Download HubSpot CSV** (contacts with email only).
3. In HubSpot: **Contacts → Import** → upload the CSV.
4. Send newsletters from HubSpot as you do today.

Re-export monthly or after a big MC sync so HubSpot has fresh emails.

## Optional: API one-click sync

For HubSpot **free** with a private app:

1. HubSpot → Settings → Integrations → **Private Apps** → Create.
2. Scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`.
3. Copy the access token.
4. On Vercel (afi project): `HUBSPOT_ACCESS_TOKEN=pat-...`
5. Redeploy. **Import → Sync to HubSpot API** pushes contacts with email.

Duplicates are updated by email match (create or patch).

## What syncs

| Field | HubSpot property |
|-------|------------------|
| email | email |
| name | firstname + lastname |
| phone | phone |
| town | city |
| category Past client | lifecyclestage = customer |
| other categories | lifecyclestage = lead |
| status | hs_lead_status |

## What does not sync

- Newsletter sends (stay in HubSpot)
- Unsubscribes (manage in HubSpot only)
- MC tasks/milestones

## Not building in-app newsletter (yet)

Newsletter compliance (unsubscribe, CAN-SPAM, templates) is better in HubSpot for now. AdvisorFlow focuses on 1:1 daily outreach.
