import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";

export function SuccessBanner({
  message,
  dismissHref,
}: {
  message: string;
  dismissHref?: string;
}) {
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
      <p className="flex-1 font-medium">{message}</p>
      {dismissHref && (
        <Link
          href={dismissHref}
          className="text-emerald-700 hover:text-emerald-900"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
