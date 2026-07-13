import { NextResponse } from "next/server";
import { requireUserForAction } from "@/lib/auth";
import { createPortalSession, isStripeConfigured } from "@/lib/billing/stripe";
import { getOrganizationForUser } from "@/lib/billing/entitlements";

export async function POST() {
  const auth = await requireUserForAction();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const org = await getOrganizationForUser(auth.user.id);
  if (!org?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account" }, { status: 400 });
  }

  const url = await createPortalSession(org.stripeCustomerId);
  return NextResponse.json({ url });
}
