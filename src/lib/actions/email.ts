"use server";

import { revalidatePath } from "next/cache";
import { requireUserForAction } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logMessageSentAction } from "@/lib/actions/ai";
import { sendEmailViaNb, extractNbClientId } from "@/lib/integrations/nb-send-email";
import { isNbEmailSendConfigured } from "@/lib/integrations/nb-send-email";

export async function sendDraftEmailAction(
  messageLogId: string,
  subject: string,
  messageBody?: string
): Promise<{ ok: boolean; sentTo?: string } | { error: string }> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };

  if (!isNbEmailSendConfigured()) {
    return {
      error:
        "Email send is not configured. Set NB_API_BASE_URL and NB_API_KEY (NB uses ZeptoMail on the server).",
    };
  }

  const trimmedSubject = subject.trim();
  if (!trimmedSubject) {
    return { error: "Enter a subject line before sending." };
  }

  const log = await prisma.messageLog.findFirst({
    where: { id: messageLogId, userId: auth.user.id },
    include: { contact: true },
  });
  if (!log) return { error: "Draft not found." };
  if (log.channel !== "email") {
    return { error: "Only email drafts can be sent through NB mail." };
  }

  const contact = log.contact;
  const toEmail = contact.email?.trim();
  if (!toEmail) {
    return { error: "This contact has no email address. Add one in Edit contact." };
  }

  const followUp = new Date();
  followUp.setDate(followUp.getDate() + (auth.user.defaultFollowUpDays || 14));
  const nextTouchDate = followUp.toISOString().slice(0, 10);

  const nbId = extractNbClientId(contact);
  const body = (messageBody?.trim() || log.content).trim();
  if (!body) {
    return { error: "Message body is empty." };
  }

  // Persist edits made in the textarea before send
  if (body !== log.content) {
    await prisma.messageLog.update({
      where: { id: messageLogId },
      data: { content: body },
    });
  }

  const send = await sendEmailViaNb({
    nbClientId: nbId,
    toEmail,
    subject: trimmedSubject,
    message: body,
    nextTouchDate,
  });

  if (!send.ok) {
    return { error: send.error || "Failed to send email." };
  }

  const logged = await logMessageSentAction(messageLogId);
  if ("error" in logged) {
    return {
      error: `Email sent to ${send.sentTo}, but logging in AdvisorFlow failed: ${logged.error}`,
    };
  }

  revalidatePath("/today");
  revalidatePath(`/contacts/${contact.id}`);
  revalidatePath("/contacts");

  return { ok: true, sentTo: send.sentTo || toEmail };
}
