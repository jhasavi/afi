import { describe, expect, it } from "vitest";
import { PLANS, isPaidPlan, isSubscriptionActive, TRIAL_DAYS } from "@/lib/billing/plans";
import { effectiveTodaysCount } from "@/lib/billing/plans";

describe("billing plans", () => {
  it("defines free with template-only and 3 today", () => {
    expect(PLANS.free.openAiEnabled).toBe(false);
    expect(PLANS.free.todaysCount).toBe(3);
    expect(PLANS.free.maxContacts).toBe(50);
  });

  it("solo pro enables openai with trial length", () => {
    expect(PLANS.solo_pro.openAiEnabled).toBe(true);
    expect(TRIAL_DAYS).toBe(14);
    expect(isPaidPlan("solo_pro")).toBe(true);
    expect(isPaidPlan("free")).toBe(false);
  });

  it("team enables nb sync", () => {
    expect(PLANS.team.nbSyncEnabled).toBe(true);
    expect(PLANS.solo_pro.nbSyncEnabled).toBe(false);
  });

  it("caps today count by plan", () => {
    const freeEnt = { ...PLANS.free, plan: "free" as const, subscriptionStatus: "active", trialEndsAt: null, isActive: true };
    expect(effectiveTodaysCount(freeEnt, 5)).toBe(3);
    const proEnt = { ...PLANS.solo_pro, plan: "solo_pro" as const, subscriptionStatus: "active", trialEndsAt: null, isActive: true };
    expect(effectiveTodaysCount(proEnt, 5)).toBe(5);
  });

  it("treats active trial as active subscription", () => {
    const future = new Date(Date.now() + 86400000);
    expect(isSubscriptionActive("canceled", future)).toBe(true);
    expect(isSubscriptionActive("canceled", null)).toBe(false);
  });

  it("keeps plan prices honest with marketing ($39 Solo, $99 Team)", () => {
    expect(PLANS.solo_pro.priceMonthly).toBe(39);
    expect(PLANS.team.priceMonthly).toBe(99);
    expect(PLANS.free.priceMonthly).toBe(0);
  });
});
