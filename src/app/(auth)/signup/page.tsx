import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage({
  searchParams,
}: {
  searchParams?: { plan?: string };
}) {
  const plan = searchParams?.plan ?? null;
  const planLabel =
    plan === "solo_pro" ? "Solo Pro" : plan === "team" ? "Team" : null;

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">
        Start free — get your first today&apos;s list in minutes.
      </p>
      {planLabel && (
        <p className="mt-3 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800">
          After signup you can start your {planLabel} plan from Pricing or Settings.
        </p>
      )}

      <SignupForm />

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
