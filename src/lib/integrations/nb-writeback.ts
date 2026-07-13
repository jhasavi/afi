import type { Contact } from "@prisma/client";

const NB_ID_RE = /\[NB client id:\s*([^\]]+)\]/i;

export function extractNbClientId(contact: Pick<Contact, "nbClientId" | "notes">): string | null {
  if (contact.nbClientId?.trim()) return contact.nbClientId.trim();
  const match = contact.notes?.match(NB_ID_RE);
  return match?.[1]?.trim() || null;
}

export async function patchNbContactDates(
  nbClientId: string,
  opts: { lastContactDate: string; nextTouchDate: string }
): Promise<{ ok: boolean; error?: string }> {
  const baseUrl = process.env.NB_API_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.NB_API_KEY || process.env.ADVISORFLOW_EXPORT_API_KEY;
  if (!baseUrl || !apiKey) {
    return { ok: false, error: "NB API not configured" };
  }

  try {
    const res = await fetch(`${baseUrl}/api/plugin/advisorflow/contacts/${nbClientId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lastContactDate: opts.lastContactDate,
        nextTouchDate: opts.nextTouchDate,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `NB write-back failed (${res.status}): ${text.slice(0, 200)}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
