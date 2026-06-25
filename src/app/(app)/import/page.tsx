import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { CsvImporter } from "@/components/CsvImporter";
import { NbSyncPanel } from "@/components/NbSyncPanel";
import { isNbSyncConfigured } from "@/lib/integrations/nb";

export default async function ImportPage() {
  await requireUser();
  const nbConfigured = isNbSyncConfigured();

  return (
    <div>
      <PageHeader
        title="Import contacts"
        subtitle="Sync from NB Mission Control or upload a CSV"
      />
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <NbSyncPanel configured={nbConfigured} />
        <CsvImporter />
      </div>
    </div>
  );
}
