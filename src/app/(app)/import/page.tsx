import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { CsvImporter } from "@/components/CsvImporter";
import { NbSyncPanel } from "@/components/NbSyncPanel";
import { isNbSyncConfigured } from "@/lib/integrations/nb";
import { getEntitlementsForUser } from "@/lib/billing/entitlements";

export default async function ImportPage() {
  const user = await requireUser();
  const nbConfigured = isNbSyncConfigured();
  const entitlements = await getEntitlementsForUser(user.id);

  return (
    <div>
      <PageHeader
        title="Import contacts"
        subtitle="CSV upload, or NB Mission Control sync on Team"
      />
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <NbSyncPanel configured={nbConfigured} entitled={entitlements.nbSyncEnabled && entitlements.isActive} />
        <CsvImporter />
      </div>
    </div>
  );
}
