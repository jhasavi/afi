const CRM_EXPORT_GUIDES = [
  {
    name: "HubSpot",
    steps: [
      "Contacts → select records → Export",
      "Choose properties: name, email, phone, city, last activity",
      "Download CSV → upload below in Import CSV",
    ],
  },
  {
    name: "Salesforce",
    steps: [
      "Reports → New Report → Contacts (or Leads)",
      "Add columns: Name, Email, Phone, Mailing City, Last Activity",
      "Run → Export → Export Details → Excel or CSV",
      "Upload the CSV below and map columns",
    ],
  },
  {
    name: "Top Producer",
    steps: [
      "Contacts → select contacts → Export",
      "Choose CSV format with name, email, phone, address",
      "Upload below; map Name, Email, Phone, Town, Last contacted",
    ],
  },
  {
    name: "Lone Wolf",
    steps: [
      "Contacts → export / download contact list (CSV)",
      "Include email and phone when available",
      "Upload below and map columns on the next step",
    ],
  },
] as const;

export function CrmImportGuide() {
  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-slate-900">Import from your CRM</h2>
      <p className="mt-1 text-sm text-slate-600">
        AdvisorFlow works on top of your existing CRM. Export contacts as CSV, then upload in the
        next section. No CRM replacement — just your daily outreach list.
      </p>
      <ul className="mt-4 space-y-4">
        {CRM_EXPORT_GUIDES.map((crm) => (
          <li key={crm.name} className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <h3 className="text-sm font-semibold text-slate-900">{crm.name}</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-600">
              {crm.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-500">
        Namaste Boston users on Team: use Mission Control sync above instead of CSV when possible.
      </p>
    </div>
  );
}
