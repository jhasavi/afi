import type { Contact, User } from "@prisma/client";
import { isOpenAIEnabled, type AiSource } from "./config";
import { sanitizeText, defaultDisclaimer } from "./guardrails";
import { buildAdvisorContext, DRAFT_ONLY_RULES } from "./context";

export type AdvisoryBrief = {
  briefType: string;
  summary: string;
  likelyNeed: string;
  questionsToAsk: string[];
  valueToProvide: string;
  nextThreeSteps: string[];
  suggestedMessage: string;
  assumptions: string;
  source: AiSource;
  fallbackUsed: boolean;
};

export function inferBriefType(contact: Contact): string {
  switch (contact.opportunityType) {
    case "Seller opportunity":
      return "Seller readiness brief";
    case "Buyer opportunity":
      return "Buyer readiness brief";
    case "Mortgage opportunity":
      return "Mortgage readiness brief";
    case "Refinance opportunity":
      return "Refinance readiness brief";
    case "Investor opportunity":
      return "Investor brief";
    case "Rental opportunity":
      return "Landlord brief";
    case "Referral opportunity":
      return "Referral partner brief";
    case "Agent recruiting opportunity":
      return "Agent recruiting brief";
  }
  switch (contact.category) {
    case "Seller lead":
      return "Seller readiness brief";
    case "Buyer lead":
      return "Buyer readiness brief";
    case "Mortgage lead":
      return "Mortgage readiness brief";
    case "Refinance lead":
      return "Refinance readiness brief";
    case "Investor":
      return "Investor brief";
    case "Landlord":
      return "Landlord brief";
    case "Referral partner":
      return "Referral partner brief";
    case "Agent recruit":
      return "Agent recruiting brief";
    default:
      return "Buyer readiness brief";
  }
}

type BriefBlueprint = {
  likelyNeed: string;
  questions: string[];
  value: string;
  steps: string[];
};

function blueprintFor(briefType: string, contact: Contact): BriefBlueprint {
  const fn = contact.name.split(/\s+/)[0];
  const town = contact.town?.trim();
  switch (briefType) {
    case "Seller readiness brief":
      return {
        likelyNeed: "May be considering selling and wants to understand value, timing, and prep without pressure.",
        questions: [
          "What's prompting you to think about a move, and what's your ideal timeline?",
          "Have you done any updates or repairs recently?",
          "Do you still have a mortgage balance we should factor in?",
          "Where are you thinking of heading next?",
        ],
        value: `Offer to prepare a no-pressure market snapshot${town ? ` for ${town}` : ""}. A precise pricing range would require a closer review of the home.`,
        steps: [
          "Send a warm check-in offering a market snapshot",
          "If interested, schedule a 15-minute call to learn their goals",
          "Prepare a CMA / pricing range after seeing the home",
        ],
      };
    case "Buyer readiness brief":
      return {
        likelyNeed: "May be exploring a purchase and needs help understanding options, budget comfort, and next steps.",
        questions: [
          "What's drawing you to move, and what's your rough timeline?",
          "Have you spoken with a lender about a pre-approval yet?",
          "Which towns or neighborhoods are you curious about?",
          "What are your must-haves vs. nice-to-haves?",
        ],
        value: "Offer to help review options and connect them with a trusted lender for a pre-approval (a lender would confirm details).",
        steps: [
          "Send a friendly check-in offering a buying-options review",
          "Share a simple buyer checklist",
          "Schedule a buyer consultation when they're ready",
        ],
      };
    case "Mortgage readiness brief":
      return {
        likelyNeed: "May benefit from understanding what's needed to get mortgage-ready. This is not a loan approval.",
        questions: [
          "Are you thinking purchase or refinance, and on what timeline?",
          "How would you describe your credit situation right now?",
          "Do you have income documents handy (W-2 / 1099, recent paystubs)?",
          "Have you thought about down payment and reserves?",
        ],
        value: "Offer a soft readiness check and a document checklist. Based on what we know so far, a lender would need to confirm eligibility and terms.",
        steps: [
          "Send a no-pressure readiness check-in",
          "Share a document checklist (income, assets, ID)",
          "Introduce a lender / set a readiness call when they're ready",
        ],
      };
    case "Refinance readiness brief":
      return {
        likelyNeed: "It may be worth reviewing their current mortgage. This is not a loan approval or rate quote.",
        questions: [
          "Roughly when did you take out your current mortgage?",
          "What's your main goal — lower payment, cash out, or shorter term?",
          "How long do you plan to stay in the home?",
          "Any changes in income or credit since you got the loan?",
        ],
        value: "Offer a refinance review. A lender would need to confirm whether it makes sense and on what terms.",
        steps: [
          "Send a soft 'worth reviewing' check-in",
          "Gather current loan basics",
          "Loop in a lender for an actual review",
        ],
      };
    case "Investor brief":
      return {
        likelyNeed: "May be evaluating investment property opportunities and cash-flow potential.",
        questions: [
          "What does your current portfolio look like?",
          "Are you targeting cash flow, appreciation, or both?",
          "What markets are you considering?",
          "What's your financing approach for the next deal?",
        ],
        value: "Offer to share relevant opportunities and rough cash-flow framing. Numbers are estimates; a closer review is needed before any decision.",
        steps: [
          "Reconnect and ask about updated investment goals",
          "Share a relevant deal or market angle",
          "Set up a strategy call",
        ],
      };
    case "Landlord brief":
      return {
        likelyNeed: "Owns rental property and may be weighing hold vs. sell, refinance, or rent adjustments.",
        questions: [
          "How are the current rentals performing for you?",
          "Are you thinking of holding, selling, or adding to the portfolio?",
          "Any upcoming lease renewals or vacancies?",
          "Have you reviewed financing on these recently?",
        ],
        value: "Offer a simple hold-vs-sell conversation and a market view on their rentals. Estimates only — a closer review is needed.",
        steps: [
          "Check in on how the rentals are performing",
          "Offer a hold-vs-sell snapshot",
          "Schedule a portfolio review",
        ],
      };
    case "Referral partner brief":
      return {
        likelyNeed: `A referral partnership worth nurturing — ${fn} may send or receive client introductions when trust is strong.`,
        questions: [
          "How's your pipeline looking this quarter — buyers, sellers, or refinances?",
          "What does an ideal referral look like for you right now (price range, towns, timeline)?",
          "Is there anyone in your network I should know who needs steady guidance?",
          "What's the best way to stay in each other's loop — coffee, quarterly call, or quick texts?",
          "Any clients you're stuck on where a second opinion might help?",
        ],
        value: "Lead with giving — offer a specific referral, market insight, or introduction before asking. Position yourself as their go-to resource in your specialty.",
        steps: [
          "Send a warm check-in with one concrete way to help their business",
          "Share a relevant lead or market note (with permission)",
          "Schedule a quarterly referral-partner catch-up",
        ],
      };
    case "Agent recruiting brief":
      return {
        likelyNeed: "A potential agent to bring onto the team — needs a relationship, not a hard pitch.",
        questions: [
          "How's your business going this year?",
          "What's working well, and what's frustrating you?",
          "What would your ideal brokerage support look like?",
          "Open to grabbing coffee to compare notes?",
        ],
        value: "Offer genuine value and mentorship first. Keep recruiting soft and relationship-led.",
        steps: [
          "Send a soft, peer-to-peer check-in",
          "Offer something useful (tool, intro, idea)",
          "Invite a low-key coffee chat",
        ],
      };
    default:
      return {
        likelyNeed: "A relationship worth keeping warm.",
        questions: [
          "How have you been?",
          "Anything new on your end I should know about?",
          "Is there anything I can help with right now?",
        ],
        value: "Be a genuine resource with no agenda.",
        steps: ["Send a warm check-in", "Listen and note any needs", "Set a follow-up date"],
      };
  }
}

function buildTemplateBrief(briefType: string, contact: Contact, user: User): AdvisoryBrief {
  const bp = blueprintFor(briefType, contact);
  const summaryParts = [
    `${contact.name}`,
    contact.town ? `in ${contact.town}` : null,
    `— ${contact.category}`,
    `(relationship strength ${contact.relationshipStrength}/5)`,
    contact.lastContactedAt
      ? `last contacted ${contact.lastContactedAt.toDateString()}`
      : "not contacted yet",
  ].filter(Boolean);

  const summary = sanitizeText(
    `${summaryParts.join(" ")}.${contact.notes ? ` Notes: ${contact.notes}` : ""}`
  );

  const suggestedMessage = sanitizeText(
    `Hi ${contact.name.split(/\s+/)[0]}, it's ${user.name.split(/\s+/)[0]}. You were on my mind and I wanted to check in. ${bp.value} No pressure at all — just here as a resource whenever it's useful.`
  );

  return {
    briefType,
    summary,
    likelyNeed: sanitizeText(bp.likelyNeed),
    questionsToAsk: bp.questions.map(sanitizeText),
    valueToProvide: sanitizeText(bp.value),
    nextThreeSteps: bp.steps.map(sanitizeText),
    suggestedMessage,
    assumptions:
      (user.defaultDisclaimer && user.defaultDisclaimer.trim()) ||
      defaultDisclaimer(user.businessType),
    source: "template",
    fallbackUsed: false,
  };
}

export async function generateBrief(
  contact: Contact,
  user: User,
  briefTypeOverride?: string,
  opts?: { forceTemplate?: boolean }
): Promise<AdvisoryBrief> {
  const briefType = briefTypeOverride || inferBriefType(contact);
  const template = buildTemplateBrief(briefType, contact, user);

  if (opts?.forceTemplate || !isOpenAIEnabled()) {
    return template;
  }

  const { completeJSON } = await import("./openai");

  const prompt = `Produce a "${briefType}" for a real estate/mortgage professional acting as a trusted advisor.

${buildAdvisorContext(user, contact)}

${DRAFT_ONLY_RULES}

Return JSON:
{
  "summary": "2-3 sentences about this contact and relationship",
  "likelyNeed": "what they may need right now",
  "questionsToAsk": ["3-5 practical questions"],
  "valueToProvide": "specific value the advisor can offer",
  "nextThreeSteps": ["step 1", "step 2", "step 3"],
  "suggestedMessage": "warm draft outreach — not sent yet",
  "assumptions": "safe disclaimers"
}

Be specific to notes, town, category, and opportunity type.`;

  type BriefJson = {
    summary: string;
    likelyNeed: string;
    questionsToAsk: string[];
    valueToProvide: string;
    nextThreeSteps: string[];
    suggestedMessage: string;
    assumptions: string;
  };

  const ai = await completeJSON<BriefJson>(prompt, {
    temperature: 0.5,
    maxTokens: 900,
    context: `generateBrief/${briefType}`,
  });

  if (!ai.json) {
    return ai.fallbackUsed ? { ...template, fallbackUsed: true } : template;
  }

  const parsed = ai.json;
  return {
    briefType,
    summary: sanitizeText(parsed.summary ?? template.summary),
    likelyNeed: sanitizeText(parsed.likelyNeed ?? template.likelyNeed),
    questionsToAsk: Array.isArray(parsed.questionsToAsk)
      ? parsed.questionsToAsk.map((s) => sanitizeText(String(s)))
      : template.questionsToAsk,
    valueToProvide: sanitizeText(parsed.valueToProvide ?? template.valueToProvide),
    nextThreeSteps: Array.isArray(parsed.nextThreeSteps)
      ? parsed.nextThreeSteps.map((s) => sanitizeText(String(s)))
      : template.nextThreeSteps,
    suggestedMessage: sanitizeText(parsed.suggestedMessage ?? template.suggestedMessage),
    assumptions: sanitizeText(parsed.assumptions ?? template.assumptions),
    source: ai.fallbackUsed ? "template" : "openai",
    fallbackUsed: ai.fallbackUsed,
  };
}
