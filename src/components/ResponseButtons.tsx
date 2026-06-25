"use client";

import { useState, useTransition } from "react";
import { recordQuickResponseAction } from "@/lib/actions/interactions";

const OPTIONS = [
  { value: "Positive" as const, label: "Positive", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { value: "Neutral" as const, label: "Neutral", className: "bg-slate-50 text-slate-700 border-slate-200" },
  { value: "Not now" as const, label: "Not now", className: "bg-amber-50 text-amber-800 border-amber-200" },
];

export function ResponseButtons({ contactId }: { contactId: string }) {
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(response: "Positive" | "Neutral" | "Not now") {
    setError(null);
    startTransition(async () => {
      const res = await recordQuickResponseAction(contactId, response);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSaved(response);
    });
  }

  if (saved) {
    return (
      <p className="text-xs text-emerald-700">
        Response logged: <strong>{saved}</strong> — follow-up date updated.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500">Quick log response</p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={pending}
            onClick={() => save(opt.value)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium ${opt.className} disabled:opacity-50`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
