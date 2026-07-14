import { describe, expect, it } from "vitest";
import { isNbEmailSendAvailable, resolveOutboundSender } from "@/lib/integrations/nb-send-email";
import { PLANS } from "@/lib/billing/plans";

describe("nb email send", () => {
  it("requires Team plan and NB config", () => {
    const teamEnt = { ...PLANS.team, plan: "team" as const, subscriptionStatus: "active", trialEndsAt: null, isActive: true };
    const soloEnt = { ...PLANS.solo_pro, plan: "solo_pro" as const, subscriptionStatus: "active", trialEndsAt: null, isActive: true };

    const prevBase = process.env.NB_API_BASE_URL;
    const prevKey = process.env.NB_API_KEY;
    process.env.NB_API_BASE_URL = "https://example.com";
    process.env.NB_API_KEY = "test-key";

    expect(isNbEmailSendAvailable(teamEnt)).toBe(true);
    expect(isNbEmailSendAvailable(soloEnt)).toBe(false);

    process.env.NB_API_BASE_URL = prevBase;
    process.env.NB_API_KEY = prevKey;
  });

  it("resolves per-user sender with defaults", () => {
    expect(
      resolveOutboundSender({
        name: "Alex Advisor",
        email: "alex@broker.com",
      })
    ).toEqual({
      fromName: "Alex Advisor",
      replyTo: "alex@broker.com",
      replyToName: "Alex Advisor",
    });
  });

  it("uses outbound overrides when set", () => {
    expect(
      resolveOutboundSender({
        name: "Alex Advisor",
        email: "alex@broker.com",
        outboundSenderName: "Alex A., Realtor",
        outboundReplyTo: "alex.work@broker.com",
      })
    ).toEqual({
      fromName: "Alex A., Realtor",
      replyTo: "alex.work@broker.com",
      replyToName: "Alex A., Realtor",
    });
  });
});
