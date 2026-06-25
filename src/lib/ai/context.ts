import type { Contact, User } from "@prisma/client";
import { parseTags, formatDate } from "@/lib/utils";

/** Shared contact + user context for OpenAI prompts (server-side only). */
export function buildAdvisorContext(user: User, contact: Contact): string {
  const tags = parseTags(contact.tags);
  return [
    "=== ADVISOR (sender) ===",
    `Name: ${user.name}`,
    user.companyName ? `Company: ${user.companyName}` : null,
    user.role ? `Role: ${user.role}` : null,
    `Business type: ${user.businessType}`,
    user.serviceAreas ? `Service areas: ${user.serviceAreas}` : null,
    user.primaryBusinessFocus ? `Focus: ${user.primaryBusinessFocus}` : null,
    `Preferred tone: ${user.communicationStyle}`,
    "",
    "=== CONTACT ===",
    `Name: ${contact.name}`,
    `Category: ${contact.category}`,
    `Status: ${contact.status}`,
    `Opportunity type: ${contact.opportunityType}`,
    contact.town ? `Town/city: ${contact.town}` : "Town/city: unknown",
    `Relationship strength: ${contact.relationshipStrength}/5`,
    contact.email ? `Email: ${contact.email}` : null,
    contact.phone ? `Phone: ${contact.phone}` : null,
    contact.source ? `Source: ${contact.source}` : null,
    tags.length ? `Tags: ${tags.join(", ")}` : null,
    contact.notes ? `Notes: ${contact.notes}` : "Notes: none",
    contact.lastContactedAt
      ? `Last contacted: ${formatDate(contact.lastContactedAt)}`
      : "Last contacted: never",
    contact.nextFollowUpAt
      ? `Next follow-up: ${formatDate(contact.nextFollowUpAt)}`
      : "Next follow-up: not set",
    contact.estimatedValue != null
      ? `Estimated value: $${contact.estimatedValue.toLocaleString()}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export const DRAFT_ONLY_RULES = `
CRITICAL:
- Output is a DRAFT for the advisor to copy and send manually.
- Do NOT say the message was sent, delivered, or emailed.
- Do NOT invent facts, prior conversations, or details not listed above.
- Do NOT guarantee loan approval, quote rates, give legal/tax advice, or promise appreciation.
- Use safe phrases: "it may be worth reviewing", "a lender would need to confirm", "no pressure", "only if useful".
`.trim();
