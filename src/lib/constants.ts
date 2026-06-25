// Centralized domain vocabulary for AdvisorFlow AI.

export const BUSINESS_TYPES = [
  "Real estate agent",
  "Broker-owner",
  "Mortgage broker",
  "Loan officer",
  "Real estate investor",
  "Insurance advisor",
  "Small business advisor",
  "Other",
] as const;

export const CONTACT_CATEGORIES = [
  "Past client",
  "Buyer lead",
  "Seller lead",
  "Investor",
  "Renter",
  "Landlord",
  "Mortgage lead",
  "Refinance lead",
  "Insurance lead",
  "Agent recruit",
  "Vendor",
  "Community contact",
  "Business owner",
  "Referral partner",
  "Other",
] as const;

export const OPPORTUNITY_TYPES = [
  "Buyer opportunity",
  "Seller opportunity",
  "Mortgage opportunity",
  "Refinance opportunity",
  "Insurance opportunity",
  "Investor opportunity",
  "Rental opportunity",
  "Referral opportunity",
  "Agent recruiting opportunity",
  "General relationship nurture",
] as const;

export const CONTACT_STATUSES = [
  "New",
  "Contact today",
  "Waiting for reply",
  "Replied",
  "Meeting scheduled",
  "Needs CMA",
  "Needs mortgage intro",
  "Needs follow-up",
  "Long-term nurture",
  "Closed",
  "Dead / inactive",
] as const;

export const PIPELINE_STAGES = [
  "Contact Today",
  "Waiting for Reply",
  "Replied",
  "Meeting Scheduled",
  "Active Opportunity",
  "Long-Term Nurture",
  "Closed",
  "Inactive",
] as const;

export const INTERACTION_TYPES = [
  "Text",
  "Email",
  "Call",
  "Voicemail",
  "Meeting",
  "Social message",
  "In-person conversation",
  "Other",
] as const;

export const RESPONSE_TYPES = [
  "No response yet",
  "Positive",
  "Neutral",
  "Not now",
  "Negative",
] as const;

export const NEXT_ACTIONS = [
  "Send text",
  "Send email",
  "Call",
  "Schedule consultation",
  "Prepare CMA",
  "Send market update",
  "Ask for mortgage documents",
  "Introduce mortgage partner",
  "Ask for referral",
  "Send buyer checklist",
  "Send seller checklist",
  "Add to nurture",
  "Follow up later",
  "Mark inactive",
] as const;

export const TONE_OPTIONS = [
  "Warm advisor",
  "Professional",
  "Friendly",
  "Concise",
  "Community-oriented",
  "More direct",
  "Very soft / non-pushy",
] as const;

export const MESSAGE_CHANNELS = [
  { id: "text", label: "Short text message" },
  { id: "email", label: "Email" },
  { id: "market-update", label: "Past-client market update" },
  { id: "call", label: "Phone call talking points" },
  { id: "voicemail", label: "Voicemail script" },
  { id: "social", label: "Social / LinkedIn DM" },
  { id: "follow-up-none", label: "Follow-up (no response)" },
  { id: "follow-up-positive", label: "Follow-up (positive response)" },
  { id: "follow-up-notnow", label: 'Follow-up ("not now")' },
] as const;

export const BRIEF_TYPES = [
  "Buyer readiness brief",
  "Seller readiness brief",
  "Mortgage readiness brief",
  "Refinance readiness brief",
  "Investor brief",
  "Landlord brief",
  "Referral partner brief",
  "Agent recruiting brief",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export type InteractionType = (typeof INTERACTION_TYPES)[number];
export type ResponseType = (typeof RESPONSE_TYPES)[number];
export type ToneOption = (typeof TONE_OPTIONS)[number];

// Map a contact status to a default pipeline stage (used during import / updates).
export function statusToStage(status: string): PipelineStage {
  switch (status) {
    case "Contact today":
      return "Contact Today";
    case "Waiting for reply":
      return "Waiting for Reply";
    case "Replied":
      return "Replied";
    case "Meeting scheduled":
      return "Meeting Scheduled";
    case "Needs CMA":
    case "Needs mortgage intro":
      return "Active Opportunity";
    case "Closed":
      return "Closed";
    case "Dead / inactive":
      return "Inactive";
    case "Long-term nurture":
    case "Needs follow-up":
    case "New":
    default:
      return "Long-Term Nurture";
  }
}

export const CONTACT_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  category: "Category",
  town: "Town / City",
  notes: "Notes",
  relationshipStrength: "Relationship strength (1-5)",
  status: "Status",
  opportunityType: "Opportunity type",
  source: "Source",
  tags: "Tags",
  lastContactedAt: "Last contacted date",
  nextFollowUpAt: "Next follow-up date",
  estimatedValue: "Estimated value",
};

// Fields that CSV columns can be mapped to.
export const IMPORTABLE_FIELDS = [
  "name",
  "email",
  "phone",
  "category",
  "town",
  "notes",
  "relationshipStrength",
  "status",
  "opportunityType",
  "source",
  "tags",
  "lastContactedAt",
] as const;
