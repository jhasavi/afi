"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import { stringifyTags } from "@/lib/utils";
import {
  CONTACT_CATEGORIES,
  CONTACT_STATUSES,
  OPPORTUNITY_TYPES,
  statusToStage,
} from "@/lib/constants";

export type ImportRow = Record<string, string>;

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: number;
};

function normalizePhone(p?: string): string {
  return (p || "").replace(/\D/g, "");
}

function matchEnum(value: string | undefined, options: readonly string[]): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  const found = options.find((o) => o.toLowerCase() === v);
  return found ?? null;
}

function parseDate(value?: string): Date | null {
  if (!value || !value.trim()) return null;
  const d = new Date(value.trim());
  return isNaN(d.getTime()) ? null : d;
}

export async function importContactsAction(rows: ImportRow[]): Promise<ImportResult | { error: string }> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };
  const user = auth.user;

  const existing = await prisma.contact.findMany({
    where: { userId: user.id },
    select: { email: true, phone: true, name: true },
  });

  const existingEmails = new Set(
    existing.map((c) => c.email?.toLowerCase()).filter(Boolean) as string[]
  );
  const existingPhones = new Set(
    existing.map((c) => normalizePhone(c.phone || "")).filter(Boolean)
  );
  const existingNames = new Set(existing.map((c) => c.name.trim().toLowerCase()));

  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const seenNames = new Set<string>();

  const result: ImportResult = { imported: 0, skipped: 0, errors: 0 };
  const toCreate: any[] = [];

  for (const row of rows) {
    const name = (row.name || "").trim();
    if (!name) {
      result.errors += 1;
      continue;
    }

    const email = (row.email || "").trim().toLowerCase() || null;
    const phone = (row.phone || "").trim() || null;
    const normPhone = normalizePhone(phone || "");
    const lowerName = name.toLowerCase();

    // Dedupe: against existing contacts and within this batch.
    const isDup =
      (email && (existingEmails.has(email) || seenEmails.has(email))) ||
      (normPhone && (existingPhones.has(normPhone) || seenPhones.has(normPhone))) ||
      (!email && !normPhone && (existingNames.has(lowerName) || seenNames.has(lowerName)));

    if (isDup) {
      result.skipped += 1;
      continue;
    }

    if (email) seenEmails.add(email);
    if (normPhone) seenPhones.add(normPhone);
    seenNames.add(lowerName);

    const strengthRaw = parseInt((row.relationshipStrength || "").trim(), 10);
    const strength = isNaN(strengthRaw) ? 3 : Math.max(1, Math.min(5, strengthRaw));

    const status = matchEnum(row.status, CONTACT_STATUSES) || "New";
    const tagsRaw = (row.tags || "").trim();
    const tags = tagsRaw
      ? tagsRaw.split(/[,;|]/).map((t) => t.trim()).filter(Boolean)
      : [];

    toCreate.push({
      userId: user.id,
      name,
      email,
      phone,
      category: matchEnum(row.category, CONTACT_CATEGORIES) || "Other",
      town: (row.town || "").trim() || null,
      notes: (row.notes || "").trim() || null,
      relationshipStrength: strength,
      lastContactedAt: parseDate(row.lastContactedAt),
      status,
      opportunityType:
        matchEnum(row.opportunityType, OPPORTUNITY_TYPES) || "General relationship nurture",
      source: (row.source || "").trim() || "CSV import",
      tags: stringifyTags(tags),
      pipelineStage: statusToStage(status),
    });
  }

  if (toCreate.length > 0) {
    await prisma.contact.createMany({ data: toCreate });
    result.imported = toCreate.length;
  }

  revalidatePath("/contacts");
  revalidatePath("/today");
  revalidatePath("/pipeline");
  return result;
}
