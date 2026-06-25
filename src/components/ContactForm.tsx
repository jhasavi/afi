import type { Contact } from "@prisma/client";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { parseTags, toDateInputValue } from "@/lib/utils";
import {
  CONTACT_CATEGORIES,
  CONTACT_STATUSES,
  OPPORTUNITY_TYPES,
} from "@/lib/constants";

export function ContactForm({
  contact,
  action,
  submitLabel,
  cancelHref,
}: {
  contact?: Contact;
  action: (formData: FormData) => void;
  submitLabel: string;
  cancelHref: string;
}) {
  const tags = contact ? parseTags(contact.tags).join(", ") : "";

  return (
    <form action={action} className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Basics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
          <label className="label" htmlFor="name">
            Full name *
          </label>
            <input id="name" name="name" required className="input" defaultValue={contact?.name ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" className="input" defaultValue={contact?.email ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <input id="phone" name="phone" className="input" defaultValue={contact?.phone ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="town">
              Town / City
            </label>
            <input id="town" name="town" className="input" defaultValue={contact?.town ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="source">
              Source
            </label>
            <input
              id="source"
              name="source"
              className="input"
              placeholder="e.g. Past client, Sphere, Open house"
              defaultValue={contact?.source ?? ""}
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Classification
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <select id="category" name="category" className="input" defaultValue={contact?.category ?? "Other"}>
              {CONTACT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="opportunityType">
              Opportunity type
            </label>
            <select
              id="opportunityType"
              name="opportunityType"
              className="input"
              defaultValue={contact?.opportunityType ?? "General relationship nurture"}
            >
              {OPPORTUNITY_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <select id="status" name="status" className="input" defaultValue={contact?.status ?? "New"}>
              {CONTACT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="relationshipStrength">
              Relationship strength
            </label>
            <select
              id="relationshipStrength"
              name="relationshipStrength"
              className="input"
              defaultValue={String(contact?.relationshipStrength ?? 3)}
            >
              <option value="1">1 — Cold / barely know them</option>
              <option value="2">2 — Acquaintance</option>
              <option value="3">3 — Warm</option>
              <option value="4">4 — Strong</option>
              <option value="5">5 — Close / advocate</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tags">
              Tags <span className="text-slate-400">(comma-separated)</span>
            </label>
            <input id="tags" name="tags" className="input" defaultValue={tags} placeholder="VIP, golf, school-parent" />
          </div>
          <div>
            <label className="label" htmlFor="estimatedValue">
              Estimated value <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="estimatedValue"
              name="estimatedValue"
              className="input"
              placeholder="e.g. 12000"
              defaultValue={contact?.estimatedValue ?? ""}
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Follow-up &amp; notes
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="lastContactedAt">
              Last contacted
            </label>
            <input
              id="lastContactedAt"
              name="lastContactedAt"
              type="date"
              className="input"
              defaultValue={toDateInputValue(contact?.lastContactedAt)}
            />
          </div>
          <div>
            <label className="label" htmlFor="nextFollowUpAt">
              Next follow-up
            </label>
            <input
              id="nextFollowUpAt"
              name="nextFollowUpAt"
              type="date"
              className="input"
              defaultValue={toDateInputValue(contact?.nextFollowUpAt)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              className="input"
              placeholder="What do you know about them? Family, goals, timeline, how you met…"
              defaultValue={contact?.notes ?? ""}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
