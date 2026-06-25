import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { AuthForm } from "@/components/AuthForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-xl font-semibold text-slate-900">Reset password</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email. In development, the reset link is printed to the server console.
          </p>
          <AuthForm action={requestPasswordResetAction} submitLabel="Send reset link">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" required autoComplete="email" />
            </div>
          </AuthForm>
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link href="/login" className="text-brand-600 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
