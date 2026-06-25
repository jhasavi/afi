"use client";

import { useFormState } from "react-dom";
import type { AuthState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

export function AuthForm({
  action,
  submitLabel,
  children,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {children}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.message && <p className="text-sm text-emerald-700">{state.message}</p>}
      <SubmitButton className="btn-primary w-full">{submitLabel}</SubmitButton>
    </form>
  );
}
