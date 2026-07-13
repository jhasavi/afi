"use client";

import { useFormState } from "react-dom";
import { signupAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { BUSINESS_TYPES } from "@/lib/constants";

export function SignupForm() {
  const [state, formAction] = useFormState(signupAction, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      <div>
        <label className="label" htmlFor="name">
          Your name
        </label>
        <input id="name" name="name" required className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="companyName">
          Company name <span className="text-slate-400">(optional)</span>
        </label>
        <input id="companyName" name="companyName" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="businessType">
          Business type
        </label>
        <select id="businessType" name="businessType" className="input" defaultValue="Real estate agent">
          {BUSINESS_TYPES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
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
          minLength={8}
          className="input"
          autoComplete="new-password"
        />
        <p className="mt-1 text-xs text-slate-400">At least 8 characters with a letter and a number.</p>
      </div>
      <SubmitButton className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
