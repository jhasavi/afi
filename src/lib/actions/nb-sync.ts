"use server";

import { revalidatePath } from "next/cache";
import { requireUserForAction } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchNbContacts, isNbSyncConfigured } from "@/lib/integrations/nb";
import { stringifyTags } from "@/lib/utils";
import { statusToStage } from "@/lib/constants";
import { logAudit } from "@/lib/audit";

export type NbSyncResult = {
  imported: number;
  skipped: number;
  errors: number;
  total: number;
};

function normalizePhone(p?: string): string {
  return (p || "").replace(/\D/g, "");
}

export async function syncFromNbAction(opts?: {
  overdueOnly?: boolean;
}): Promise<NbSyncResult | { error: string }> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

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
    where: { userId: auth.user.id },
    select: { email: true, phone: true, name: true },
  });

  const existingEmails = new Set(
    existing.map((c) => c.email?.toLowerCase()).filter(Boolean) as string[]
  );
  const existingPhones = new Set(
    existing.map((c) => normalizePhone(c.phone || "")).filter(Boolean)
  );
  const existingNames = new Set(existing.map((c) => c.name.trim().toLowerCase()));

  const result: NbSyncResult = { imported: 0, skipped: 0, errors: 0, total: contacts.length };

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

    const isDup =
      (email && existingEmails.has(email)) ||
      (normPhone && existingPhones.has(normPhone)) ||
      (!email && !normPhone && existingNames.has(lowerName));

    if (isDup) {
      result.skipped += 1;
      continue;
    }

    const status = row.status || "New";
    const tags = row.tags
      ? row.tags.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
      : ["nb-import"];

    try {
      await prisma.contact.create({
        data: {
          userId: auth.user.id,
          name,
          email,
          phone,
          town: row.town || null,
          notes: row.notes
            ? `${row.notes}\n\n[NB client id: ${row.nbClientId}]`
            : `[NB client id: ${row.nbClientId}]`,
          category: row.category || "Other",
          status,
          opportunityType: row.opportunityType || "General relationship nurture",
          source: row.source || "NB Mission Control",
          tags: stringifyTags(tags),
          pipelineStage: statusToStage(status),
          lastContactedAt: row.lastContactedAt ? new Date(row.lastContactedAt) : null,
          nextFollowUpAt: row.nextFollowUpAt ? new Date(row.nextFollowUpAt) : null,
          relationshipStrength: 3,
        },
      });

      if (email) existingEmails.add(email);
      if (normPhone) existingPhones.add(normPhone);
      existingNames.add(lowerName);
      result.imported += 1;
    } catch {
      result.errors += 1;
    }
  }

  await logAudit("nb.sync_contacts", {
    userId: auth.user.id,
    metadata: result,
  });

  revalidatePath("/contacts");
  revalidatePath("/today");
  revalidatePath("/import");
  revalidatePath("/review");

  return result;
}

export async function nbSyncStatusAction(): Promise<{ configured: boolean }> {
  return { configured: isNbSyncConfigured() };
}
