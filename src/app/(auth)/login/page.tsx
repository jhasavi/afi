"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { loginAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, undefined);

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Log in to see today&apos;s 5.</p>

      <form action={formAction} className="mt-6 space-y-4">
        {state?.error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
        )}
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="input"
            autoComplete="current-password"
          />
        </div>
        <SubmitButton className="w-full" pendingText="Logging in…">
          Log in
        </SubmitButton>
      </form>

      <p className="mt-3 text-center text-sm">
        <Link href="/forgot-password" className="text-brand-600 hover:underline">
          Forgot password?
        </Link>
      </p>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to AdvisorFlow?{" "}
        <Link href="/signup" className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
