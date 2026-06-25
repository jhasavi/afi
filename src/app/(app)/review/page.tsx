import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireUser();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const staleCutoff = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);

  const [overdue, stale, wins, pipelineMovers] = await Promise.all([
    prisma.contact.findMany({
      where: {
        userId: user.id,
        nextFollowUpAt: { lt: now },
        status: { notIn: ["Closed", "Dead / inactive"] },
      },
      orderBy: { nextFollowUpAt: "asc" },
      take: 10,
    }),
    prisma.contact.findMany({
      where: {
        userId: user.id,
        OR: [{ lastContactedAt: { lt: staleCutoff } }, { lastContactedAt: null }],
        status: { notIn: ["Closed", "Dead / inactive"] },
      },
      orderBy: { lastContactedAt: "asc" },
      take: 10,
    }),
    prisma.interaction.findMany({
      where: {
        userId: user.id,
        date: { gte: weekAgo },
        response: { in: ["Positive", "Neutral"] },
      },
      include: { contact: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.contact.findMany({
      where: {
        userId: user.id,
        pipelineStage: { in: ["Active Opportunity", "Meeting Scheduled", "Replied"] },
        status: { notIn: ["Closed", "Dead / inactive"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Weekly review"
        subtitle="Overdue follow-ups, stale relationships, and wins this week"
      />

      <div className="mx-auto max-w-3xl space-y-8 p-8">
        <section className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600">
            Overdue follow-ups ({overdue.length})
          </h2>
          {overdue.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">None — nice work.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {overdue.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <Link href={`/contacts/${c.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                    {c.name}
                  </Link>
                  <span className="text-xs text-slate-400">
                    Due {c.nextFollowUpAt ? formatDate(c.nextFollowUpAt) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">
            Stale relationships ({stale.length})
          </h2>
          <p className="mt-1 text-xs text-slate-500">No contact in 120+ days</p>
          {stale.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">All relationships recently touched.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stale.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <Link href={`/contacts/${c.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                    {c.name}
                  </Link>
                  <span className="text-xs text-slate-400">{c.category}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Wins this week ({wins.length})
          </h2>
          {wins.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Log responses from Today&apos;s 5 to track wins.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {wins.map((i) => (
                <li key={i.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/contacts/${i.contact.id}`}
                    className="font-medium text-slate-900 hover:text-brand-600"
                  >
                    {i.contact.name}
                  </Link>
                  <span className="badge bg-emerald-50 text-emerald-700">{i.response}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Active pipeline
          </h2>
          <ul className="mt-3 space-y-2">
            {pipelineMovers.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <Link href={`/contacts/${c.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                  {c.name}
                </Link>
                <span className="text-xs text-slate-400">{c.pipelineStage}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
