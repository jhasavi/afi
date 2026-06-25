import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_DAILY_GENERATION_CAP: z.coerce.number().default(50),
  FEATURE_GMAIL_SYNC: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  FEATURE_CRM_SYNC: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  FEATURE_SMS_SEND: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("[AdvisorFlow] Invalid environment:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  cached = parsed.data;

  if (cached.NODE_ENV === "production") {
    if (!cached.AUTH_SECRET || cached.AUTH_SECRET.length < 32) {
      throw new Error("AUTH_SECRET must be set (min 32 chars) in production");
    }
    if (cached.AUTH_SECRET === "advisorflow-dev-secret-change-me") {
      throw new Error("AUTH_SECRET must not use the dev default in production");
    }
  }

  return cached;
}

export function getAuthSecret(): string {
  const env = getEnv();
  return env.AUTH_SECRET || "advisorflow-dev-secret-change-me";
}

export function getOpenAIDailyCap(): number {
  return getEnv().OPENAI_DAILY_GENERATION_CAP;
}
