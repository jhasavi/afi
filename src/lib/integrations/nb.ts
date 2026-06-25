import type { IntegrationProvider } from "./types";

export type NbContactExport = {
  name: string;
  email?: string;
  phone?: string;
  town?: string;
  notes?: string;
  category?: string;
  status?: string;
  opportunityType?: string;
  source?: string;
  tags?: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  nbClientId: string;
};

export type NbExportResponse = {
  source: string;
  exportedAt: string;
  count: number;
  contacts: NbContactExport[];
};

function getConfig(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = process.env.NB_API_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.NB_API_KEY || process.env.ADVISORFLOW_EXPORT_API_KEY;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey };
}

export function isNbSyncConfigured(): boolean {
  return getConfig() !== null;
}

export async function fetchNbContacts(opts?: {
  overdueOnly?: boolean;
  limit?: number;
}): Promise<{ contacts: NbContactExport[]; error?: string }> {
  const config = getConfig();
  if (!config) {
    return {
      contacts: [],
      error: "NB sync not configured. Set NB_API_BASE_URL and NB_API_KEY in .env.",
    };
  }

  const params = new URLSearchParams();
  if (opts?.overdueOnly) params.set("overdueOnly", "true");
  if (opts?.limit) params.set("limit", String(opts.limit));

  try {
    const res = await fetch(
      `${config.baseUrl}/api/plugin/advisorflow/contacts?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { contacts: [], error: `NB export failed (${res.status}): ${text.slice(0, 200)}` };
    }

    const json = (await res.json()) as NbExportResponse;
    return { contacts: json.contacts || [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { contacts: [], error: message };
  }
}

export const nbProvider: IntegrationProvider = {
  name: "Namaste Boston MC",
  status: isNbSyncConfigured() ? "connected" : "stub",
  async syncContacts() {
    const { contacts, error } = await fetchNbContacts({ limit: 500 });
    if (error) return { contactsUpdated: 0, errors: [error] };
    return {
      contactsUpdated: contacts.length,
      errors: contacts.length ? [] : ["No contacts returned from NB export."],
    };
  },
};
