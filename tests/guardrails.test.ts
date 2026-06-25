import { describe, it, expect } from "vitest";
import { sanitizeText } from "@/lib/ai/guardrails";

describe("guardrails", () => {
  it("replaces guaranteed approval language", () => {
    const out = sanitizeText("You are guaranteed approval on this loan.");
    expect(out.toLowerCase()).not.toContain("guaranteed approval");
  });

  it("replaces sent-claim language", () => {
    const out = sanitizeText("I have already sent you an email.");
    expect(out.toLowerCase()).not.toContain("already sent");
  });
});
