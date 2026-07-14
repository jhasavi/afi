"use client";

import { useState, useTransition } from "react";
import { ClipboardList, Mail, Sparkles } from "lucide-react";
import { generateMessageAction, logMessageSentAction } from "@/lib/actions/ai";
import { sendDraftEmailAction } from "@/lib/actions/email";
import type { MessageChannel } from "@/lib/ai/messages";
import { MESSAGE_CHANNELS } from "@/lib/constants";
import { CopyButton } from "@/components/CopyButton";
import { AiFallbackNotice } from "@/components/AiFallbackNotice";

const SERVER_ERROR =
  "Could not reach the server. Make sure the dev server is running, then refresh and try again.";

export function MessageGenerator({
  contactId,
  contactName,
  contactEmail,
  emailSendEnabled = false,
  senderPreview,
  initialChannel = "text",
  initialMessage = "",
}: {
  contactId: string;
  contactName?: string;
  contactEmail?: string | null;
  emailSendEnabled?: boolean;
  senderPreview?: string;
  initialChannel?: MessageChannel;
  initialMessage?: string;
}) {
  const [channel, setChannel] = useState<MessageChannel>(initialChannel);
  const [message, setMessage] = useState(initialMessage);
  const [subject, setSubject] = useState(
    contactName ? `Following up — ${contactName}` : "Following up"
  );
  const [messageLogId, setMessageLogId] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);
  const [sentViaNb, setSentViaNb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [meta, setMeta] = useState<{
    whyThisMessage?: string;
    suggestedNextStep?: string;
    followUpTiming?: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const canSendEmail =
    emailSendEnabled && channel === "email" && !!contactEmail?.trim() && !!message && !!messageLogId;

  function generate() {
    setError(null);
    setLogged(false);
    setSentViaNb(false);
    setFallbackUsed(false);
    setMeta(null);
    startTransition(async () => {
      try {
        const res = await generateMessageAction(contactId, channel);
        if ("error" in res) {
          setError(res.error);
          return;
        }
        setMessage(res.content);
        setMessageLogId(res.messageLogId);
        setFallbackUsed(res.meta.fallbackUsed);
        setMeta({
          whyThisMessage: res.meta.whyThisMessage,
          suggestedNextStep: res.meta.suggestedNextStep,
          followUpTiming: res.meta.followUpTiming,
        });
      } catch {
        setError(SERVER_ERROR);
      }
    });
  }

  function logSent() {
    if (!messageLogId) return;
    startTransition(async () => {
      try {
        const res = await logMessageSentAction(messageLogId);
        if ("error" in res) {
          setError(res.error);
          return;
        }
        setLogged(true);
      } catch {
        setError(SERVER_ERROR);
      }
    });
  }

  function sendEmail() {
    if (!messageLogId || !canSendEmail) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await sendDraftEmailAction(messageLogId, subject, message);
        if ("error" in res) {
          setError(res.error);
          return;
        }
        setSentViaNb(true);
        setLogged(true);
      } catch {
        setError(SERVER_ERROR);
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        {emailSendEnabled && channel === "email" && contactEmail
          ? "Draft first — copy and send yourself, or use Send via NB mail (ZeptoMail, same as Mission Control). Nothing sends automatically."
          : "Draft only — AdvisorFlow does not send texts or emails unless you click Send via NB mail (Team + email channel). Otherwise copy and send from your own app."}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as MessageChannel)}
          className="input w-auto"
        >
          {MESSAGE_CHANNELS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={generate} disabled={pending} className="btn-primary">
          <Sparkles className="h-4 w-4" />
          {pending ? "Generating…" : message ? "Regenerate draft" : "Generate draft"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <AiFallbackNotice show={fallbackUsed} />

      {meta && (meta.whyThisMessage || meta.suggestedNextStep) && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {meta.whyThisMessage && (
            <p>
              <span className="font-medium text-slate-700">Why this draft: </span>
              {meta.whyThisMessage}
            </p>
          )}
          {meta.suggestedNextStep && (
            <p className="mt-1">
              <span className="font-medium text-slate-700">Suggested next step: </span>
              {meta.suggestedNextStep}
              {meta.followUpTiming ? ` · ${meta.followUpTiming}` : ""}
            </p>
          )}
        </div>
      )}

      {message && (
        <div>
          {channel === "email" && emailSendEnabled && contactEmail && (
            <div className="mb-3">
              <label className="label" htmlFor={`subject-${contactId}`}>
                Email subject
              </label>
              <input
                id={`subject-${contactId}`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input"
                maxLength={200}
              />
              <p className="mt-1 text-xs text-slate-500">
                To: {contactEmail}
                {senderPreview ? ` · From: ${senderPreview}` : ""}
              </p>
            </div>
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={Math.min(14, Math.max(5, message.split("\n").length + 1))}
            className="input font-normal leading-relaxed"
            aria-label="Message draft"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CopyButton text={message} label="Copy draft" />
            {canSendEmail && (
              <button
                type="button"
                onClick={sendEmail}
                disabled={pending || sentViaNb || logged}
                className="btn-primary"
              >
                <Mail className="h-4 w-4" />
                {sentViaNb ? "Email sent" : pending ? "Sending…" : "Send via NB mail"}
              </button>
            )}
            <button
              type="button"
              onClick={logSent}
              disabled={!messageLogId || logged || sentViaNb || pending}
              className="btn-secondary"
            >
              <ClipboardList className="h-4 w-4" />
              {logged ? "Logged as sent" : "Log as sent"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            <strong>Send via NB mail</strong> uses Mission Control&apos;s ZeptoMail (Team plan) and logs the touch
            in MC + AdvisorFlow. <strong>Log as sent</strong> is for when you sent from your own
            email app or phone.
          </p>
        </div>
      )}
    </div>
  );
}
