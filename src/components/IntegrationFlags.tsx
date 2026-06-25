import { getFeatureStatus, FEATURE_DESCRIPTIONS, type FeatureFlag } from "@/lib/features";
import { getOpenAIDailyCap } from "@/lib/env";
import { isOpenAIEnabled } from "@/lib/ai/config";

const FLAG_ORDER: FeatureFlag[] = ["GMAIL_SYNC", "CRM_SYNC", "SMS_SEND"];

export function IntegrationFlags() {
  const flags = getFeatureStatus();
  const cap = getOpenAIDailyCap();

  return (
    <div className="card p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Integrations &amp; limits
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Optional integrations are disabled by default. AdvisorFlow never auto-sends messages.
      </p>
      <ul className="space-y-3">
        {FLAG_ORDER.map((key) => {
          const meta = FEATURE_DESCRIPTIONS[key];
          const enabled = flags[key];
          return (
            <li
              key={key}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900">{meta.title}</span>
                <span
                  className={`badge text-xs ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                >
                  {enabled ? "Enabled" : "Coming soon"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{meta.description}</p>
            </li>
          );
        })}
      </ul>
      {isOpenAIEnabled() && (
        <p className="mt-4 text-xs text-slate-500">
          OpenAI daily generation cap: {cap <= 0 ? "unlimited" : `${cap} per user`} (set{" "}
          <code className="rounded bg-slate-100 px-1">OPENAI_DAILY_GENERATION_CAP</code> in .env).
          Default model: gpt-4o-mini for cost control.
        </p>
      )}
    </div>
  );
}
