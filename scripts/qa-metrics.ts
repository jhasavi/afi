import { PrismaClient } from "@prisma/client";
import { rankTodaysContacts } from "../src/lib/ai/scoring";
import { generateMessage } from "../src/lib/ai/messages";
import { buildTodaysFiveForUser } from "../src/lib/today";

async function main() {
  const prisma = new PrismaClient();

  const user = await prisma.user.findUnique({ where: { email: "demo@advisorflow.ai" } });
  if (!user) {
    console.error("Demo user not found — run npm run db:seed first");
    process.exit(1);
  }

  const contacts = await prisma.contact.findMany({ where: { userId: user.id } });
  const now = new Date();
  const ACTIVE = ["Replied", "Meeting Scheduled", "Active Opportunity"];
  const ACTIVE_PIPELINE = ["Contact Today", "Active Opportunity", "Meeting Scheduled", "Replied"];

  const ranked = rankTodaysContacts(contacts, now, 5);
  console.log("=== TODAY'S 5 (scoring) ===");
  ranked.forEach((r, i) => console.log(`${i + 1}. ${r.contact.name} (${r.score})`));

  await prisma.dailyRecommendation.deleteMany({ where: { userId: user.id } });
  await buildTodaysFiveForUser(user, false);
  const recs = await prisma.dailyRecommendation.findMany({
    where: { userId: user.id },
    orderBy: { rank: "asc" },
    include: { contact: true },
  });
  console.log("\n=== STORED RECOMMENDATIONS ===", recs.length);
  recs.forEach((r) => console.log(`${r.rank}. ${r.contact.name}`));

  const raj = contacts.find((c) => c.name === "Raj Patel");
  if (raj) {
    const msg = await generateMessage("text", raj, user);
    console.log("\n=== SAMPLE MESSAGE (Raj Patel) ===\n", msg);
  }

  // Simulate log-as-sent (same DB writes as logMessageSentAction — no email)
  const target = contacts[0];
  const log = await prisma.messageLog.create({
    data: {
      userId: user.id,
      contactId: target.id,
      channel: "text",
      content: "QA test draft message",
    },
  });
  const followUp = new Date();
  followUp.setDate(followUp.getDate() + 14);
  await prisma.$transaction([
    prisma.messageLog.update({ where: { id: log.id }, data: { sentAt: new Date() } }),
    prisma.interaction.create({
      data: {
        userId: user.id,
        contactId: target.id,
        type: "Text",
        channel: "text",
        messageUsed: log.content,
        response: "No response yet",
        date: new Date(),
        followUpAt: followUp,
        notes: "Logged from message draft (sent outside AdvisorFlow).",
      },
    }),
  ]);
  const interactionCount = await prisma.interaction.count({
    where: { userId: user.id, contactId: target.id },
  });
  console.log("\n=== LOG AS SENT ===", { contact: target.name, interactions: interactionCount });

  console.log("\n=== DASHBOARD METRICS (after fix) ===");
  console.log(
    JSON.stringify(
      {
        totalContacts: contacts.length,
        inNurture: await prisma.contact.count({
          where: { userId: user.id, pipelineStage: "Long-Term Nurture" },
        }),
        activeOpportunities: await prisma.contact.count({
          where: {
            userId: user.id,
            pipelineStage: { in: ACTIVE_PIPELINE },
            status: { notIn: ["Closed", "Dead / inactive"] },
          },
        }),
        overdue: await prisma.contact.count({
          where: {
            userId: user.id,
            nextFollowUpAt: { lt: now },
            status: { notIn: ["Closed", "Dead / inactive"] },
          },
        }),
        needsAction: await prisma.contact.count({
          where: {
            userId: user.id,
            status: {
              in: ["Contact today", "Needs follow-up", "New", "Needs CMA", "Needs mortgage intro"],
            },
          },
        }),
        meetings: await prisma.contact.count({
          where: { userId: user.id, pipelineStage: "Meeting Scheduled" },
        }),
        pipelineValue: (
          await prisma.contact.aggregate({
            where: { userId: user.id, pipelineStage: { in: ACTIVE } },
            _sum: { estimatedValue: true },
          })
        )._sum.estimatedValue,
        draftsLoggedAsSent: await prisma.messageLog.count({
          where: { userId: user.id, sentAt: { not: null } },
        }),
        contactedThisWeek: new Set(
          (
            await prisma.interaction.findMany({
              where: { userId: user.id, date: { gte: new Date(now.getTime() - 7 * 86400000) } },
              select: { contactId: true },
            })
          ).map((i) => i.contactId)
        ).size,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
