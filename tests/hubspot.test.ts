import { describe, expect, it } from "vitest";
import { splitName, toHubSpotRow, hubSpotCsv } from "@/lib/integrations/hubspot";

describe("hubspot export", () => {
  it("splits names for HubSpot", () => {
    expect(splitName("Jane Doe")).toEqual({ firstname: "Jane", lastname: "Doe" });
    expect(splitName("Madonna")).toEqual({ firstname: "Madonna", lastname: "" });
  });

  it("skips contacts without email", () => {
    expect(toHubSpotRow({ name: "X", email: null, phone: null, town: null, status: "New", category: "Other" })).toBeNull();
  });

  it("builds CSV header row", () => {
    const csv = hubSpotCsv([
      { email: "a@b.com", firstname: "A", lastname: "B" },
    ]);
    expect(csv).toContain("Email,First Name");
    expect(csv).toContain("a@b.com");
  });
});
