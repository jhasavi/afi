"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import { generateMessage, type MessageChannel } from "@/lib/ai/messages";
import { generateBrief, type AdvisoryBrief } from "@/lib/ai/briefs";
import { isOpenAIEnabled } from "@/lib/ai/config";
import { checkAiUsageAllowed, recordAiUsage } from "@/lib/ai/usage";
import { logAudit } from "@/lib/audit";

export type MessageDraftMeta = {
  subject?: string;
  suggestedNextStep?: string;
  followUpTiming?: string;
  whyThisMessage?: string;
  source: "openai" | "template";
  fallbackUsed: boolean;
};

export async function generateMessageAction(
  contactId: string,
  channel: MessageChannel
): Promise<
  | { content: string; messageLogId: string; meta: MessageDraftMeta }
  | { error: string }
> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId: auth.user.id },
  });
  if (!contact) return { error: "Contact not found" };

  if (isOpenAIEnabled()) {
    const usage = await checkAiUsageAllowed(auth.user.id);
    if (!usage.allowed) {
      return {
        error: `Daily AI generation limit reached. Template mode still works tomorrow, or set OPENAI_DAILY_GENERATION_CAP=0 for unlimited.`,
      };
    }
  }

  try {
    const draft = await generateMessage(channel, contact, auth.user);
    if (draft.source === "openai" && !draft.fallbackUsed) {
      await recordAiUsage(auth.user.id, `message/${channel}`);
    }

    const log = await prisma.messageLog.create({
      data: { userId: auth.user.id, contactId, channel, content: draft.content },
    });

    revalidatePath("/dashboard");
    return {
      content: draft.content,
      messageLogId: log.id,
      meta: {
        subject: draft.subject,
        suggestedNextStep: draft.suggestedNextStep,
        followUpTiming: draft.followUpTiming,
        whyThisMessage: draft.whyThisMessage,
        source: draft.source,
        fallbackUsed: draft.fallbackUsed,
      },
    };
  } catch (err) {
    console.error("[generateMessageAction]", err);
    return { error: "Could not generate a draft. Please try again." };
  }
}

const CHANNEL_TO_INTERACTION: Record<string, string> = {
  text: "Text",
  email: "Email",
  call: "Call",
  voicemail: "Voicemail",
  social: "Social message",
  "market-update": "Email",
  "follow-up-none": "Text",
  "follow-up-positive": "Text",
  "follow-up-notnow": "Text",
};

/** Records that the user sent a draft externally. Does NOT send email or SMS. */
export async function logMessageSentAction(
  messageLogId: string
): Promise<{ ok: boolean } | { error: string }> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  const log = await prisma.messageLog.findFirst({
    where: { id: messageLogId, userId: auth.user.id },
  });
  if (!log) return { error: "Draft log not found" };

  const now = new Date();
  const followUp = new Date(now);
  followUp.setDate(followUp.getDate() + (auth.user.defaultFollowUpDays || 14));

  try {
    await prisma.$transaction([
      prisma.messageLog.update({
        where: { id: messageLogId },
        data: { sentAt: now },
      }),
      prisma.interaction.create({
        data: {
          userId: auth.user.id,
          contactId: log.contactId,
          type: CHANNEL_TO_INTERACTION[log.channel] || "Other",
          channel: log.channel,
          messageUsed: log.content,
          response: "No response yet",
          date: now,
          followUpAt: followUp,
          notes: "Logged from message draft (sent outside AdvisorFlow).",
        },
      }),
      prisma.contact.update({
        where: { id: log.contactId },
        data: {
          lastContactedAt: now,
          nextFollowUpAt: followUp,
          status: "Waiting for reply",
        },
      }),
      prisma.dailyRecommendation.updateMany({
        where: { userId: auth.user.id, contactId: log.contactId, status: "pending" },
        data: { status: "sent" },
      }),
    ]);

    await logAudit("message.logged_sent", {
      userId: auth.user.id,
      entity: "contact",
      entityId: log.contactId,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/contacts/${log.contactId}`);
    revalidatePath("/today");
    return { ok: true };
  } catch (err) {
    console.error("[logMessageSentAction]", err);
    return { error: "Could not log activity. Please try again." };
  }
}

export const markMessageSentAction = logMessageSentAction;

export async function generateBriefAction(
  contactId: string,
  briefType?: string
): Promise<AdvisoryBrief | { error: string }> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId: auth.user.id },
  });
  if (!contact) return { error: "Contact not found" };

  if (isOpenAIEnabled()) {
    const usage = await checkAiUsageAllowed(auth.user.id);
    if (!usage.allowed) {
      return {
        error: `Daily AI generation limit reached. Try again tomorrow or adjust OPENAI_DAILY_GENERATION_CAP.`,
      };
    }
  }

  try {
    const brief = await generateBrief(contact, auth.user, briefType);
    if (brief.source === "openai" && !brief.fallbackUsed) {
      await recordAiUsage(auth.user.id, `brief/${brief.briefType}`);
    }
    return brief;
  } catch (err) {
    console.error("[generateBriefAction]", err);
    return { error: "Could not generate a brief. Please try again." };
  }
}

export async function aiStatusAction(): Promise<{ openai: boolean }> {
  return { openai: isOpenAIEnabled() };
}
