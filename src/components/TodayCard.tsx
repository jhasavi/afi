"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, X, ArrowRight, Lightbulb, Clock } from "lucide-react";
import { MessageGenerator } from "@/components/MessageGenerator";
import { ResponseButtons } from "@/components/ResponseButtons";
import { CategoryBadge } from "@/components/ui";
import { setRecommendationStatusAction, snoozeRecommendationAction } from "@/lib/actions/recommendations";
import type { MessageChannel } from "@/lib/ai/messages";
import { cn, formatDate } from "@/lib/utils";

export type TodayItem = {
  id: string;
  rank: number;
  reason: string;
  suggestedMessage: string;
  channel: string;
  nextStep: string;
  followUpDate: Date | null;
  priorityScore: number;
  status: string;
  contact: {
    id: string;
    name: string;
    email: string | null;
    category: string;
    town: string | null;
    opportunityType: string;
  };
};

export function TodayCard({
  item,
  emailSendEnabled = false,
}: {
  item: TodayItem;
  emailSendEnabled?: boolean;
}) {
  const [status, setStatus] = useState(item.status);
  const [pending, startTransition] = useTransition();

  function update(next: "sent" | "skipped") {
    startTransition(async () => {
      try {
        const res = await setRecommendationStatusAction(item.id, next);
        if ("error" in res) return;
        setStatus(next);
      } catch {
        // Server unreachable
      }
    });
  }

  function snooze() {
    startTransition(async () => {
      try {
        const res = await snoozeRecommendationAction(item.id, 7);
        if ("error" in res) return;
        setStatus("skipped");
      } catch {
        // Server unreachable
      }
    });
  }

  const handled = status === "sent" || status === "skipped";

  return (
    <div className={cn("card overflow-hidden transition-opacity", handled && "opacity-60")}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-6">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
          {item.rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/contacts/${item.contact.id}`}
              className="text-lg font-semibold text-slate-900 hover:text-brand-600"
            >
              {item.contact.name}
            </Link>
            <CategoryBadge category={item.contact.category} />
            <span className="badge bg-slate-100 text-slate-600">{item.contact.opportunityType}</span>
            {item.contact.town && (
              <span className="text-xs text-slate-400">· {item.contact.town}</span>
            )}
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-slate-400">
              Priority
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700">
                {item.priorityScore}
              </span>
            </span>
          </div>

          <div className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <p>{item.reason}</p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">Next step:</span> {item.nextStep}
            </span>
            {item.followUpDate && (
              <span className="text-slate-400">
                Suggested follow-up: {formatDate(item.followUpDate)}
              </span>
            )}
          </div>

          <div className="mt-4">
            <MessageGenerator
              contactId={item.contact.id}
              contactName={item.contact.name}
              contactEmail={item.contact.email}
              emailSendEnabled={emailSendEnabled}
              initialChannel={(item.channel as MessageChannel) ?? "text"}
              initialMessage={item.suggestedMessage}
            />
          </div>

          {!handled && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <ResponseButtons contactId={item.contact.id} />
            </div>
          )}

          <div className="sticky bottom-0 mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 bg-white pt-4 sm:static sm:bg-transparent">
            {handled ? (
              <span
                className={cn(
                  "badge",
                  status === "sent"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {status === "sent" ? "Logged as contacted today" : "Skipped / snoozed"}
              </span>
            ) : (
              <>
                <button type="button" onClick={() => update("sent")} disabled={pending} className="btn-primary">
                  <Check className="h-4 w-4" />
                  Log as contacted
                </button>
                <button type="button" onClick={snooze} disabled={pending} className="btn-secondary">
                  <Clock className="h-4 w-4" />
                  Snooze 7 days
                </button>
                <button type="button" onClick={() => update("skipped")} disabled={pending} className="btn-ghost">
                  <X className="h-4 w-4" />
                  Skip
                </button>
              </>
            )}
            <Link href={`/contacts/${item.contact.id}`} className="btn-ghost sm:ml-auto">
              Log full interaction
            </Link>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Logging contact does not send messages — copy your draft and reach out from your own
            phone or email.
          </p>
        </div>
      </div>
    </div>
  );
}
