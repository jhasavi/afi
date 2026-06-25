import type { Contact, User } from "@prisma/client";

export type ScoreFactor = {
  label: string;
  weight: number;
};

export type ScoredContact = {
  contact: Contact;
  score: number; // 0 - 100
  factors: ScoreFactor[];
  reason: string;
  suggestedChannel: string;
  suggestedNextStep: string;
  suggestedFollowUpDate: Date;
};

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

const HIGH_VALUE_OPPORTUNITIES = new Set([
  "Buyer opportunity",
  "Seller opportunity",
  "Mortgage opportunity",
  "Refinance opportunity",
  "Investor opportunity",
]);

const HIGH_VALUE_CATEGORIES = new Set([
  "Past client",
  "Referral partner",
  "Seller lead",
  "Buyer lead",
  "Refinance lead",
  "Mortgage lead",
]);

const EXCLUDED_STATUSES = new Set(["Closed", "Dead / inactive"]);

function suggestChannel(contact: Contact): string {
  if (contact.phone && !contact.email) return "text";
  if (contact.email && !contact.phone) return "email";
  // Both or neither: prefer text for high relationship strength, email otherwise.
  if (contact.phone && contact.relationshipStrength >= 4) return "text";
  if (contact.email) return "email";
  if (contact.phone) return "text";
  return "social";
}

function suggestNextStep(contact: Contact): string {
  switch (contact.opportunityType) {
    case "Seller opportunity":
      return "Offer to prepare a no-pressure market snapshot";
    case "Buyer opportunity":
      return "Offer a quick buying-options review";
    case "Mortgage opportunity":
      return "Offer a soft mortgage readiness check";
    case "Refinance opportunity":
      return "Offer a refinance review (a lender would confirm)";
    case "Investor opportunity":
      return "Share a relevant investor angle and ask about goals";
    case "Rental opportunity":
      return "Check in on their rental plans";
    case "Insurance opportunity":
      return "Offer a quick coverage review";
    case "Referral opportunity":
      return "Reconnect and offer to be a resource";
    case "Agent recruiting opportunity":
      return "Soft check-in about how their business is going";
    default:
      return "Send a warm, no-ask check-in";
  }
}

export function scoreContact(contact: Contact, now: Date): ScoredContact {
  const factors: ScoreFactor[] = [];
  let score = 0;

  // 1. Overdue / due follow-up — strongest signal.
  if (contact.nextFollowUpAt) {
    const overdueDays = daysBetween(now, contact.nextFollowUpAt);
    if (overdueDays > 0) {
      const w = Math.min(40, 25 + overdueDays); // grows with how overdue
      score += w;
      factors.push({
        label: `Follow-up is ${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`,
        weight: w,
      });
    } else if (overdueDays === 0) {
      score += 30;
      factors.push({ label: "Follow-up is due today", weight: 30 });
    } else if (overdueDays >= -2) {
      score += 12;
      factors.push({ label: "Follow-up is coming up soon", weight: 12 });
    }
  }

  // 2. Status-driven urgency.
  if (contact.status === "Contact today") {
    score += 28;
    factors.push({ label: 'Marked "Contact today"', weight: 28 });
  } else if (contact.status === "Needs follow-up") {
    score += 18;
    factors.push({ label: "Flagged as needing follow-up", weight: 18 });
  } else if (contact.status === "Waiting for reply") {
    score += 8;
    factors.push({ label: "Waiting on a reply — gentle nudge may help", weight: 8 });
  } else if (contact.status === "Needs CMA" || contact.status === "Needs mortgage intro") {
    score += 22;
    factors.push({ label: `Open task: ${contact.status}`, weight: 22 });
  } else if (contact.status === "New") {
    score += 14;
    factors.push({ label: "New contact — worth an intro touch", weight: 14 });
  }

  // 3. Staleness — long time since last contact.
  if (!contact.lastContactedAt) {
    score += 10;
    factors.push({ label: "Never contacted yet", weight: 10 });
  } else {
    const stale = daysBetween(now, contact.lastContactedAt);
    if (stale >= 180) {
      score += 22;
      factors.push({ label: `No contact in ${Math.round(stale / 30)} months`, weight: 22 });
    } else if (stale >= 90) {
      score += 14;
      factors.push({ label: `Stale — ${stale} days since last contact`, weight: 14 });
    } else if (stale >= 45) {
      score += 7;
      factors.push({ label: `${stale} days since last contact`, weight: 7 });
    }
  }

  // 4. Opportunity value.
  if (HIGH_VALUE_OPPORTUNITIES.has(contact.opportunityType)) {
    score += 16;
    factors.push({ label: `${contact.opportunityType} potential`, weight: 16 });
  } else if (contact.opportunityType === "Referral opportunity") {
    score += 12;
    factors.push({ label: "Referral potential", weight: 12 });
  }

  // 5. Category value.
  if (HIGH_VALUE_CATEGORIES.has(contact.category)) {
    score += 10;
    factors.push({ label: `${contact.category} (high-value relationship)`, weight: 10 });
  }

  // 6. Relationship strength — warm relationships are easier wins.
  if (contact.relationshipStrength >= 4) {
    score += 8;
    factors.push({ label: "Strong existing relationship", weight: 8 });
  } else if (contact.relationshipStrength <= 2) {
    score += 4;
    factors.push({ label: "Relationship could use warming up", weight: 4 });
  }

  // 7. Notes signal intent.
  if (contact.notes && contact.notes.trim().length > 0) {
    const n = contact.notes.toLowerCase();
    if (/(sell|selling|list|move|moving|relocat)/.test(n)) {
      score += 8;
      factors.push({ label: "Notes mention selling / moving", weight: 8 });
    } else if (/(buy|buying|looking|interested|refi|refinance|invest)/.test(n)) {
      score += 6;
      factors.push({ label: "Notes mention buying / financing intent", weight: 6 });
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const followUp = new Date(now);
  followUp.setDate(followUp.getDate() + (score >= 70 ? 7 : 14));

  return {
    contact,
    score,
    factors,
    reason: buildReason(contact, factors),
    suggestedChannel: suggestChannel(contact),
    suggestedNextStep: suggestNextStep(contact),
    suggestedFollowUpDate: followUp,
  };
}

function buildReason(contact: Contact, factors: ScoreFactor[]): string {
  if (factors.length === 0) {
    return `${contact.name} is a good relationship to keep warm. A friendly, no-ask check-in keeps the door open.`;
  }
  const top = [...factors].sort((a, b) => b.weight - a.weight).slice(0, 3);
  const phrases = top.map((f) => f.label.toLowerCase());
  const tail =
    contact.town && contact.town.trim()
      ? ` They're in ${contact.town}, so a local angle will feel natural.`
      : "";
  return `Reach out to ${contact.name} because ${joinList(phrases)}.${tail}`;
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function rankTodaysContacts(
  contacts: Contact[],
  now: Date,
  limit: number
): ScoredContact[] {
  const eligible = contacts.filter((c) => !EXCLUDED_STATUSES.has(c.status));
  const scored = eligible
    .map((c) => scoreContact(c, now))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // tie-break: most stale first
      const al = a.contact.lastContactedAt?.getTime() ?? 0;
      const bl = b.contact.lastContactedAt?.getTime() ?? 0;
      return al - bl;
    });
  return scored.slice(0, limit);
}
