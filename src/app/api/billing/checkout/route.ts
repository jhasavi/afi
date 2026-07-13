import { NextResponse } from "next/server";
import { requireUserForAction } from "@/lib/auth";
import {
  createCheckoutSession,
  isStripeConfigured,
  priceIdForPlan,
  TRIAL_DAYS,
} from "@/lib/billing/stripe";
import {
  ensureOrganizationForUser,
  getOrganizationForUser,
} from "@/lib/billing/entitlements";
import type { PlanId } from "@/lib/billing/plans";

export async function POST(req: Request) {
  const auth = await requireUserForAction();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { plan?: PlanId };
  const plan = body.plan || "solo_pro";
  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  let org = await getOrganizationForUser(auth.user.id);
  if (!org) {
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

  return NextResponse.json({ url });
}
