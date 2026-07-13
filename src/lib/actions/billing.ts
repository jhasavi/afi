"use server";

import { redirect } from "next/navigation";
import { requireUserForAction } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createCheckoutSession,
  createPortalSession,
  isStripeConfigured,
  priceIdForPlan,
  TRIAL_DAYS,
} from "@/lib/billing/stripe";
import type { PlanId } from "@/lib/billing/plans";
import { getOrganizationForUser } from "@/lib/billing/entitlements";
import { logAudit } from "@/lib/audit";

export async function startCheckoutAction(plan: PlanId): Promise<{ error: string } | void> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  if (!isStripeConfigured()) {
    return { error: "Billing is not configured yet. Contact support or try again later." };
  }

  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return { error: `Plan "${plan}" is not available for checkout yet.` };
  }

  let org = await getOrganizationForUser(auth.user.id);
  if (!org) {
    const { ensureOrganizationForUser } = await import("@/lib/billing/entitlements");
    org = await ensureOrganizationForUser(auth.user.id, auth.user.name, auth.user.email);
  }

  const url = await createCheckoutSession({
    customerId: org.stripeCustomerId || undefined,
    customerEmail: auth.user.email,
    priceId,
    organizationId: org.id,
    plan,
    trialDays: plan === "solo_pro" ? TRIAL_DAYS : undefined,
  });

  await logAudit("billing.checkout_started", {
    userId: auth.user.id,
    metadata: { plan, organizationId: org.id },
  });

  redirect(url);
}

export async function startPortalAction(): Promise<{ error: string } | void> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  if (!isStripeConfigured()) {
    return { error: "Billing portal is not configured." };
  }

  const org = await getOrganizationForUser(auth.user.id);
  if (!org?.stripeCustomerId) {
    return { error: "No active subscription found. Choose a plan on /pricing first." };
  }

  const url = await createPortalSession(org.stripeCustomerId);
  redirect(url);
}

export async function getBillingStatusAction(): Promise<{
  plan: string;
  planName: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  stripeConfigured: boolean;
  isActive: boolean;
}> {
  const auth = await requireUserForAction();
  if (!auth.ok) {
    return {
      plan: "free",
      planName: "Free",
      subscriptionStatus: "active",
      trialEndsAt: null,
      stripeConfigured: isStripeConfigured(),
      isActive: true,
    };
  }

  const { getEntitlementsForUser } = await import("@/lib/billing/entitlements");
  const ent = await getEntitlementsForUser(auth.user.id);
  return {
    plan: ent.plan,
    planName: ent.name,
    subscriptionStatus: ent.subscriptionStatus,
    trialEndsAt: ent.trialEndsAt?.toISOString() ?? null,
    stripeConfigured: isStripeConfigured(),
    isActive: ent.isActive,
  };
}
