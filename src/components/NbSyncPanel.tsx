"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Download, RefreshCw } from "lucide-react";
import { syncFromNbAction } from "@/lib/actions/nb-sync";

export function NbSyncPanel({
  configured,
  entitled = true,
}: {
  configured: boolean;
  entitled?: boolean;
}) {
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
        `Synced ${res.total} from MC: ${res.imported} new, ${res.refreshed} refreshed, ${res.linked} linked, ${res.errors} errors.`
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
            Import contacts into AdvisorFlow for today&apos;s list and drafts. When you{" "}
            <strong>Log as sent</strong>, touch dates can write back to NB — we never send messages
            for you.
          </p>

          {!entitled ? (
            <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Mission Control sync is included on the{" "}
              <Link href="/pricing" className="font-medium text-brand-600 hover:underline">
                Team plan
              </Link>
              . Use CSV import on Free or Solo Pro.
            </p>
          ) : !configured ? (
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
