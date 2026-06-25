"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseDateInput } from "@/lib/utils";

export async function logInteractionAction(contactId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const contact = await prisma.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!contact) return;

  const type = String(formData.get("type") || "Text");
  const response = String(formData.get("response") || "No response yet");
  const notes = (String(formData.get("notes") || "").trim() || null) as string | null;
  const nextAction = (String(formData.get("nextAction") || "").trim() || null) as string | null;
  const date = parseDateInput(formData.get("date")) || new Date();
  let followUpAt = parseDateInput(formData.get("followUpAt"));

  // Default follow-up date if none provided.
  if (!followUpAt) {
    followUpAt = new Date(date);
    followUpAt.setDate(followUpAt.getDate() + (user.defaultFollowUpDays || 14));
  }

  await prisma.interaction.create({
    data: {
      userId: user.id,
      contactId,
      type,
      channel: type.toLowerCase(),
      response,
      notes,
      nextAction,
      followUpAt,
      date,
    },
  });

  // Update the contact's relationship state from this interaction.
  const statusMap: Record<string, string> = {
    Positive: "Replied",
    Neutral: "Replied",
    "Not now": "Long-term nurture",
    Negative: "Long-term nurture",
  };
  const newStatus =
    response === "No response yet" ? "Waiting for reply" : statusMap[response] ?? contact.status;

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      lastContactedAt: date,
      nextFollowUpAt: followUpAt,
      status: newStatus,
    },
  });

  // Mark today's recommendation (if any) as handled.
  await prisma.dailyRecommendation.updateMany({
    where: { userId: user.id, contactId, status: "pending" },
    data: { status: "sent" },
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/today");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
}

export async function recordQuickResponseAction(
  contactId: string,
  response: "Positive" | "Neutral" | "Not now"
): Promise<{ ok: boolean } | { error: string }> {
  const { requireUserForAction } = await import("@/lib/auth");
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId: auth.user.id },
  });
  if (!contact) return { error: "Contact not found" };

  const now = new Date();
  const followUp = new Date(now);
  const days =
    response === "Positive" ? 3 : response === "Neutral" ? 7 : auth.user.defaultFollowUpDays || 30;
  followUp.setDate(followUp.getDate() + days);

  const statusMap: Record<string, string> = {
    Positive: "Replied",
    Neutral: "Replied",
    "Not now": "Long-term nurture",
  };

  await prisma.interaction.create({
    data: {
      userId: auth.user.id,
      contactId,
      type: "Other",
      response,
      notes: "Quick response logged from Today's 5 or contact detail.",
      date: now,
      followUpAt: followUp,
    },
  });

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      lastContactedAt: now,
      nextFollowUpAt: followUp,
      status: statusMap[response] ?? contact.status,
    },
  });

  await prisma.dailyRecommendation.updateMany({
    where: { userId: auth.user.id, contactId, status: "pending" },
    data: { status: "sent" },
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/today");
  revalidatePath("/dashboard");
  revalidatePath("/review");
  return { ok: true };
}
