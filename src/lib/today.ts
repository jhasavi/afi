import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { rankTodaysContacts } from "@/lib/ai/scoring";
import { generateMessage, type MessageChannel } from "@/lib/ai/messages";
import { enhanceTodayRecommendation } from "@/lib/ai/today-reasoning";
import { todayKey } from "@/lib/utils";
import { getEntitlementsForUser, effectiveTodaysCount } from "@/lib/billing/entitlements";

const CHANNEL_MAP: Record<string, MessageChannel> = {
  text: "text",
  email: "email",
  social: "social",
  call: "call",
  voicemail: "voicemail",
};

export async function buildTodaysFiveForUser(user: User, force = false): Promise<void> {
  const forDate = todayKey();

  const existing = await prisma.dailyRecommendation.count({
    where: { userId: user.id, forDate },
  });
  if (existing > 0 && !force) return;

  if (force) {
    await prisma.dailyRecommendation.deleteMany({ where: { userId: user.id, forDate } });
  }

  const contacts = await prisma.contact.findMany({ where: { userId: user.id } });
  if (contacts.length === 0) return;

  const ent = await getEntitlementsForUser(user.id);
  const dailyCount = effectiveTodaysCount(ent, user.dailyContactGoal || 5);

  const ranked = rankTodaysContacts(contacts, new Date(), dailyCount);

  const withMessages = await Promise.all(
    ranked.map(async (r) => {
      const channel = CHANNEL_MAP[r.suggestedChannel] ?? "text";
      const forceTemplate = !ent.openAiEnabled || !ent.isActive;
      const templateDraft = await generateMessage(channel, r.contact, user, { forceTemplate });
      const enhanced = await enhanceTodayRecommendation(
        r,
        user,
        channel,
        templateDraft.content,
        { forceTemplate }
      );
      return { r, channel, enhanced };
    })
  );

  await prisma.$transaction(
    withMessages.map(({ r, channel, enhanced }, idx) =>
      prisma.dailyRecommendation.create({
        data: {
          userId: user.id,
          contactId: r.contact.id,
          forDate,
          reason: enhanced.reason,
          suggestedMessage: enhanced.message,
          channel,
          nextStep: enhanced.nextStep,
          followUpDate: r.suggestedFollowUpDate,
          priorityScore: r.score,
          rank: idx + 1,
          status: "pending",
        },
      })
    )
  );
}
