import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { CsvImporter } from "@/components/CsvImporter";

export default async function ImportPage() {
  await requireUser();
  return (
    <div>
      <PageHeader
        title="Import contacts"
        subtitle="Upload a CSV, map your columns, and preview before importing"
      />
      <div className="mx-auto max-w-3xl p-8">
        <CsvImporter />
      </div>
    </div>
  );
}
