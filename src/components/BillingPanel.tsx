"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CreditCard, ExternalLink } from "lucide-react";
import { startCheckoutAction, startPortalAction } from "@/lib/actions/billing";
import type { PlanId } from "@/lib/billing/plans";

type Props = {
  plan: string;
  planName: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  stripeConfigured: boolean;
  isActive: boolean;
};

export function BillingPanel({
  plan,
  planName,
  subscriptionStatus,
  trialEndsAt,
  stripeConfigured,
  isActive,
}: Props) {
  const [pending, startTransition] = useTransition();

  function upgrade(target: PlanId) {
    startTransition(async () => {
      const res = await startCheckoutAction(target);
      if (res?.error) alert(res.error);
    });
  }

  function openPortal() {
    startTransition(async () => {
      const res = await startPortalAction();
      if (res?.error) alert(res.error);
    });
  }

  const trialLabel =
    trialEndsAt && new Date(trialEndsAt) > new Date()
      ? `Trial ends ${new Date(trialEndsAt).toLocaleDateString()}`
      : null;

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3">
        <CreditCard className="mt-0.5 h-5 w-5 text-brand-600" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-slate-900">Billing &amp; plan</h2>
          <p className="mt-1 text-sm text-slate-600">
            Current plan: <strong>{planName}</strong>
            {!isActive && " (inactive — using Free limits)"}
            {subscriptionStatus !== "active" && isActive && (
              <span className="ml-1 text-amber-700">({subscriptionStatus})</span>
            )}
          </p>
          {trialLabel && <p className="mt-1 text-xs text-brand-700">{trialLabel}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {plan === "free" && (
              <>
                <button
                  type="button"
                  disabled={pending || !stripeConfigured}
                  onClick={() => upgrade("solo_pro")}
                  className="btn-primary"
                >
                  Start Solo Pro trial
                </button>
                <Link href="/pricing" className="btn-secondary">
                  Compare plans
                </Link>
              </>
            )}
            {plan === "solo_pro" && stripeConfigured && (
              <button type="button" disabled={pending} onClick={openPortal} className="btn-secondary">
                <ExternalLink className="h-4 w-4" />
                Manage subscription
              </button>
            )}
            {(plan === "team" || plan === "brokerage") && stripeConfigured && (
              <button type="button" disabled={pending} onClick={openPortal} className="btn-secondary">
                <ExternalLink className="h-4 w-4" />
                Manage subscription
              </button>
            )}
            {plan === "free" && !stripeConfigured && (
              <p className="text-xs text-slate-500">
                Stripe is not configured in this environment. See docs/BILLING.md.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
