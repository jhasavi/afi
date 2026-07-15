export type BusinessReviewContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: string;
  status: string;
  opportunityType: string;
  pipelineStage: string;
  relationshipStrength: number;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  estimatedValue: number | null;
  nbClientId?: string | null;
};

export type BusinessReview = {
  totalContacts: number;
  contactedLast30: number;
  overdueCount: number;
  staleWarmCount: number;
  activeOpportunityCount: number;
  activePipelineValue: number;
  referralPartnerCount: number;
  missingContactInfoCount: number;
  nbLinkedCount: number;
  healthScore: number;
  grade: "Strong" | "Promising" | "Needs focus";
  weeklyActions: string[];
};

const ACTIVE_PIPELINE_STAGES = new Set([
  "Contact Today",
  "Active Opportunity",
  "Meeting Scheduled",
  "Replied",
]);

const ACTIVE_STATUSES = new Set([
  "Contact today",
  "Needs follow-up",
  "Waiting for reply",
  "Replied",
  "Meeting scheduled",
  "Meeting Scheduled",
  "Active Opportunity",
  "Needs CMA",
  "Needs mortgage intro",
]);

const CLOSED_STATUSES = new Set(["Closed", "Dead / inactive"]);

function daysSince(date: Date | null, now: Date): number | null {
  if (!date) return null;
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildBusinessReview(
  contacts: BusinessReviewContact[],
  now = new Date()
): BusinessReview {
  const totalContacts = contacts.length;
  const openContacts = contacts.filter((c) => !CLOSED_STATUSES.has(c.status));

  const contactedLast30 = contacts.filter((c) => {
    const days = daysSince(c.lastContactedAt, now);
    return days !== null && days <= 30;
  }).length;

  const overdueCount = openContacts.filter(
    (c) => c.nextFollowUpAt && c.nextFollowUpAt.getTime() < now.getTime()
  ).length;

  const staleWarmCount = openContacts.filter((c) => {
    if (c.relationshipStrength < 4) return false;
    const days = daysSince(c.lastContactedAt, now);
    return days === null || days >= 90;
  }).length;

  const activeContacts = openContacts.filter(
    (c) => ACTIVE_PIPELINE_STAGES.has(c.pipelineStage) || ACTIVE_STATUSES.has(c.status)
  );

  const activePipelineValue = activeContacts.reduce(
    (sum, c) => sum + (c.estimatedValue || 0),
    0
  );

  const referralPartnerCount = contacts.filter((c) =>
    /referral|partner/i.test(`${c.category} ${c.opportunityType}`)
  ).length;

  const missingContactInfoCount = contacts.filter((c) => !c.email && !c.phone).length;
  const nbLinkedCount = contacts.filter((c) => !!c.nbClientId).length;

  const contactCoverage = totalContacts === 0 ? 0 : contactedLast30 / totalContacts;
  const overduePenalty = totalContacts === 0 ? 0 : overdueCount / totalContacts;
  const dataQuality = totalContacts === 0 ? 0 : 1 - missingContactInfoCount / totalContacts;
  const activeOpportunityRatio = totalContacts === 0 ? 0 : activeContacts.length / totalContacts;

  const healthScore = clampScore(
    contactCoverage * 35 +
      dataQuality * 25 +
      Math.min(activeOpportunityRatio * 4, 1) * 20 +
      (1 - Math.min(overduePenalty * 3, 1)) * 20
  );

  const grade =
    healthScore >= 75 ? "Strong" : healthScore >= 50 ? "Promising" : "Needs focus";

  const weeklyActions: string[] = [];
  if (overdueCount > 0) {
    weeklyActions.push(`Clear ${Math.min(overdueCount, 10)} overdue follow-up${overdueCount === 1 ? "" : "s"} first.`);
  }
  if (staleWarmCount > 0) {
    weeklyActions.push(`Revive ${Math.min(staleWarmCount, 5)} warm relationship${staleWarmCount === 1 ? "" : "s"} not touched in 90+ days.`);
  }
  if (activeContacts.length > 0) {
    weeklyActions.push(`Move ${Math.min(activeContacts.length, 5)} active opportunit${activeContacts.length === 1 ? "y" : "ies"} to a concrete next step.`);
  }
  if (referralPartnerCount > 0) {
    weeklyActions.push("Touch 3 referral partners with a helpful market or client-readiness note.");
  }
  if (missingContactInfoCount > 0) {
    weeklyActions.push(`Fix missing email/phone on ${Math.min(missingContactInfoCount, 10)} contact${missingContactInfoCount === 1 ? "" : "s"}.`);
  }
  if (weeklyActions.length === 0) {
    weeklyActions.push("Import more contacts, then run Today's list for the first daily outreach loop.");
  }

  return {
    totalContacts,
    contactedLast30,
    overdueCount,
    staleWarmCount,
    activeOpportunityCount: activeContacts.length,
    activePipelineValue,
    referralPartnerCount,
    missingContactInfoCount,
    nbLinkedCount,
    healthScore,
    grade,
    weeklyActions: weeklyActions.slice(0, 5),
  };
}
