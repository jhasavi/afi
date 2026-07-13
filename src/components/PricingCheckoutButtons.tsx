"use client";

import { useTransition } from "react";
import Link from "next/link";
import { startCheckoutAction } from "@/lib/actions/billing";
import type { PlanId } from "@/lib/billing/plans";

export function PricingCheckoutButtons({
  plan,
  loggedIn,
  label,
}: {
  plan: PlanId;
  loggedIn: boolean;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  if (!loggedIn) {
    return (
      <Link href={`/signup?plan=${plan}`} className="btn-primary w-full justify-center">
        {label || "Start 14-day trial"}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      className="btn-primary w-full justify-center"
      onClick={() => {
        startTransition(async () => {
          const res = await startCheckoutAction(plan);
          if (res?.error) alert(res.error);
        });
      }}
    >
      {pending ? "Redirecting…" : label || "Start 14-day trial"}
    </button>
  );
}
