"use client";

import { useState, useTransition } from "react";
import { FileText } from "lucide-react";
import { generateBriefAction } from "@/lib/actions/ai";
import type { AdvisoryBrief } from "@/lib/ai/briefs";
import { BRIEF_TYPES } from "@/lib/constants";
import { CopyButton } from "@/components/CopyButton";
import { AiFallbackNotice } from "@/components/AiFallbackNotice";

const SERVER_ERROR =
  "Could not reach the server. Make sure the dev server is running, then refresh and try again.";

export function BriefGenerator({ contactId }: { contactId: string }) {
  const [briefType, setBriefType] = useState<string>("");
  const [brief, setBrief] = useState<AdvisoryBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await generateBriefAction(contactId, briefType || undefined);
        if ("error" in res) {
          setError(res.error);
          return;
        }
        setBrief(res);
      } catch {
        setError(SERVER_ERROR);
      }
    });
  }

  const briefText = brief
    ? [
        `${brief.briefType}`,
        ``,
        `SUMMARY: ${brief.summary}`,
        ``,
        `LIKELY NEED: ${brief.likelyNeed}`,
        ``,
        `QUESTIONS TO ASK:`,
        ...brief.questionsToAsk.map((q) => `- ${q}`),
        ``,
        `VALUE TO PROVIDE: ${brief.valueToProvide}`,
        ``,
        `NEXT 3 STEPS:`,
        ...brief.nextThreeSteps.map((s, i) => `${i + 1}. ${s}`),
        ``,
        `SUGGESTED MESSAGE: ${brief.suggestedMessage}`,
        ``,
        `ASSUMPTIONS & DISCLAIMERS: ${brief.assumptions}`,
      ].join("\n")
    : "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={briefType}
          onChange={(e) => setBriefType(e.target.value)}
          className="input w-auto"
        >
          <option value="">Auto-detect brief type</option>
          {BRIEF_TYPES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <button type="button" onClick={generate} disabled={pending} className="btn-primary">
          <FileText className="h-4 w-4" />
          {pending ? "Preparing…" : brief ? "Regenerate brief" : "Generate brief"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <AiFallbackNotice show={brief?.fallbackUsed ?? false} />

      {brief && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">{brief.briefType}</h4>
            <CopyButton text={briefText} label="Copy brief" />
          </div>

          <BriefSection title="Summary">{brief.summary}</BriefSection>
          <BriefSection title="Likely need">{brief.likelyNeed}</BriefSection>

          <div className="mb-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Important questions to ask
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {brief.questionsToAsk.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>

          <BriefSection title="Suggested value to provide">{brief.valueToProvide}</BriefSection>

          <div className="mb-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recommended next 3 steps
            </div>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
              {brief.nextThreeSteps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>

          <BriefSection title="Suggested message">{brief.suggestedMessage}</BriefSection>

          <div className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span className="font-semibold">Assumptions &amp; disclaimers:</span> {brief.assumptions}
          </div>
        </div>
      )}
    </div>
  );
}

function BriefSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </div>
      <p className="text-sm text-slate-700">{children}</p>
    </div>
  );
}
