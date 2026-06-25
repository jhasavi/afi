import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import type { User } from "@prisma/client";

export function OnboardingChecklist({
  user,
  contactCount,
}: {
  user: User;
  contactCount: number;
}) {
  const profileDone = !!(user.serviceAreas?.trim() || user.role?.trim());
  const contactsDone = contactCount >= 3;
  const complete = profileDone && contactsDone;

  if (complete) return null;

  const steps = [
    {
      done: profileDone,
      label: "Complete your profile (role or service area)",
      href: "/settings",
    },
    {
      done: contactsDone,
      label: "Add at least 3 contacts (or import CSV)",
      href: contactCount === 0 ? "/import" : "/contacts",
    },
  ];

  return (
    <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50/50 p-4">
      <h2 className="text-sm font-semibold text-brand-900">Get started with AdvisorFlow</h2>
      <p className="mt-1 text-xs text-brand-700">
        Complete these steps so Today&apos;s 5 can prioritize your best opportunities.
      </p>
      <ul className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-sm">
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Circle className="h-4 w-4 text-slate-400" />
            )}
            <Link href={step.href} className={step.done ? "text-slate-500 line-through" : "text-brand-800 hover:underline"}>
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
