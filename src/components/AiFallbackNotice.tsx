/** Subtle notice when OpenAI was configured but template fallback was used. */
export function AiFallbackNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      OpenAI was unavailable, so AdvisorFlow used safe built-in templates for this draft.
    </p>
  );
}
