import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";

export default async function Home() {
  const userId = await getSessionUserId();
  if (userId) redirect("/today");

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
            A
          </div>
          <span className="text-lg font-semibold text-slate-900">AdvisorFlow AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-16 text-center">
        <span className="badge bg-brand-50 text-brand-700">
          AI follow-up &amp; advisory copilot
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Know exactly who to contact today —
          <span className="text-brand-600"> and what to say.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          AdvisorFlow AI tells real estate and mortgage professionals who to contact today, why it
          matters, what to say, and how to follow up. Turn the relationships you already have into
          consistent business — in less than 20 minutes a day.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary px-6 py-3 text-base">
            Start free
          </Link>
          <Link href="/login" className="btn-secondary px-6 py-3 text-base">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { t: "Today's 5", d: "A daily, prioritized list of the best people to reach out to." },
          { t: "Why it matters", d: "Clear, practical reasons behind every recommendation." },
          { t: "Warm messages", d: "Non-pushy, advisor-style scripts you can send in seconds." },
          { t: "Follow-up tracking", d: "Never let a relationship fall through the cracks." },
        ].map((f) => (
          <div key={f.t} className="card p-5">
            <h3 className="font-semibold text-slate-900">{f.t}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
