import { SubmitButton } from "@/components/SubmitButton";
import { INTERACTION_TYPES, RESPONSE_TYPES, NEXT_ACTIONS } from "@/lib/constants";
import { toDateInputValue } from "@/lib/utils";

export function LogInteractionForm({ action }: { action: (formData: FormData) => void }) {
  const today = toDateInputValue(new Date());
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="type">
            Interaction type
          </label>
          <select id="type" name="type" className="input" defaultValue="Text">
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="date">
            Date
          </label>
          <input id="date" name="date" type="date" className="input" defaultValue={today} />
        </div>
        <div>
          <label className="label" htmlFor="response">
            Response
          </label>
          <select id="response" name="response" className="input" defaultValue="No response yet">
            {RESPONSE_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="nextAction">
            Next action
          </label>
          <select id="nextAction" name="nextAction" className="input" defaultValue="">
            <option value="">— none —</option>
            {NEXT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="followUpAt">
            Next follow-up date
          </label>
          <input id="followUpAt" name="followUpAt" type="date" className="input" />
          <p className="mt-1 text-xs text-slate-400">Leave blank to auto-set from your default interval.</p>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="notes">
          Notes
        </label>
        <textarea id="notes" name="notes" rows={2} className="input" placeholder="What happened? Anything to remember?" />
      </div>
      <div className="flex justify-end">
        <SubmitButton pendingText="Logging…">Log interaction</SubmitButton>
      </div>
    </form>
  );
}
