"use client";

import { useState, useTransition } from "react";
import { ClipboardList, Sparkles } from "lucide-react";
import { generateMessageAction, logMessageSentAction } from "@/lib/actions/ai";
import type { MessageChannel } from "@/lib/ai/messages";
import { MESSAGE_CHANNELS } from "@/lib/constants";
import { CopyButton } from "@/components/CopyButton";
import { AiFallbackNotice } from "@/components/AiFallbackNotice";

const SERVER_ERROR =
  "Could not reach the server. Make sure the dev server is running, then refresh and try again.";

export function MessageGenerator({
  contactId,
  initialChannel = "text",
  initialMessage = "",
}: {
  contactId: string;
  initialChannel?: MessageChannel;
  initialMessage?: string;
}) {
  const [channel, setChannel] = useState<MessageChannel>(initialChannel);
  const [message, setMessage] = useState(initialMessage);
  const [messageLogId, setMessageLogId] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [meta, setMeta] = useState<{
    whyThisMessage?: string;
    suggestedNextStep?: string;
    followUpTiming?: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    setError(null);
    setLogged(false);
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

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Draft only — AdvisorFlow does not send texts or emails. Copy the message and send it from
        your own phone or email app.
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
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={Math.min(14, Math.max(5, message.split("\n").length + 1))}
            className="input font-normal leading-relaxed"
            aria-label="Message draft"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CopyButton text={message} label="Copy draft" />
            <button
              type="button"
              onClick={logSent}
              disabled={!messageLogId || logged || pending}
              className="btn-secondary"
            >
              <ClipboardList className="h-4 w-4" />
              {logged ? "Logged as sent" : "Log as sent"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            <strong>Log as sent</strong> does not send an email or text. It records that you sent
            this draft from your own email or phone, and updates follow-up tracking.
          </p>
        </div>
      )}
    </div>
  );
}
