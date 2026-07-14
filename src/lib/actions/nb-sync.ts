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
  refreshed: number;
  errors: number;
  total: number;
  linked: number;
};

type ContactIndex = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  nbClientId: string | null;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  status: string;
  town: string | null;
  opportunityType: string;
};

function normalizePhone(p?: string): string {
  return (p || "").replace(/\D/g, "");
}

function parseOptionalDate(value?: string | null): Date | null {
  if (!value || !String(value).trim()) return null;
  const d = new Date(String(value).trim());
  return Number.isNaN(d.getTime()) ? null : d;
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
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      nbClientId: true,
      lastContactedAt: true,
      nextFollowUpAt: true,
      status: true,
      town: true,
      opportunityType: true,
    },
  });

  const byNbId = new Map(
    existing.filter((c) => c.nbClientId).map((c) => [c.nbClientId!, c as ContactIndex])
  );
  const existingEmails = new Map(
    existing
      .filter((c) => c.email)
      .map((c) => [c.email!.toLowerCase(), c as ContactIndex])
  );
  const existingPhones = new Map(
    existing
      .map((c) => [normalizePhone(c.phone || ""), c as ContactIndex] as const)
      .filter(([p]) => p)
  );
  const existingNames = new Map(
    existing.map((c) => [c.name.trim().toLowerCase(), c as ContactIndex])
  );

  const result: NbSyncResult = {
    imported: 0,
    skipped: 0,
    refreshed: 0,
    errors: 0,
    total: contacts.length,
    linked: 0,
  };

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
      (row.nbClientId && byNbId.get(row.nbClientId)) ||
      (email && existingEmails.get(email)) ||
      (normPhone && existingPhones.get(normPhone)) ||
      (!email && !normPhone && existingNames.get(lowerName));

    if (match) {
      try {
        const status = row.status || match.status || "New";
        const data: {
          nbClientId?: string | null;
          lastContactedAt?: Date | null;
          nextFollowUpAt?: Date | null;
          status?: string;
          town?: string | null;
          opportunityType?: string;
          pipelineStage?: string;
        } = {
          lastContactedAt: parseOptionalDate(row.lastContactedAt),
          nextFollowUpAt: parseOptionalDate(row.nextFollowUpAt),
        };

        if (row.nbClientId && !match.nbClientId) {
          data.nbClientId = row.nbClientId;
          result.linked += 1;
        }
        if (row.status) {
          data.status = status;
          data.pipelineStage = statusToStage(status);
        }
        if (row.town !== undefined) data.town = row.town || null;
        if (row.opportunityType) data.opportunityType = row.opportunityType;

        await prisma.contact.update({ where: { id: match.id }, data });

        const refreshed: ContactIndex = {
          ...match,
          nbClientId: data.nbClientId ?? match.nbClientId,
          lastContactedAt: data.lastContactedAt ?? match.lastContactedAt,
          nextFollowUpAt: data.nextFollowUpAt ?? match.nextFollowUpAt,
          status: data.status ?? match.status,
          town: data.town !== undefined ? data.town : match.town,
          opportunityType: data.opportunityType ?? match.opportunityType,
        };
        if (refreshed.nbClientId) byNbId.set(refreshed.nbClientId, refreshed);
        if (email) existingEmails.set(email, refreshed);
        if (normPhone) existingPhones.set(normPhone, refreshed);
        existingNames.set(lowerName, refreshed);
        result.refreshed += 1;
      } catch (err) {
        console.warn("[nb-sync] refresh failed", match.id, err);
        result.errors += 1;
      }
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
      const createdRow = await prisma.contact.create({
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
          lastContactedAt: parseOptionalDate(row.lastContactedAt),
          nextFollowUpAt: parseOptionalDate(row.nextFollowUpAt),
          relationshipStrength: 3,
          nbClientId: row.nbClientId || null,
        },
      });

      const created: ContactIndex = {
        id: createdRow.id,
        email,
        phone,
        name,
        nbClientId: createdRow.nbClientId,
        lastContactedAt: createdRow.lastContactedAt,
        nextFollowUpAt: createdRow.nextFollowUpAt,
        status,
        town: createdRow.town,
        opportunityType: createdRow.opportunityType,
      };
      if (email) existingEmails.set(email, created);
      if (normPhone) existingPhones.set(normPhone, created);
      existingNames.set(lowerName, created);
      if (created.nbClientId) byNbId.set(created.nbClientId, created);
      result.imported += 1;
    } catch (err) {
      console.warn("[nb-sync] create failed", name, err);
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
  try {
    return await runNbSync(userId, opts);
  } catch (err) {
    console.error("[runNbSyncForUser]", err);
    return { error: "NB sync failed unexpectedly. Try again in a moment." };
  }
}

export async function syncFromNbAction(opts?: {
  overdueOnly?: boolean;
}): Promise<NbSyncResult | { error: string }> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  const gate = await requireNbSync(auth.user.id);
  if (gate) return { error: gate.error };

  try {
    return await runNbSync(auth.user.id, opts);
  } catch (err) {
    console.error("[syncFromNbAction]", err);
    return { error: "NB sync failed unexpectedly. Your existing contacts are safe — try again." };
  }
}

/** Weekly auto-sync on login when Team plan and NB configured. */
export async function maybeAutoSyncNb(userId: string): Promise<void> {
  try {
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
