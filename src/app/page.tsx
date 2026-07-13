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
          <Link href="/pricing" className="btn-ghost">
            Pricing
          </Link>
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-12 pt-16 text-center">
        <span className="badge bg-brand-50 text-brand-700">
          Daily relationship OS · draft-first
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Who to contact today —
          <span className="text-brand-600"> why, what to say, and what&apos;s next.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          AdvisorFlow is the morning ritual for real estate and mortgage professionals: a prioritized
          list from your book, with warm drafts you copy and send yourself. Consistent follow-up in
          under 20 minutes a day — without another CRM.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
          We never auto-send email or SMS. Works with CSV — or sync Namaste Boston Mission Control on
          Team.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary px-6 py-3 text-base">
            Start free
          </Link>
          <Link href="/pricing" className="btn-secondary px-6 py-3 text-base">
            View pricing
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <ol className="grid gap-4 sm:grid-cols-2">
          {[
            { n: "1", t: "Who", d: "Your book is scored; the highest-value people surface today." },
            { n: "2", t: "Why today", d: "Clear reasons tied to timing, strength, and opportunity." },
            { n: "3", t: "What to say", d: "Channel-ready drafts — copy, paste, send yourself." },
            { n: "4", t: "What's next", d: "Log as sent, set the follow-up, stay out of cracks." },
          ].map((f) => (
            <li key={f.n} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                {f.n}
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{f.t}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <div className="card bg-brand-50 p-8">
          <h2 className="text-2xl font-bold text-slate-900">Solo Pro — 14-day trial</h2>
          <p className="mt-2 text-slate-600">
            OpenAI drafts, full weekly review, and up to 2,000 contacts. $39/mo after trial.
          </p>
          <Link href="/pricing" className="btn-primary mt-5 inline-flex">
            Compare plans
          </Link>
        </div>
      </section>
    </main>
  );
}
