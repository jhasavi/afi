"use client";

import { useState, useTransition } from "react";
import { Download, RefreshCw } from "lucide-react";
import { exportHubSpotCsvAction, syncHubSpotAction } from "@/lib/actions/hubspot";

export function HubSpotPanel({ apiConfigured }: { apiConfigured: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function downloadCsv() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await exportHubSpotCsvAction();
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `advisorflow-hubspot-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`Downloaded CSV with ${res.count} contacts (email required). Import in HubSpot → Contacts → Import.`);
    });
  }

  function syncApi() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await syncHubSpotAction();
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setMessage(
        `HubSpot sync: ${res.synced} synced, ${res.skipped} skipped (no email), ${res.errors} errors.`
      );
    });
  }

  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-slate-900">HubSpot newsletter list</h2>
      <p className="mt-1 text-sm text-slate-600">
        Keep using HubSpot for newsletters. Export contacts with email from AdvisorFlow, or sync
        directly when API token is configured.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={downloadCsv} className="btn-primary">
          <Download className="h-4 w-4" />
          {pending ? "Preparing…" : "Download HubSpot CSV"}
        </button>
        {apiConfigured && (
          <button type="button" disabled={pending} onClick={syncApi} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Sync to HubSpot API
          </button>
        )}
      </div>
      {!apiConfigured && (
        <p className="mt-3 text-xs text-slate-500">
          Free HubSpot: create a private app → copy access token → set{" "}
          <code className="rounded bg-slate-100 px-1">HUBSPOT_ACCESS_TOKEN</code> on Vercel for
          one-click sync. See docs/HUBSPOT.md.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
    </div>
  );
}
