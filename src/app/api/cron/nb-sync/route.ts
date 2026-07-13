import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isNbSyncConfigured } from "@/lib/integrations/nb";
import { runNbSyncForUser } from "@/lib/actions/nb-sync";

export const dynamic = "force-dynamic";

/**
 * Weekly cron: sync NB contacts for Team-plan users with NB configured.
 * Secured via CRON_SECRET (Vercel Cron sends Authorization: Bearer).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isNbSyncConfigured()) {
    return NextResponse.json({ ok: true, skipped: "NB not configured" });
  }

  const teamMembers = await prisma.organizationMember.findMany({
    where: {
      organization: {
        plan: { in: ["team", "brokerage"] },
        subscriptionStatus: { in: ["active", "trialing"] },
      },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  const results: { userId: string; imported?: number; error?: string }[] = [];

  for (const { userId } of teamMembers) {
    const res = await runNbSyncForUser(userId, { overdueOnly: false });
    if ("error" in res) {
      results.push({ userId, error: res.error });
    } else {
      results.push({ userId, imported: res.imported });
    }
  }

  return NextResponse.json({ ok: true, synced: results.length, results });
}
