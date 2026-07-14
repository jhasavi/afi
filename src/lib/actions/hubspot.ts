"use server";

import { requireUserForAction } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  hubSpotCsv,
  isHubSpotConfigured,
  toHubSpotRow,
  upsertHubSpotContact,
} from "@/lib/integrations/hubspot";

export async function exportHubSpotCsvAction(): Promise<
  { csv: string; count: number } | { error: string }
> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  const contacts = await prisma.contact.findMany({
    where: { userId: auth.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      town: true,
      status: true,
      category: true,
    },
  });

  const rows = contacts.map(toHubSpotRow).filter((r): r is NonNullable<typeof r> => !!r);
  if (rows.length === 0) {
    return { error: "No contacts with email addresses to export for HubSpot." };
  }

  return { csv: hubSpotCsv(rows), count: rows.length };
}

export async function syncHubSpotAction(): Promise<
  { synced: number; skipped: number; errors: number } | { error: string }
> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  if (!isHubSpotConfigured()) {
    return {
      error:
        "HubSpot API not configured. Set HUBSPOT_ACCESS_TOKEN on Vercel, or use CSV export for manual import.",
    };
  }

  const contacts = await prisma.contact.findMany({
    where: { userId: auth.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      town: true,
      status: true,
      category: true,
    },
  });

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const contact of contacts) {
    const row = toHubSpotRow(contact);
    if (!row) {
      skipped += 1;
      continue;
    }
    const res = await upsertHubSpotContact(row);
    if (res.ok) synced += 1;
    else errors += 1;
  }

  return { synced, skipped, errors };
}
