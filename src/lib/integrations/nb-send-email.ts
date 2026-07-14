import { extractNbClientId } from "@/lib/integrations/nb-writeback";
import { isNbSyncConfigured } from "@/lib/integrations/nb";
import type { UserEntitlements } from "@/lib/billing/plans";

export function isNbEmailSendConfigured(): boolean {
  return isNbSyncConfigured();
}

export function isNbEmailSendAvailable(ent: Pick<UserEntitlements, "nbSyncEnabled" | "isActive">): boolean {
  return isNbEmailSendConfigured() && ent.nbSyncEnabled && ent.isActive;
}

export type OutboundSender = {
  fromName: string;
  replyTo: string;
  replyToName: string;
};

export function resolveOutboundSender(user: {
  name: string;
  email: string;
  outboundSenderName?: string | null;
  outboundReplyTo?: string | null;
}): OutboundSender {
  const fromName = user.outboundSenderName?.trim() || user.name.trim();
  const replyTo = user.outboundReplyTo?.trim() || user.email.trim();
  return { fromName, replyTo, replyToName: fromName };
}

export type NbSendEmailResult = {
  ok: boolean;
  sentTo?: string;
  sentAt?: string;
  nextTouchDate?: string;
  error?: string;
};

/** Send one email via NB Mission Control ZeptoMail (explicit advisor action). */
export async function sendEmailViaNb(opts: {
  nbClientId?: string | null;
  toEmail: string;
  subject: string;
  message: string;
  nextTouchDate?: string;
  fromName?: string;
  replyTo?: string;
  replyToName?: string;
}): Promise<NbSendEmailResult> {
  const baseUrl = process.env.NB_API_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.NB_API_KEY || process.env.ADVISORFLOW_EXPORT_API_KEY;
  if (!baseUrl || !apiKey) {
    return { ok: false, error: "NB email send not configured (NB_API_BASE_URL + NB_API_KEY)." };
  }

  const toEmail = opts.toEmail.trim();
  if (!toEmail) {
    return { ok: false, error: "Contact has no email address." };
  }

  try {
    const res = await fetch(`${baseUrl}/api/plugin/advisorflow/send-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nbClientId: opts.nbClientId || undefined,
        toEmail: opts.nbClientId ? undefined : toEmail,
        subject: opts.subject.trim(),
        message: opts.message.trim(),
        nextTouchDate: opts.nextTouchDate,
        fromName: opts.fromName?.trim() || undefined,
        replyTo: opts.replyTo?.trim() || undefined,
        replyToName: opts.replyToName?.trim() || undefined,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as NbSendEmailResult & { error?: string };
    if (!res.ok) {
      return { ok: false, error: json.error || `Send failed (${res.status})` };
    }
    return { ok: true, sentTo: json.sentTo, sentAt: json.sentAt, nextTouchDate: json.nextTouchDate };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export { extractNbClientId };
