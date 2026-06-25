import Link from "next/link";
import { resetPasswordAction } from "@/lib/actions/auth";
import { AuthForm } from "@/components/AuthForm";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token || "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-xl font-semibold text-slate-900">Choose a new password</h1>
          <p className="mt-2 text-sm text-slate-600">At least 8 characters with a letter and a number.</p>
          {!token ? (
            <p className="mt-4 text-sm text-red-600">Invalid reset link. Request a new one.</p>
          ) : (
            <AuthForm action={resetPasswordAction} submitLabel="Update password">
              <input type="hidden" name="token" value={token} />
              <div>
                <label className="label" htmlFor="password">New password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="input"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </AuthForm>
          )}
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
