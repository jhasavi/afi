import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-slate-100 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
          A
        </div>
        <span className="text-xl font-semibold text-slate-900">AdvisorFlow AI</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
