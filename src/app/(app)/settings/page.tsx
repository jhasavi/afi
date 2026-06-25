import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { updateProfileAction } from "@/lib/actions/auth";
import { AiEngineStatus } from "@/components/AiEngineStatus";
import { IntegrationFlags } from "@/components/IntegrationFlags";
import { BUSINESS_TYPES, TONE_OPTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Profile, business, and AI preferences" />

      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <form action={updateProfileAction} className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Profile
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" name="name" className="input" defaultValue={user.name} />
              </div>
              <div>
                <label className="label" htmlFor="companyName">Company name</label>
                <input id="companyName" name="companyName" className="input" defaultValue={user.companyName ?? ""} />
              </div>
              <div>
                <label className="label" htmlFor="role">Role</label>
                <input id="role" name="role" className="input" placeholder="e.g. Realtor, Loan Officer" defaultValue={user.role ?? ""} />
              </div>
              <div>
                <label className="label" htmlFor="businessType">Primary business type</label>
                <select id="businessType" name="businessType" className="input" defaultValue={user.businessType}>
                  {BUSINESS_TYPES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="serviceAreas">Service area / towns served</label>
                <input id="serviceAreas" name="serviceAreas" className="input" placeholder="e.g. Needham, Newton, Wellesley" defaultValue={user.serviceAreas ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="primaryBusinessFocus">Primary business focus</label>
                <input id="primaryBusinessFocus" name="primaryBusinessFocus" className="input" placeholder="e.g. Listings, first-time buyers, refinances" defaultValue={user.primaryBusinessFocus ?? ""} />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              AI &amp; outreach preferences
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="communicationStyle">Preferred tone</label>
                <select id="communicationStyle" name="communicationStyle" className="input" defaultValue={user.communicationStyle}>
                  {TONE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="aiStylePreference">AI style preference</label>
                <select id="aiStylePreference" name="aiStylePreference" className="input" defaultValue={user.aiStylePreference}>
                  {TONE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="dailyContactGoal">Daily contact goal</label>
                <input id="dailyContactGoal" name="dailyContactGoal" type="number" min={1} max={20} className="input" defaultValue={user.dailyContactGoal} />
              </div>
              <div>
                <label className="label" htmlFor="defaultFollowUpDays">Default follow-up interval (days)</label>
                <input id="defaultFollowUpDays" name="defaultFollowUpDays" type="number" min={1} max={365} className="input" defaultValue={user.defaultFollowUpDays} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="defaultDisclaimer">Default disclaimer text</label>
                <textarea id="defaultDisclaimer" name="defaultDisclaimer" rows={2} className="input" placeholder="Appended to advisory briefs. Leave blank to use a smart default for your business type." defaultValue={user.defaultDisclaimer ?? ""} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
          </div>
        </form>

        <AiEngineStatus />
        <IntegrationFlags />
      </div>
    </div>
  );
}
