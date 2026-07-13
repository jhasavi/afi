import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/billing/stripe";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { TRIAL_DAYS } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

function isPlanId(value: string | undefined | null): value is PlanId {
  return !!value && value in PLANS;
}

/** Resolve plan from hints / metadata / Stripe price IDs — never invent solo_pro. */
function resolvePlan(
  subscription: Stripe.Subscription,
  planHint?: PlanId
): PlanId | null {
  if (planHint && isPlanId(planHint)) return planHint;
  if (isPlanId(subscription.metadata?.plan)) return subscription.metadata.plan;
  const pricePlan = subscription.items.data[0]?.price.metadata?.plan;
  if (isPlanId(pricePlan)) return pricePlan;

  const priceId = subscription.items.data[0]?.price.id;
  if (priceId && priceId === process.env.STRIPE_PRICE_TEAM) return "team";
  if (priceId && priceId === process.env.STRIPE_PRICE_SOLO_PRO) return "solo_pro";
  return null;
}

async function recordEvent(orgId: string, type: string, payload: unknown) {
  await prisma.subscriptionEvent.create({
    data: {
      organizationId: orgId,
      type,
      payload: JSON.stringify(payload),
    },
  });
}

async function updateOrgFromSubscription(
  orgId: string,
  subscription: Stripe.Subscription,
  planHint?: PlanId
) {
  const resolved = resolvePlan(subscription, planHint);
  const existing = await prisma.organization.findUnique({ where: { id: orgId } });
  const plan = resolved ?? (existing && isPlanId(existing.plan) ? existing.plan : "solo_pro");

  const trialEndsAt = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      plan,
      subscriptionStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
      trialEndsAt,
    },
  });
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organizationId;
        const plan = (isPlanId(session.metadata?.plan) ? session.metadata.plan : "solo_pro") as PlanId;
        if (!orgId) break;

        await prisma.organization.update({
          where: { id: orgId },
          data: {
            stripeCustomerId: session.customer as string,
            plan,
            subscriptionStatus: session.subscription ? "trialing" : "active",
            trialEndsAt:
              plan === "solo_pro"
                ? new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
                : null,
          },
        });

        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await updateOrgFromSubscription(orgId, sub, plan);
        }

        await recordEvent(orgId, event.type, session);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        let resolvedOrgId: string | undefined = subscription.metadata?.organizationId;
        if (!resolvedOrgId) {
          const org = await prisma.organization.findFirst({
            where: { stripeCustomerId: subscription.customer as string },
          });
          resolvedOrgId = org?.id;
        }
        if (resolvedOrgId) {
          await updateOrgFromSubscription(resolvedOrgId, subscription);
          await recordEvent(resolvedOrgId, event.type, subscription);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscription.id },
              { stripeCustomerId: subscription.customer as string },
            ],
          },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan: "free",
              subscriptionStatus: "canceled",
              stripeSubscriptionId: null,
              trialEndsAt: null,
            },
          });
          await recordEvent(org.id, event.type, subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: "past_due" },
          });
          await recordEvent(org.id, event.type, invoice);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
