import { isOpenAIEnabled } from "@/lib/ai/config";

/** Plain-language AI mode banner for non-technical users. */
export function AiEngineStatus({ compact = false }: { compact?: boolean }) {
  const openai = isOpenAIEnabled();

  if (openai) {
    return (
      <div
        className={
          compact
            ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            : "card border-emerald-200 bg-emerald-50/50 p-6"
        }
      >
        <p className="font-medium text-emerald-800">OpenAI is connected</p>
        <p className="mt-1 text-sm text-emerald-700">
          Messages and briefs are drafted using your OpenAI API key (server-side only). If OpenAI is
          temporarily unavailable, AdvisorFlow automatically falls back to safe built-in templates.
          Suggestions are for you to review — AdvisorFlow does not send texts or emails on your behalf.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          : "card p-6"
      }
    >
      <p className="font-medium text-slate-900">Built-in template mode (active)</p>
      <ul
        className={`mt-2 space-y-1.5 text-sm text-slate-600 ${
          compact ? "" : "list-disc pl-5"
        }`}
      >
        <li>
          Drafts are created on your computer using built-in, guardrail-safe templates — no external
          AI service.
        </li>
        <li>No external AI API is used unless an administrator adds an OpenAI API key.</li>
        <li>Every message is a draft suggestion only — copy it and send from your own phone or email.</li>
        <li>Demo mode works fully without OpenAI; nothing extra is required to try the app.</li>
      </ul>
      {!compact && (
        <p className="mt-3 text-xs text-slate-500">
          Developers: see README.md → &quot;Enable OpenAI (optional)&quot; for setup steps.
        </p>
      )}
    </div>
  );
}
