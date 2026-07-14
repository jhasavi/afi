import Link from "next/link";
import { getSessionUserId } from "@/lib/auth";
import { PLANS, type PlanEntitlements } from "@/lib/billing/plans";
import { Check } from "lucide-react";
import { PricingCheckoutButtons } from "@/components/PricingCheckoutButtons";

export const dynamic = "force-dynamic";

const FEATURE_ROWS: { label: string; display: (t: PlanEntitlements) => string }[] = [
  { label: "Today's outreach list", display: (t) => `${t.todaysCount} contacts/day` },
  { label: "OpenAI drafts & briefs", display: (t) => (t.openAiEnabled ? "Yes" : "Template only") },
  { label: "AI generations / month", display: (t) => (t.aiGenerationsPerMonth ? String(t.aiGenerationsPerMonth) : "—") },
  { label: "Contact limit", display: (t) => t.maxContacts.toLocaleString() },
  { label: "NB Mission Control sync", display: (t) => (t.nbSyncEnabled ? "Import + write-back + send" : "—") },
];

export default async function PricingPage() {
  const userId = await getSessionUserId();
  const tiers = [PLANS.free, PLANS.solo_pro, PLANS.team] as const;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
            A
          </div>
          <span className="text-lg font-semibold text-slate-900">AdvisorFlow AI</span>
        </Link>
        <div className="flex items-center gap-3">
          {userId ? (
            <Link href="/today" className="btn-primary">
              Go to app
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Start free
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Simple pricing</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          CRM tells you who you have. AdvisorFlow tells you who to contact <strong>today</strong> —
          with drafts you copy and send yourself.
        </p>

        <div className="mt-12 grid gap-6 text-left lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`card flex flex-col p-6 ${tier.id === "solo_pro" ? "ring-2 ring-brand-500" : ""}`}
            >
              {tier.id === "solo_pro" && (
                <span className="badge mb-3 w-fit bg-brand-50 text-brand-700">Most popular</span>
              )}
              <h2 className="text-xl font-semibold text-slate-900">{tier.name}</h2>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {tier.priceMonthly === null
                  ? "Custom"
                  : tier.priceMonthly === 0
                    ? "$0"
                    : `$${tier.priceMonthly}`}
                {tier.priceMonthly ? <span className="text-base font-normal text-slate-500">/mo</span> : null}
              </p>
              {tier.id === "solo_pro" && (
                <p className="mt-1 text-sm text-brand-700">14-day free trial · then ${tier.priceMonthly}/mo</p>
              )}
              {tier.id === "team" && (
                <p className="mt-1 text-sm text-slate-500">
                  Includes Mission Control sync for small teams
                </p>
              )}

              <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-700">
                {FEATURE_ROWS.map((row) => (
                  <li key={row.label} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    <span>
                      {row.label}: {row.display(tier)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {tier.id === "free" && (
                  <Link href="/signup" className="btn-secondary w-full justify-center">
                    Start free
                  </Link>
                )}
                {tier.id === "solo_pro" && (
                  <PricingCheckoutButtons plan="solo_pro" loggedIn={!!userId} />
                )}
                {tier.id === "team" && (
                  <PricingCheckoutButtons plan="team" loggedIn={!!userId} label="Start Team" />
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-500">
          Brokerage / white-label?{" "}
          <a href="mailto:hello@advisorflow.ai" className="text-brand-600 hover:underline">
            Contact us
          </a>
          . All plans are draft-only — AdvisorFlow never auto-sends email or SMS.
        </p>
      </section>
    </main>
  );
}
