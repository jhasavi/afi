import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Network,
  Radar,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildBusinessReview } from "@/lib/business-review";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BusinessReviewPage() {
  const user = await requireUser();
  const contacts = await prisma.contact.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      category: true,
      status: true,
      opportunityType: true,
      pipelineStage: true,
      relationshipStrength: true,
      lastContactedAt: true,
      nextFollowUpAt: true,
      estimatedValue: true,
      nbClientId: true,
    },
  });

  const review = buildBusinessReview(contacts);
  const coverage =
    review.totalContacts === 0
      ? 0
      : Math.round((review.contactedLast30 / review.totalContacts) * 100);
  const nbCoverage =
    review.totalContacts === 0
      ? 0
      : Math.round((review.nbLinkedCount / review.totalContacts) * 100);

  return (
    <div>
      <PageHeader
        title="Business review"
        subtitle="Is the relationship engine creating brokerage momentum?"
        action={
          <Link href="/today" className="btn-primary">
            <Radar className="h-4 w-4" />
            Work today&apos;s list
          </Link>
        }
      />

      <div className="space-y-8 p-8">
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Business health</p>
                <h2 className="mt-2 text-4xl font-semibold text-slate-950">
                  {review.healthScore}
                  <span className="text-lg text-slate-400">/100</span>
                </h2>
                <p className="mt-2 text-base font-medium text-brand-700">{review.grade}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">What this means</p>
                <p className="mt-1 max-w-md">
                  This score looks at recent touches, overdue follow-ups, active opportunities,
                  and contact data quality. It is a practical brokerage operating score, not a vanity
                  traffic metric.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900">This week&apos;s moves</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
              {review.weeklyActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Contacts touched in 30 days"
            value={`${coverage}%`}
            detail={`${review.contactedLast30} of ${review.totalContacts}`}
            icon={CheckCircle2}
            tone="emerald"
          />
          <MetricCard
            label="Overdue follow-ups"
            value={review.overdueCount.toLocaleString()}
            detail="Clear these before chasing cold leads"
            icon={AlertTriangle}
            tone="amber"
          />
          <MetricCard
            label="Active opportunities"
            value={review.activeOpportunityCount.toLocaleString()}
            detail={`$${review.activePipelineValue.toLocaleString()} estimated value`}
            icon={CircleDollarSign}
            tone="brand"
          />
          <MetricCard
            label="NB-linked contacts"
            value={`${nbCoverage}%`}
            detail={`${review.nbLinkedCount} synced from Mission Control`}
            icon={Network}
            tone="slate"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <FocusCard
            title="Retention engine"
            icon={Users}
            body={`${review.staleWarmCount} warm relationship${review.staleWarmCount === 1 ? "" : "s"} need attention. These are usually easier wins than brand-new internet leads.`}
            actionHref="/review"
            actionLabel="Open weekly review"
          />
          <FocusCard
            title="Referral flywheel"
            icon={Network}
            body={`${review.referralPartnerCount} referral partner${review.referralPartnerCount === 1 ? "" : "s"} are in the book. Touch them monthly with something useful, not a generic ask.`}
            actionHref="/contacts"
            actionLabel="Review contacts"
          />
          <FocusCard
            title="Data quality"
            icon={ClipboardCheck}
            body={`${review.missingContactInfoCount} contact${review.missingContactInfoCount === 1 ? "" : "s"} are missing both email and phone. Fixing this improves Today's list and HubSpot export quality.`}
            actionHref="/import"
            actionLabel="Import or clean data"
          />
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold text-slate-900">Buyer-facing proof</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <ProofPoint
              title="Clear daily habit"
              body="The product does not ask advisors to live in another CRM. It gives them a short, ranked list to work every morning."
            />
            <ProofPoint
              title="Works with existing systems"
              body="NB Mission Control stays the source of truth. HubSpot can stay the newsletter tool. AdvisorFlow becomes the action layer."
            />
            <ProofPoint
              title="Safe outreach"
              body="Draft-first messaging, compliance guardrails, and explicit send/log actions keep the advisor in control."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof CheckCircle2;
  tone: "emerald" | "amber" | "brand" | "slate";
}) {
  const toneClass = {
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    brand: "text-brand-600 bg-brand-50",
    slate: "text-slate-600 bg-slate-100",
  }[tone];

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-lg p-2 ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function FocusCard({
  title,
  body,
  actionHref,
  actionLabel,
  icon: Icon,
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
  icon: typeof Users;
}) {
  return (
    <div className="card p-6">
      <Icon className="h-5 w-5 text-brand-600" />
      <h2 className="mt-3 text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      <Link href={actionHref} className="mt-4 inline-flex text-sm font-medium text-brand-700 hover:text-brand-800">
        {actionLabel}
      </Link>
    </div>
  );
}

function ProofPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
