"use server";

import { revalidatePath } from "next/cache";
import { requireUserForAction } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildTodaysFiveForUser } from "@/lib/today";

export async function regenerateTodaysFive(): Promise<{ ok: true } | { error: string }> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };
  try {
    await buildTodaysFiveForUser(auth.user, true);
    revalidatePath("/today");
    return { ok: true };
  } catch (err) {
    console.error("[regenerateTodaysFive]", err);
    return { error: "Could not refresh today's list. Please try again." };
  }
}

/** Form-compatible wrapper (must return void). */
export async function regenerateTodaysFiveFormAction(): Promise<void> {
  await regenerateTodaysFive();
}

export async function setRecommendationStatusAction(
  id: string,
  status: "pending" | "sent" | "skipped"
): Promise<{ ok: boolean } | { error: string }> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };
  await prisma.dailyRecommendation.updateMany({
    where: { id, userId: auth.user.id },
    data: { status },
  });
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function snoozeRecommendationAction(
  id: string,
  days = 7
): Promise<{ ok: boolean } | { error: string }> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  const rec = await prisma.dailyRecommendation.findFirst({
    where: { id, userId: auth.user.id },
    include: { contact: true },
  });
  if (!rec) return { error: "Recommendation not found" };

  const followUp = new Date();
  followUp.setDate(followUp.getDate() + days);

  await prisma.$transaction([
    prisma.contact.update({
      where: { id: rec.contactId },
      data: { nextFollowUpAt: followUp },
    }),
    prisma.dailyRecommendation.update({
      where: { id },
      data: { status: "skipped" },
    }),
  ]);

  revalidatePath("/today");
  revalidatePath(`/contacts/${rec.contactId}`);
  revalidatePath("/review");
  return { ok: true };
}
