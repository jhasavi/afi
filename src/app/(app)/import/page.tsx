import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { CsvImporter } from "@/components/CsvImporter";
import { NbSyncPanel } from "@/components/NbSyncPanel";
import { HubSpotPanel } from "@/components/HubSpotPanel";
import { isNbSyncConfigured } from "@/lib/integrations/nb";
import { isHubSpotConfigured } from "@/lib/integrations/hubspot";
import { getEntitlementsForUser } from "@/lib/billing/entitlements";

export default async function ImportPage() {
  const user = await requireUser();
  const nbConfigured = isNbSyncConfigured();
  const hubspotConfigured = isHubSpotConfigured();
  const entitlements = await getEntitlementsForUser(user.id);

  return (
    <div>
      <PageHeader
        title="Import contacts"
        subtitle="Mission Control sync, CSV, or HubSpot export"
      />
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <strong>Mission Control is the source of truth</strong> for adding or removing real
          clients. Sync imports or refreshes contacts into AdvisorFlow. Edits and deletes here do
          not remove records from MC — use{" "}
          <a
            href="https://www.namastebostonhomes.com/nbadmin/mc"
            className="font-medium text-brand-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            /nbadmin/mc
          </a>{" "}
          for CRM changes.
        </div>

        <NbSyncPanel configured={nbConfigured} entitled={entitlements.nbSyncEnabled && entitlements.isActive} />
        <CsvImporter />
        <HubSpotPanel apiConfigured={hubspotConfigured} />
      </div>
    </div>
  );
}
