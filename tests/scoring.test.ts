import { describe, it, expect } from "vitest";
import { scoreContact } from "@/lib/ai/scoring";
import type { Contact } from "@prisma/client";

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "c1",
    userId: "u1",
    name: "Test User",
    email: "test@example.com",
    phone: null,
    category: "Past client",
    town: "Needham",
    notes: "Interested in selling",
    relationshipStrength: 4,
    lastContactedAt: new Date(Date.now() - 200 * 86400000),
    nextFollowUpAt: new Date(Date.now() - 5 * 86400000),
    status: "Needs follow-up",
    opportunityType: "Seller opportunity",
    source: null,
    tags: null,
    pipelineStage: "Long-Term Nurture",
    estimatedValue: 10000,
    nbClientId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("scoring", () => {
  it("scores overdue follow-up contacts higher", () => {
    const now = new Date();
    const overdue = scoreContact(makeContact(), now);
    const fresh = scoreContact(
      makeContact({ nextFollowUpAt: new Date(Date.now() + 30 * 86400000) }),
      now
    );
    expect(overdue.score).toBeGreaterThan(fresh.score);
  });

  it("returns a reason string", () => {
    const scored = scoreContact(makeContact(), new Date());
    expect(scored.reason.length).toBeGreaterThan(10);
  });
});
