"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-8 text-center font-sans">
        <h1 className="text-xl font-semibold text-slate-900">AdvisorFlow AI</h1>
        <p className="text-sm text-slate-600">A critical error occurred. Please refresh and try again.</p>
        <button type="button" onClick={reset} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
          Try again
        </button>
      </body>
    </html>
  );
}
