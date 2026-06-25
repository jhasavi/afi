import "server-only";
import { prisma } from "@/lib/db";
import { getOpenAIDailyCap } from "@/lib/env";

export async function checkAiUsageAllowed(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const cap = getOpenAIDailyCap();
  if (cap <= 0) return { allowed: true, remaining: -1 };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.aiUsageLog.count({
    where: { userId, createdAt: { gte: startOfDay } },
  });

  return { allowed: count < cap, remaining: Math.max(0, cap - count) };
}

export async function recordAiUsage(userId: string, action: string): Promise<void> {
  await prisma.aiUsageLog.create({ data: { userId, action } });
}
