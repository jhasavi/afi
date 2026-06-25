import "server-only";
import { prisma } from "./db";

export async function logAudit(
  action: string,
  opts: { userId?: string; entity?: string; entityId?: string; metadata?: Record<string, unknown> } = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action,
        entity: opts.entity ?? null,
        entityId: opts.entityId ?? null,
        metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
      },
    });
  } catch (err) {
    console.error("[AdvisorFlow Audit]", action, err);
  }
}
