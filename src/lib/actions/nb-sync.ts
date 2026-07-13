"use server";

import { revalidatePath } from "next/cache";
import { requireUserForAction } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchNbContacts, isNbSyncConfigured } from "@/lib/integrations/nb";
import { stringifyTags } from "@/lib/utils";
import { statusToStage } from "@/lib/constants";
import { logAudit } from "@/lib/audit";
import { requireContactCapacity, requireNbSync } from "@/lib/billing/entitlements";

export type NbSyncResult = {
  imported: number;
  skipped: number;
  errors: number;
  total: number;
  linked: number;
};

function normalizePhone(p?: string): string {
  return (p || "").replace(/\D/g, "");
}

const SYNC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

async function runNbSync(
  userId: string,
  opts?: { overdueOnly?: boolean }
): Promise<NbSyncResult | { error: string }> {
  if (!isNbSyncConfigured()) {
    return {
      error:
        "NB Mission Control sync is not configured. Set NB_API_BASE_URL and NB_API_KEY in .env (same value as NB's ADVISORFLOW_EXPORT_API_KEY).",
    };
  }

  const { contacts, error } = await fetchNbContacts({
    overdueOnly: opts?.overdueOnly ?? false,
    limit: 500,
  });
  if (error) return { error };

  const existing = await prisma.contact.findMany({
    where: { userId },
    select: { id: true, email: true, phone: true, name: true, nbClientId: true },
  });

  const existingEmails = new Map(
    existing
      .filter((c) => c.email)
      .map((c) => [c.email!.toLowerCase(), c])
  );
  const existingPhones = new Map(
    existing
      .map((c) => [normalizePhone(c.phone || ""), c] as const)
      .filter(([p]) => p)
  );
  const existingNames = new Map(existing.map((c) => [c.name.trim().toLowerCase(), c]));

  const result: NbSyncResult = { imported: 0, skipped: 0, errors: 0, total: contacts.length, linked: 0 };

  for (const row of contacts) {
    const name = row.name?.trim();
    if (!name) {
      result.errors += 1;
      continue;
    }

    const email = row.email?.trim().toLowerCase() || null;
    const phone = row.phone?.trim() || null;
    const normPhone = normalizePhone(phone || "");
    const lowerName = name.toLowerCase();

    const match =
      (email && existingEmails.get(email)) ||
      (normPhone && existingPhones.get(normPhone)) ||
      (!email && !normPhone && existingNames.get(lowerName));

    if (match) {
      if (row.nbClientId && !match.nbClientId) {
        await prisma.contact.update({
          where: { id: match.id },
          data: { nbClientId: row.nbClientId },
        });
        result.linked += 1;
      }
      result.skipped += 1;
      continue;
    }

    const cap = await requireContactCapacity(userId);
    if (cap) {
      result.errors += 1;
      continue;
    }

    const status = row.status || "New";
    const tags = row.tags
      ? row.tags.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
      : ["nb-import"];

    try {
      await prisma.contact.create({
        data: {
          userId,
          name,
          email,
          phone,
          town: row.town || null,
          notes: row.notes || null,
          category: row.category || "Other",
          status,
          opportunityType: row.opportunityType || "General relationship nurture",
          source: row.source || "NB Mission Control",
          tags: stringifyTags(tags),
          pipelineStage: statusToStage(status),
          lastContactedAt: row.lastContactedAt ? new Date(row.lastContactedAt) : null,
          nextFollowUpAt: row.nextFollowUpAt ? new Date(row.nextFollowUpAt) : null,
          relationshipStrength: 3,
          nbClientId: row.nbClientId || null,
        },
      });

      if (email) existingEmails.set(email, { id: "", email, phone, name, nbClientId: row.nbClientId });
      if (normPhone) existingPhones.set(normPhone, { id: "", email, phone, name, nbClientId: row.nbClientId });
      existingNames.set(lowerName, { id: "", email, phone, name, nbClientId: row.nbClientId });
      result.imported += 1;
    } catch {
      result.errors += 1;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastNbSyncAt: new Date() },
  });

  await logAudit("nb.sync_contacts", {
    userId,
    metadata: result,
  });

  revalidatePath("/contacts");
  revalidatePath("/today");
  revalidatePath("/import");
  revalidatePath("/review");

  return result;
}

/** Internal sync for cron jobs (no session). Caller must verify entitlements. */
export async function runNbSyncForUser(
  userId: string,
  opts?: { overdueOnly?: boolean; skipEntitlementCheck?: boolean }
): Promise<NbSyncResult | { error: string }> {
  if (!opts?.skipEntitlementCheck) {
    const gate = await requireNbSync(userId);
    if (gate) return { error: gate.error };
  }
  return runNbSync(userId, opts);
}

export async function syncFromNbAction(opts?: {
  overdueOnly?: boolean;
}): Promise<NbSyncResult | { error: string }> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  const gate = await requireNbSync(auth.user.id);
  if (gate) return { error: gate.error };

  return runNbSync(auth.user.id, opts);
}

/** Weekly auto-sync on login when Team plan and NB configured. */
export async function maybeAutoSyncNb(userId: string): Promise<void> {
  const gate = await requireNbSync(userId);
  if (gate) return;
  if (!isNbSyncConfigured()) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastNbSyncAt: true },
  });
  if (!user) return;

  const stale =
    !user.lastNbSyncAt || Date.now() - user.lastNbSyncAt.getTime() > SYNC_INTERVAL_MS;
  if (!stale) return;

  try {
    await runNbSync(userId, { overdueOnly: false });
  } catch (err) {
    console.warn("[maybeAutoSyncNb]", err);
  }
}

export async function nbSyncStatusAction(): Promise<{ configured: boolean; entitled: boolean }> {
  const auth = await requireUserForAction();
  const entitled = auth.ok ? !(await requireNbSync(auth.user.id)) : false;
  return { configured: isNbSyncConfigured(), entitled };
}
