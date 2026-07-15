"use server";

import { revalidatePath } from "next/cache";
import { requireUserForAction } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildTodaysFiveForUser } from "@/lib/today";
import { extractNbClientId, patchNbContactDates } from "@/lib/integrations/nb-writeback";

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

  const rec = await prisma.dailyRecommendation.findFirst({
    where: { id, userId: auth.user.id },
    include: { contact: true },
  });
  if (!rec) return { error: "Recommendation not found" };

  if (status !== "sent") {
    await prisma.dailyRecommendation.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/today");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const now = new Date();
  const followUp = rec.followUpDate || new Date(now);
  if (!rec.followUpDate) {
    followUp.setDate(followUp.getDate() + (auth.user.defaultFollowUpDays || 14));
  }

  await prisma.$transaction([
    prisma.dailyRecommendation.update({
      where: { id },
      data: { status },
    }),
    prisma.interaction.create({
      data: {
        userId: auth.user.id,
        contactId: rec.contactId,
        type: rec.channel === "email" ? "Email" : rec.channel === "call" ? "Call" : "Text",
        channel: rec.channel,
        messageUsed: rec.suggestedMessage,
        response: "No response yet",
        date: now,
        followUpAt: followUp,
        nextAction: rec.nextStep,
        notes: "Logged from Today's list.",
      },
    }),
    prisma.contact.update({
      where: { id: rec.contactId },
      data: {
        lastContactedAt: now,
        nextFollowUpAt: followUp,
        status: "Waiting for reply",
      },
    }),
  ]);

  const nbId = extractNbClientId(rec.contact);
  if (nbId) {
    const wb = await patchNbContactDates(nbId, {
      lastContactDate: now.toISOString().slice(0, 10),
      nextTouchDate: followUp.toISOString().slice(0, 10),
    });
    if (!wb.ok) console.warn("[NB write-back from recommendation]", wb.error);
  }

  revalidatePath("/today");
  revalidatePath("/dashboard");
  revalidatePath("/review");
  revalidatePath(`/contacts/${rec.contactId}`);
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
