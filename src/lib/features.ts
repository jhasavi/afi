/** Feature flags for optional integrations (all default off). */

export type FeatureFlag = "GMAIL_SYNC" | "CRM_SYNC" | "SMS_SEND";

const FLAG_ENV: Record<FeatureFlag, string> = {
  GMAIL_SYNC: "FEATURE_GMAIL_SYNC",
  CRM_SYNC: "FEATURE_CRM_SYNC",
  SMS_SEND: "FEATURE_SMS_SEND",
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return process.env[FLAG_ENV[flag]] === "true";
}

export function getFeatureStatus(): Record<FeatureFlag, boolean> {
  return {
    GMAIL_SYNC: isFeatureEnabled("GMAIL_SYNC"),
    CRM_SYNC: isFeatureEnabled("CRM_SYNC"),
    SMS_SEND: isFeatureEnabled("SMS_SEND"),
  };
}

export const FEATURE_DESCRIPTIONS: Record<
  FeatureFlag,
  { title: string; description: string; status: "coming_soon" | "enabled" }
> = {
  GMAIL_SYNC: {
    title: "Gmail read-only sync",
    description: "Detect last contact dates from email threads. Never sends on your behalf.",
    status: "coming_soon",
  },
  CRM_SYNC: {
    title: "NB Mission Control sync",
    description:
      "One-way import from Namaste Boston CRM (~/nb). Configure NB_API_BASE_URL + NB_API_KEY.",
    status: "coming_soon",
  },
  SMS_SEND: {
    title: "SMS send (future)",
    description: "Send texts only when you explicitly click Send. Disabled by default.",
    status: "coming_soon",
  },
};
