export function isHubSpotConfigured(): boolean {
  return !!process.env.HUBSPOT_ACCESS_TOKEN?.trim();
}

export type HubSpotContactRow = {
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  city?: string;
  lifecyclestage?: string;
  hs_lead_status?: string;
};

/** Split "Jane Doe" → first / last for HubSpot import. */
export function splitName(fullName: string): { firstname: string; lastname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0], lastname: "" };
  return { firstname: parts[0], lastname: parts.slice(1).join(" ") };
}

export function toHubSpotRow(contact: {
  name: string;
  email: string | null;
  phone: string | null;
  town: string | null;
  status: string;
  category: string;
}): HubSpotContactRow | null {
  const email = contact.email?.trim().toLowerCase();
  if (!email) return null;
  const { firstname, lastname } = splitName(contact.name);
  return {
    email,
    firstname,
    lastname,
    phone: contact.phone || undefined,
    city: contact.town || undefined,
    lifecyclestage: contact.category === "Past client" ? "customer" : "lead",
    hs_lead_status: contact.status || undefined,
  };
}

export function hubSpotCsv(rows: HubSpotContactRow[]): string {
  const headers = [
    "Email",
    "First Name",
    "Last Name",
    "Phone Number",
    "City",
    "Lifecycle Stage",
    "Lead Status",
  ];
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.email,
        r.firstname,
        r.lastname,
        r.phone || "",
        r.city || "",
        r.lifecyclestage || "",
        r.hs_lead_status || "",
      ]
        .map(escape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export async function upsertHubSpotContact(
  row: HubSpotContactRow
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN?.trim();
  if (!token) return { ok: false, error: "HUBSPOT_ACCESS_TOKEN not set" };

  const properties: Record<string, string> = {
    email: row.email,
    firstname: row.firstname,
  };
  if (row.lastname) properties.lastname = row.lastname;
  if (row.phone) properties.phone = row.phone;
  if (row.city) properties.city = row.city;
  if (row.lifecyclestage) properties.lifecyclestage = row.lifecyclestage;
  if (row.hs_lead_status) properties.hs_lead_status = row.hs_lead_status;

  try {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });

    if (res.status === 409) {
      // Contact exists — search by email and patch
      const searchRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                { propertyName: "email", operator: "EQ", value: row.email },
              ],
            },
          ],
          limit: 1,
        }),
      });
      const searchJson = (await searchRes.json()) as { results?: { id: string }[] };
      const id = searchJson.results?.[0]?.id;
      if (!id) return { ok: false, error: "Contact exists but could not resolve HubSpot id" };

      const patchRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties }),
      });
      if (!patchRes.ok) {
        const text = await patchRes.text().catch(() => "");
        return { ok: false, error: `HubSpot update failed (${patchRes.status}): ${text.slice(0, 120)}` };
      }
      return { ok: true };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HubSpot create failed (${res.status}): ${text.slice(0, 120)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
