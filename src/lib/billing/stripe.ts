import "server-only";
import Stripe from "stripe";
import type { PlanId } from "./plans";
import { TRIAL_DAYS } from "./plans";

let stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  }
  return stripe;
}

export function priceIdForPlan(plan: PlanId): string | null {
  if (plan === "solo_pro") return process.env.STRIPE_PRICE_SOLO_PRO || null;
  if (plan === "team") return process.env.STRIPE_PRICE_TEAM || null;
  return null;
}

export async function createCheckoutSession(opts: {
  customerId?: string;
  customerEmail: string;
  priceId: string;
  organizationId: string;
  plan: PlanId;
  trialDays?: number;
}): Promise<string> {
  const s = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: opts.customerId,
    customer_email: opts.customerId ? undefined : opts.customerEmail,
    line_items: [{ price: opts.priceId, quantity: 1 }],
    subscription_data: opts.trialDays
      ? { trial_period_days: opts.trialDays, metadata: { organizationId: opts.organizationId, plan: opts.plan } }
      : { metadata: { organizationId: opts.organizationId, plan: opts.plan } },
    metadata: { organizationId: opts.organizationId, plan: opts.plan },
    success_url: `${appUrl}/settings?billing=success`,
    cancel_url: `${appUrl}/pricing?canceled=1`,
  });

  if (!session.url) throw new Error("Failed to create checkout session");
  return session.url;
}

export async function createPortalSession(customerId: string): Promise<string> {
  const s = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await s.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings`,
  });
  return session.url;
}

export { TRIAL_DAYS };
