import "server-only";
import type { Organization } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  PLANS,
  type PlanEntitlements,
  type PlanId,
  type UserEntitlements,
  isSubscriptionActive,
  effectiveTodaysCount,
} from "./plans";

export type { UserEntitlements };
export { effectiveTodaysCount };

export async function getOrganizationForUser(userId: string): Promise<Organization | null> {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  });
  return membership?.organization ?? null;
}

export async function getEntitlementsForUser(userId: string): Promise<UserEntitlements> {
  const org = await getOrganizationForUser(userId);
  if (!org) {
    return {
      ...PLANS.free,
      plan: "free",
      subscriptionStatus: "active",
      trialEndsAt: null,
      isActive: true,
    };
  }

  const planId = (org.plan in PLANS ? org.plan : "free") as PlanId;
  const base = PLANS[planId];
  const isActive = isSubscriptionActive(org.subscriptionStatus, org.trialEndsAt);

  // Downgrade to free limits if subscription inactive
  if (!isActive && planId !== "free") {
    return {
      ...PLANS.free,
      plan: "free",
      subscriptionStatus: org.subscriptionStatus,
      trialEndsAt: org.trialEndsAt,
      isActive: false,
    };
  }

  return {
    ...base,
    plan: planId,
    subscriptionStatus: org.subscriptionStatus,
    trialEndsAt: org.trialEndsAt,
    isActive,
  };
}

export async function ensureOrganizationForUser(
  userId: string,
  name: string,
  email: string
): Promise<Organization> {
  const existing = await getOrganizationForUser(userId);
  if (existing) return existing;

  const slugBase = email.split("@")[0].replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "org";
  let slug = slugBase;
  let n = 0;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${slugBase}-${n}`;
  }

  const org = await prisma.organization.create({
    data: {
      name: name.trim() || "My practice",
      slug,
      plan: "free",
      subscriptionStatus: "active",
    },
  });

  await prisma.organizationMember.create({
    data: { organizationId: org.id, userId, role: "admin" },
  });

  return org;
}

export type EntitlementError = { error: string };

export async function requireContactCapacity(userId: string): Promise<EntitlementError | null> {
  const ent = await getEntitlementsForUser(userId);
  const count = await prisma.contact.count({ where: { userId } });
  if (count >= ent.maxContacts) {
    return {
      error: `Contact limit reached (${ent.maxContacts} on ${ent.name} plan). Upgrade to add more.`,
    };
  }
  return null;
}

export async function requireAiGeneration(userId: string): Promise<EntitlementError | null> {
  const ent = await getEntitlementsForUser(userId);
  if (!ent.openAiEnabled || !ent.isActive) {
    return {
      error: `AI drafts require Solo Pro or Team. Upgrade at /pricing — template mode still works.`,
    };
  }
  if (ent.aiGenerationsPerMonth <= 0) return null;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const count = await prisma.aiUsageLog.count({
    where: { userId, createdAt: { gte: monthStart } },
  });

  if (count >= ent.aiGenerationsPerMonth) {
    return {
      error: `Monthly AI generation limit reached (${ent.aiGenerationsPerMonth}). Upgrade or wait until next month.`,
    };
  }
  return null;
}

export async function requireNbSync(userId: string): Promise<EntitlementError | null> {
  const ent = await getEntitlementsForUser(userId);
  if (!ent.nbSyncEnabled || !ent.isActive) {
    return {
      error: `NB Mission Control sync requires Team plan. Upgrade at /pricing or use CSV import.`,
    };
  }
  return null;
}

/** Same Team entitlement as NB sync — send uses Mission Control ZeptoMail. */
export async function requireNbEmailSend(userId: string): Promise<EntitlementError | null> {
  const blocked = await requireNbSync(userId);
  if (blocked) {
    return {
      error: `Send via NB mail requires Team plan. Upgrade at /pricing or copy the draft and send from your own email app.`,
    };
  }
  return null;
}
