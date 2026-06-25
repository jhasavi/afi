import Link from "next/link";
import {
  Phone,
  MessageCircle,
  CalendarClock,
  AlertTriangle,
  TrendingUp,
  Leaf,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTIVE_STAGES = ["Replied", "Meeting Scheduled", "Active Opportunity"];
const ACTIVE_PIPELINE_STAGES = [
  "Contact Today",
  "Active Opportunity",
  "Meeting Scheduled",
  "Replied",
];

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    interactionsThisWeek,
    repliesThisWeek,
    messagesGenerated,
    messagesSent,
    meetingsScheduled,
    inNurture,
    activeOpportunities,
    activeValueAgg,
    overdueContacts,
    needsActionContacts,
    overdueCount,
    needsActionCount,
  ] = await Promise.all([
    prisma.interaction.findMany({
      where: { userId: user.id, date: { gte: weekAgo } },
      select: { contactId: true },
    }),
    prisma.interaction.count({
      where: {
        userId: user.id,
        date: { gte: weekAgo },
        response: { in: ["Positive", "Neutral"] },
      },
    }),
    prisma.messageLog.count({ where: { userId: user.id, createdAt: { gte: weekAgo } } }),
    prisma.messageLog.count({
      where: { userId: user.id, sentAt: { gte: weekAgo } },
    }),
    prisma.contact.count({
      where: { userId: user.id, pipelineStage: "Meeting Scheduled" },
    }),
    prisma.contact.count({
      where: { userId: user.id, pipelineStage: "Long-Term Nurture" },
    }),
    prisma.contact.count({
      where: {
        userId: user.id,
        pipelineStage: { in: ACTIVE_PIPELINE_STAGES },
        status: { notIn: ["Closed", "Dead / inactive"] },
      },
    }),
    prisma.contact.aggregate({
      where: { userId: user.id, pipelineStage: { in: ACTIVE_STAGES } },
      _sum: { estimatedValue: true },
    }),
    prisma.contact.findMany({
      where: {
        userId: user.id,
        nextFollowUpAt: { lt: now },
        status: { notIn: ["Closed", "Dead / inactive"] },
      },
      orderBy: { nextFollowUpAt: "asc" },
      take: 8,
    }),
    prisma.contact.findMany({
      where: {
        userId: user.id,
        status: { in: ["Contact today", "Needs follow-up", "New", "Needs CMA", "Needs mortgage intro"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.contact.count({
      where: {
        userId: user.id,
        nextFollowUpAt: { lt: now },
        status: { notIn: ["Closed", "Dead / inactive"] },
      },
    }),
    prisma.contact.count({
      where: {
        userId: user.id,
        status: { in: ["Contact today", "Needs follow-up", "New", "Needs CMA", "Needs mortgage intro"] },
      },
    }),
  ]);

  const contactedThisWeek = new Set(interactionsThisWeek.map((i) => i.contactId)).size;
  const pipelineValue = activeValueAgg._sum.estimatedValue || 0;
  const replyRate = messagesSent > 0 ? Math.round((repliesThisWeek / messagesSent) * 100) : null;

  const metrics = [
    { label: "Contacted this week", value: contactedThisWeek, icon: Phone, color: "text-brand-600" },
    { label: "Replies received", value: repliesThisWeek, icon: MessageCircle, color: "text-emerald-600" },
    { label: "Meetings scheduled", value: meetingsScheduled, icon: CalendarClock, color: "text-violet-600" },
    { label: "Follow-ups overdue", value: overdueCount, icon: AlertTriangle, color: "text-red-600" },
    { label: "Active opportunities", value: activeOpportunities, icon: TrendingUp, color: "text-amber-600" },
    { label: "In nurture", value: inNurture, icon: Leaf, color: "text-teal-600" },
    { label: "Messages generated", value: messagesGenerated, icon: MessageCircle, color: "text-slate-600" },
    { label: "Drafts logged as sent", value: messagesSent, icon: CheckCircle2, color: "text-emerald-600" },
  ];

  const madeProgress = contactedThisWeek > 0 || messagesSent > 0;

  return (
    <div>
      <PageHeader
        title="Weekly dashboard"
        subtitle="Did I make relationship progress this week?"
      />

      <div className="space-y-8 p-8">
        <div
          className={`rounded-xl border p-5 ${
            madeProgress
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <p className={`text-base font-semibold ${madeProgress ? "text-emerald-800" : "text-amber-800"}`}>
            {madeProgress
              ? `Yes — you reached out to ${contactedThisWeek} ${
                  contactedThisWeek === 1 ? "person" : "people"
                } and logged ${messagesSent} draft${messagesSent === 1 ? "" : "s"} as sent this week.`
              : "Not yet this week — head to Today's 5 and reach out to a few people."}
          </p>
          {replyRate !== null && (
            <p className="mt-1 text-sm text-slate-600">
              Reply rate: <span className="font-medium">{replyRate}%</span> ({repliesThisWeek} repl
              {repliesThisWeek === 1 ? "y" : "ies"} of {messagesSent} logged draft
              {messagesSent === 1 ? "" : "s"})
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{m.label}</span>
                  <Icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <div className="mt-2 text-3xl font-semibold text-slate-900">{m.value}</div>
              </div>
            );
          })}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Estimated pipeline value (active)</span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-1 text-3xl font-semibold text-slate-900">
            ${pipelineValue.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Sum of estimated value across Replied, Meeting Scheduled, and Active Opportunity stages.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ListCard
            title="Overdue follow-ups"
            total={overdueCount}
            empty="No overdue follow-ups. Nice work staying on top of things."
            contacts={overdueContacts}
            showDate
          />
          <ListCard
            title="Contacts needing action"
            total={needsActionCount}
            empty="Nothing flagged for action right now."
            contacts={needsActionContacts}
          />
        </div>
      </div>
    </div>
  );
}

function ListCard({
  title,
  total,
  empty,
  contacts,
  showDate,
}: {
  title: string;
  total?: number;
  empty: string;
  contacts: { id: string; name: string; status: string; nextFollowUpAt: Date | null }[];
  showDate?: boolean;
}) {
  const showing = contacts.length;
  const header = total !== undefined ? `${title} (${total})` : title;

  return (
    <div className="card p-6">
      <h3 className="mb-1 text-base font-semibold text-slate-900">{header}</h3>
      {total !== undefined && total > showing && (
        <p className="mb-3 text-xs text-slate-400">Showing {showing} of {total}</p>
      )}
      {(total === undefined || total <= showing) && contacts.length > 0 && (
        <div className="mb-3" />
      )}
      {contacts.length === 0 ? (
        <p className="text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2.5">
              <Link href={`/contacts/${c.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                {c.name}
              </Link>
              <div className="flex items-center gap-3">
                {showDate && (
                  <span className="text-xs font-medium text-red-600">
                    {formatDate(c.nextFollowUpAt)}
                  </span>
                )}
                <StatusBadge status={c.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
