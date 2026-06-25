"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  requireUser,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export type AuthState = { error?: string; message?: string } | undefined;

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must include at least one letter")
  .regex(/[0-9]/, "Password must include at least one number");

const signupSchema = z.object({
  name: z.string().min(1, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  password: passwordSchema,
  companyName: z.string().optional(),
  businessType: z.string().optional(),
});

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName") || undefined,
    businessType: formData.get("businessType") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, companyName, businessType } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      name,
      companyName: companyName || null,
      businessType: businessType || "Real estate agent",
    },
  });

  await logAudit("user.signup", { userId: user.id });
  await createSession(user.id);
  redirect("/today");
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  await logAudit("user.login", { userId: user.id });
  await createSession(user.id);
  redirect("/today");
}

export async function logoutAction(): Promise<void> {
  const { getCurrentUser } = await import("@/lib/auth");
  const user = await getCurrentUser();
  if (user) await logAudit("user.logout", { userId: user.id });
  destroySession();
  redirect("/login");
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const dailyGoal = parseInt(String(formData.get("dailyContactGoal") || "5"), 10);
  const followUpDays = parseInt(String(formData.get("defaultFollowUpDays") || "14"), 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: String(formData.get("name") || user.name),
      companyName: (formData.get("companyName") as string) || null,
      role: (formData.get("role") as string) || null,
      businessType: String(formData.get("businessType") || user.businessType),
      serviceAreas: (formData.get("serviceAreas") as string) || null,
      primaryBusinessFocus: (formData.get("primaryBusinessFocus") as string) || null,
      communicationStyle: String(formData.get("communicationStyle") || user.communicationStyle),
      aiStylePreference: String(formData.get("aiStylePreference") || user.aiStylePreference),
      dailyContactGoal: isNaN(dailyGoal) ? 5 : Math.max(1, Math.min(20, dailyGoal)),
      defaultFollowUpDays: isNaN(followUpDays) ? 14 : Math.max(1, Math.min(365, followUpDays)),
      defaultDisclaimer: (formData.get("defaultDisclaimer") as string) || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/today");
}

export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  if (!email || !z.string().email().safeParse(email).success) {
    return { error: "Enter a valid email address." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = `${base}/reset-password?token=${token}`;
    console.log(`[AdvisorFlow Dev] Password reset link for ${email}: ${link}`);
    await logAudit("user.password_reset_requested", { userId: user.id });
  }

  return {
    message:
      "If an account exists for that email, a reset link has been generated. In development, check the server console for the link.",
  };
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }
  if (!token) return { error: "Invalid or expired reset link." };

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "Invalid or expired reset link." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(parsed.data) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await logAudit("user.password_reset_completed", { userId: record.userId });
  return { message: "Password updated. You can log in now." };
}
