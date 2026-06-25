"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, CheckCircle2 } from "lucide-react";
import { importContactsAction, type ImportResult } from "@/lib/actions/import";
import { IMPORTABLE_FIELDS, CONTACT_FIELD_LABELS } from "@/lib/constants";

type Step = "upload" | "map" | "done";

const NONE = "__none__";

// Heuristics to auto-map CSV columns to app fields.
function guessField(header: string): string | null {
  const h = header.toLowerCase().replace(/[^a-z]/g, "");
  const map: Record<string, string> = {
    name: "name",
    fullname: "name",
    contact: "name",
    firstname: "name",
    email: "email",
    emailaddress: "email",
    phone: "phone",
    phonenumber: "phone",
    mobile: "phone",
    cell: "phone",
    category: "category",
    type: "category",
    town: "town",
    city: "town",
    location: "town",
    notes: "notes",
    note: "notes",
    comments: "notes",
    status: "status",
    opportunity: "opportunityType",
    opportunitytype: "opportunityType",
    source: "source",
    tags: "tags",
    tag: "tags",
    strength: "relationshipStrength",
    relationshipstrength: "relationshipStrength",
    lastcontacted: "lastContactedAt",
    lastcontact: "lastContactedAt",
  };
  return map[h] ?? null;
}

export function CsvImporter() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFile(file: File) {
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields || [];
        if (cols.length === 0) {
          setError("Could not read any columns from that file.");
          return;
        }
        const data = (res.data as Record<string, string>[]).filter((r) =>
          Object.values(r).some((v) => v && String(v).trim())
        );
        setHeaders(cols);
        setRows(data);

        // Auto-map: field -> column
        const auto: Record<string, string> = {};
        for (const field of IMPORTABLE_FIELDS) {
          const col = cols.find((c) => guessField(c) === field);
          auto[field] = col ?? NONE;
        }
        setMapping(auto);
        setStep("map");
      },
      error: (err) => setError(err.message),
    });
  }

  function buildMappedRows() {
    return rows.map((row) => {
      const out: Record<string, string> = {};
      for (const field of IMPORTABLE_FIELDS) {
        const col = mapping[field];
        if (col && col !== NONE) out[field] = String(row[col] ?? "").trim();
      }
      return out;
    });
  }

  function doImport() {
    if (mapping.name === NONE || !mapping.name) {
      setError("Please map the Name field — it's required.");
      return;
    }
    setError(null);
    const mapped = buildMappedRows();
    startTransition(async () => {
      try {
        const res = await importContactsAction(mapped);
        if ("error" in res) {
          setError(res.error);
          return;
        }
        setResult(res);
        setStep("done");
        router.refresh();
      } catch {
        setError("Could not reach the server. Check that the dev server is running.");
      }
    });
  }

  const previewRows = buildMappedRows().slice(0, 5);

  if (step === "done" && result) {
    return (
      <div className="card p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h2 className="mt-3 text-lg font-semibold text-slate-900">Import complete</h2>
        <p className="mt-1 text-sm text-slate-600">
          Imported <span className="font-medium text-emerald-700">{result.imported}</span> contact
          {result.imported === 1 ? "" : "s"}
          {result.skipped > 0 && <> · {result.skipped} duplicate{result.skipped === 1 ? "" : "s"} skipped</>}
          {result.errors > 0 && <> · {result.errors} row{result.errors === 1 ? "" : "s"} missing a name</>}
          .
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            className="btn-secondary"
            onClick={() => {
              setStep("upload");
              setRows([]);
              setHeaders([]);
              setResult(null);
            }}
          >
            Import another file
          </button>
          <a href="/contacts" className="btn-primary">
            View contacts
          </a>
          <a href="/today" className="btn-secondary">
            Go to Today&apos;s 5
          </a>
        </div>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div className="space-y-6">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900">Map your columns</h2>
          <p className="mt-1 text-sm text-slate-500">
            We matched {rows.length} row{rows.length === 1 ? "" : "s"}. Confirm how your CSV columns
            map to AdvisorFlow fields.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {IMPORTABLE_FIELDS.map((field) => (
              <div key={field} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">
                  {CONTACT_FIELD_LABELS[field] ?? field}
                  {field === "name" && <span className="text-red-500"> *</span>}
                </span>
                <select
                  value={mapping[field] ?? NONE}
                  onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                  className="input w-44"
                >
                  <option value={NONE}>— skip —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-3 text-sm font-medium text-slate-700">
            Preview (first {previewRows.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  {IMPORTABLE_FIELDS.filter((f) => mapping[f] && mapping[f] !== NONE).map((f) => (
                    <th key={f} className="px-4 py-2 font-medium">
                      {CONTACT_FIELD_LABELS[f] ?? f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewRows.map((r, i) => (
                  <tr key={i}>
                    {IMPORTABLE_FIELDS.filter((f) => mapping[f] && mapping[f] !== NONE).map((f) => (
                      <td key={f} className="px-4 py-2 text-slate-600">
                        {r[f] || <span className="text-slate-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button className="btn-secondary" onClick={() => setStep("upload")}>
            Back
          </button>
          <button className="btn-primary" onClick={doImport} disabled={pending}>
            {pending ? "Importing…" : `Import ${rows.length} contact${rows.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40">
        <Upload className="h-10 w-10 text-slate-400" />
        <span className="mt-3 text-sm font-medium text-slate-700">
          Click to upload a CSV file
        </span>
        <span className="mt-1 text-xs text-slate-400">
          Any export from Gmail, Google Contacts, or a CRM works — you&apos;ll map columns next.
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700">Expected columns</h3>
        <p className="mt-1 text-sm text-slate-500">
          A header row with any of: name, email, phone, category, town, notes, status, opportunity
          type, source, tags, relationship strength, last contacted. Only <strong>name</strong> is
          required. Duplicates (by email or phone) are skipped automatically.
        </p>
      </div>
    </div>
  );
}
