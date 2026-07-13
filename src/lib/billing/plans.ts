export type PlanId = "free" | "solo_pro" | "team" | "brokerage";

export type PlanEntitlements = {
  id: PlanId;
  name: string;
  priceMonthly: number | null;
  maxContacts: number;
  todaysCount: number;
  aiGenerationsPerMonth: number;
  openAiEnabled: boolean;
  nbSyncEnabled: boolean;
  weeklyReviewFull: boolean;
  auditLog: boolean;
};

export const PLANS: Record<PlanId, PlanEntitlements> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    maxContacts: 50,
    todaysCount: 3,
    aiGenerationsPerMonth: 0,
    openAiEnabled: false,
    nbSyncEnabled: false,
    weeklyReviewFull: false,
    auditLog: false,
  },
  solo_pro: {
    id: "solo_pro",
    name: "Solo Pro",
    priceMonthly: 39,
    maxContacts: 2000,
    todaysCount: 5,
    aiGenerationsPerMonth: 500,
    openAiEnabled: true,
    nbSyncEnabled: false,
    weeklyReviewFull: true,
    auditLog: true,
  },
  team: {
    id: "team",
    name: "Team",
    priceMonthly: 99,
    maxContacts: 10000,
    todaysCount: 5,
    aiGenerationsPerMonth: 2000,
    openAiEnabled: true,
    nbSyncEnabled: true,
    weeklyReviewFull: true,
    auditLog: true,
  },
  brokerage: {
    id: "brokerage",
    name: "Brokerage",
    priceMonthly: null,
    maxContacts: 50000,
    todaysCount: 20,
    aiGenerationsPerMonth: 10000,
    openAiEnabled: true,
    nbSyncEnabled: true,
    weeklyReviewFull: true,
    auditLog: true,
  },
};

export const TRIAL_DAYS = 14;

export function isPaidPlan(plan: string): boolean {
  return plan === "solo_pro" || plan === "team" || plan === "brokerage";
}

export function isSubscriptionActive(status: string, trialEndsAt: Date | null): boolean {
  if (status === "active" || status === "trialing") return true;
  if (trialEndsAt && trialEndsAt > new Date()) return true;
  return false;
}

export type UserEntitlements = PlanEntitlements & {
  plan: PlanId;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  isActive: boolean;
};

export function effectiveTodaysCount(
  ent: UserEntitlements,
  userDailyGoal: number
): number {
  const cap = ent.todaysCount;
  return Math.min(Math.max(1, userDailyGoal), cap);
}
