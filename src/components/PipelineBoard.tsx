"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import { PIPELINE_STAGES } from "@/lib/constants";
import { updatePipelineStageAction } from "@/lib/actions/contacts";
import { cn, formatDate } from "@/lib/utils";

export type PipelineContact = {
  id: string;
  name: string;
  category: string;
  town: string | null;
  pipelineStage: string;
  nextFollowUpAt: Date | null;
  estimatedValue: number | null;
};

export function PipelineBoard({ contacts }: { contacts: PipelineContact[] }) {
  const [items, setItems] = useState(contacts);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function move(id: string, stage: string) {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, pipelineStage: stage } : c)));
    startTransition(async () => {
      await updatePipelineStageAction(id, stage);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageItems = items.filter((c) => c.pipelineStage === stage);
        const value = stageItems.reduce((sum, c) => sum + (c.estimatedValue || 0), 0);
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
            onDrop={() => {
              if (dragId) move(dragId, stage);
              setDragId(null);
              setOverStage(null);
            }}
            className={cn(
              "flex w-72 flex-shrink-0 flex-col rounded-xl border bg-slate-100/60 p-3",
              overStage === stage ? "border-brand-400 bg-brand-50" : "border-slate-200"
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-slate-700">{stage}</h3>
              <span className="badge bg-white text-slate-500">{stageItems.length}</span>
            </div>
            {value > 0 && (
              <div className="mb-2 px-1 text-xs text-slate-400">
                Est. ${value.toLocaleString()}
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2">
              {stageItems.map((c) => {
                const overdue = c.nextFollowUpAt && new Date(c.nextFollowUpAt) < new Date();
                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => setDragId(null)}
                    className="group cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-1">
                      <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-300 group-hover:text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/contacts/${c.id}`}
                          className="block truncate text-sm font-medium text-slate-800 hover:text-brand-600"
                        >
                          {c.name}
                        </Link>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {c.category}
                          {c.town ? ` · ${c.town}` : ""}
                        </div>
                        {c.nextFollowUpAt && (
                          <div
                            className={cn(
                              "mt-1 text-xs",
                              overdue ? "font-medium text-red-600" : "text-slate-400"
                            )}
                          >
                            Follow-up: {formatDate(c.nextFollowUpAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    <select
                      value={c.pipelineStage}
                      onChange={(e) => move(c.id, e.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 focus:border-brand-400 focus:outline-none"
                    >
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s} value={s}>
                          Move to: {s}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
              {stageItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
