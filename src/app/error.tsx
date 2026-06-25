"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="max-w-md text-sm text-slate-600">
        AdvisorFlow hit an unexpected error. Your data is safe — try again or return to Today&apos;s 5.
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <a href="/today" className="btn-secondary">
          Go to Today&apos;s 5
        </a>
      </div>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-4 max-w-lg overflow-auto rounded bg-slate-100 p-3 text-left text-xs text-slate-700">
          {error.message}
        </pre>
      )}
    </div>
  );
}
