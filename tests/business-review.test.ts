import { describe, expect, it } from "vitest";
import { buildBusinessReview, type BusinessReviewContact } from "@/lib/business-review";

function contact(overrides: Partial<BusinessReviewContact>): BusinessReviewContact {
  return {
    id: "c1",
    name: "Test Contact",
    email: "test@example.com",
    phone: "555-0100",
    category: "Past client",
    status: "Needs follow-up",
    opportunityType: "Seller opportunity",
    pipelineStage: "Active Opportunity",
    relationshipStrength: 4,
    lastContactedAt: new Date("2026-06-20T12:00:00Z"),
    nextFollowUpAt: new Date("2026-07-10T12:00:00Z"),
    estimatedValue: 15000,
    nbClientId: "nb-1",
    ...overrides,
  };
}

describe("business review", () => {
  const now = new Date("2026-07-14T12:00:00Z");

  it("summarizes brokerage health from contact data", () => {
    const review = buildBusinessReview(
      [
        contact({ id: "c1" }),
        contact({
          id: "c2",
          category: "Referral partner",
          opportunityType: "Referral opportunity",
          pipelineStage: "Long-Term Nurture",
          status: "Long-term nurture",
          estimatedValue: null,
          nbClientId: null,
          nextFollowUpAt: null,
        }),
        contact({
          id: "c3",
          email: null,
          phone: null,
          relationshipStrength: 5,
          lastContactedAt: new Date("2026-01-01T12:00:00Z"),
          nextFollowUpAt: null,
          pipelineStage: "Long-Term Nurture",
          status: "Long-term nurture",
          estimatedValue: null,
        }),
      ],
      now
    );

    expect(review.totalContacts).toBe(3);
    expect(review.overdueCount).toBe(1);
    expect(review.staleWarmCount).toBe(1);
    expect(review.activeOpportunityCount).toBe(1);
    expect(review.activePipelineValue).toBe(15000);
    expect(review.referralPartnerCount).toBe(1);
    expect(review.missingContactInfoCount).toBe(1);
    expect(review.nbLinkedCount).toBe(2);
    expect(review.weeklyActions.length).toBeGreaterThan(0);
  });

  it("handles an empty contact book with a clear next action", () => {
    const review = buildBusinessReview([], now);

    expect(review.healthScore).toBe(20);
    expect(review.grade).toBe("Needs focus");
    expect(review.weeklyActions[0]).toContain("Import more contacts");
  });
});
