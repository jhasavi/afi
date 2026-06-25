"use client";

import { useState, useTransition } from "react";
import { Download, RefreshCw } from "lucide-react";
import { syncFromNbAction } from "@/lib/actions/nb-sync";

export function NbSyncPanel({ configured }: { configured: boolean }) {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function sync(overdueOnly: boolean) {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await syncFromNbAction({ overdueOnly });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setResult(
        `Imported ${res.imported} contacts from NB Mission Control (${res.skipped} skipped as duplicates, ${res.errors} errors, ${res.total} exported).`
      );
    });
  }

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 text-brand-600" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-slate-900">
            Sync from Namaste Boston Mission Control
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            One-way import from NB CRM into AdvisorFlow for Today&apos;s 5 and AI drafts. Does not
            send messages or modify NB data.
          </p>

          {!configured ? (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Configure <code className="rounded bg-amber-100 px-1">NB_API_BASE_URL</code> and{" "}
              <code className="rounded bg-amber-100 px-1">NB_API_KEY</code> in .env. Use the same
              key as <code className="rounded bg-amber-100 px-1">ADVISORFLOW_EXPORT_API_KEY</code> on
              the NB server.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => sync(false)}
                className="btn-primary"
              >
                <RefreshCw className="h-4 w-4" />
                {pending ? "Syncing…" : "Import all (up to 500)"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => sync(true)}
                className="btn-secondary"
              >
                Import overdue only
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {result && <p className="mt-3 text-sm text-emerald-700">{result}</p>}
        </div>
      </div>
    </div>
  );
}
