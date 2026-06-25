import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-slate-100 text-slate-700",
  "Contact today": "bg-amber-100 text-amber-800",
  "Waiting for reply": "bg-blue-100 text-blue-700",
  Replied: "bg-emerald-100 text-emerald-700",
  "Meeting scheduled": "bg-violet-100 text-violet-700",
  "Needs CMA": "bg-orange-100 text-orange-700",
  "Needs mortgage intro": "bg-orange-100 text-orange-700",
  "Needs follow-up": "bg-amber-100 text-amber-800",
  "Long-term nurture": "bg-teal-100 text-teal-700",
  Closed: "bg-green-100 text-green-800",
  "Dead / inactive": "bg-slate-200 text-slate-500",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("badge", STATUS_COLORS[status] || "bg-slate-100 text-slate-700")}>
      {status}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return <span className="badge bg-brand-50 text-brand-700">{category}</span>;
}

export function StrengthMeter({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Relationship strength ${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i <= value ? "bg-brand-500" : "bg-slate-200"
          )}
        />
      ))}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center p-12 text-center">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
