import Link from "next/link";
import { RefreshCw, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildTodaysFiveForUser } from "@/lib/today";
import { regenerateTodaysFiveFormAction } from "@/lib/actions/recommendations";
import { PageHeader, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { TodayCard, type TodayItem } from "@/components/TodayCard";
import { AiEngineStatus } from "@/components/AiEngineStatus";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { todayKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await requireUser();

  const contactCount = await prisma.contact.count({ where: { userId: user.id } });

  // Make sure today's list exists.
  if (contactCount > 0) {
    await buildTodaysFiveForUser(user, false);
  }

  const recs = await prisma.dailyRecommendation.findMany({
    where: { userId: user.id, forDate: todayKey() },
    orderBy: { rank: "asc" },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          category: true,
          town: true,
          opportunityType: true,
        },
      },
    },
  });

  const items: TodayItem[] = recs.map((r) => ({
    id: r.id,
    rank: r.rank,
    reason: r.reason,
    suggestedMessage: r.suggestedMessage,
    channel: r.channel,
    nextStep: r.nextStep,
    followUpDate: r.followUpDate,
    priorityScore: r.priorityScore,
    status: r.status,
    contact: r.contact,
  }));

  const done = items.filter((i) => i.status !== "pending").length;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <PageHeader
        title="Today's 5"
        subtitle={`${today} — your best relationship opportunities today`}
        action={
          <form action={regenerateTodaysFiveFormAction}>
            <SubmitButton className="btn-secondary !bg-white !text-slate-700 hover:!bg-slate-50 border border-slate-300" pendingText="Refreshing…">
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </SubmitButton>
          </form>
        }
      />

      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <div className="mb-6">
          <AiEngineStatus compact />
        </div>

        <OnboardingChecklist user={user} contactCount={contactCount} />

        {contactCount === 0 ? (
          <EmptyState
            title="Add contacts to get your daily 5"
            description="AdvisorFlow needs a few contacts to recommend who to reach out to. Import a CSV or add someone to get started."
            action={
              <div className="flex gap-2">
                <Link href="/import" className="btn-secondary">
                  Import CSV
                </Link>
                <Link href="/contacts/new" className="btn-primary">
                  Add contact
                </Link>
              </div>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No recommendations yet"
            description="Try regenerating your list."
          />
        ) : (
          <>
            <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
              <Sparkles className="h-4 w-4 text-brand-500" />
              {done} of {items.length} handled today. Aim to clear all {items.length} in under 20
              minutes.
            </div>
            <div className="space-y-5">
              {items.map((item) => (
                <TodayCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
