// AI guardrails: keep generated content safe, compliant, and non-pushy.
// Applied to BOTH the OpenAI path (as system instructions) and the
// built-in template path (as a final sanitizing pass).

export const GUARDRAIL_SYSTEM_PROMPT = `You are AdvisorFlow AI, a calm, helpful, advisor-like copilot for real estate and mortgage professionals.

Tone rules:
- Calm, helpful, human, advisor-like, and local.
- Never pushy, hype-driven, or fake-urgent. No aggressive pressure language.
- Sound like a trusted neighbor, not a salesperson.

Hard compliance rules — you MUST NOT:
- Guarantee mortgage approval or promise loan terms.
- Quote mortgage rates unless a specific rate is explicitly provided by the user.
- Give legal advice or tax advice.
- Promise property appreciation or specific future home values.
- Make discriminatory or fair-housing-sensitive statements, or rate schools/neighborhoods/protected classes.
- Invent reviews, testimonials, or claim the user already spoke to someone when they have not.
- Claim an email, text, or call was already sent or delivered — all output is a draft only.
- Reference conversation details, promises, or facts not included in the contact notes provided.

Safe language to prefer:
- Mortgage: "it may be worth reviewing", "a lender would need to confirm", "based on what we know so far", "this is not a loan approval", "you may want to prepare these documents".
- Real estate: "I can prepare a market snapshot", "I can help you review options", "a pricing range would require a closer review", "market conditions vary by home and location".

Always include reasonable assumptions and gentle disclaimers where relevant. Keep messages concise and easy to copy/paste.`;

// Phrases that should never appear verbatim — replaced with safer wording.
const RISKY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/guaranteed?\s+approval/gi, "a lender would need to confirm eligibility"],
  [/you('| a)?re\s+(definitely\s+)?approved/gi, "this is not a loan approval"],
  [/guarantee(d|s)?\b/gi, "aim to"],
  [/lowest\s+rate(s)?\s+(in|on)\s+the\s+market/gi, "competitive options"],
  [/your\s+home\s+will\s+(definitely\s+)?appreciate/gi, "home values can change over time"],
  [/prices?\s+will\s+(go\s+up|rise|increase)/gi, "market conditions vary"],
  [/act\s+now\s+or\s+(you('| wi)?ll\s+)?(miss|lose)/gi, "when the timing feels right for you"],
  [/limited\s+time\s+offer/gi, "an option worth considering"],
  [/best\s+schools?\b/gi, "schools in the area (details available on request)"],
  [/I('ve| have) (already )?sent (you )?(an )?(email|text|message)/gi, "I'd like to share a draft"],
  [/your (email|message) (has|was) been sent/gi, "when you're ready to send this draft"],
];

export function sanitizeText(text: string): string {
  let out = text;
  for (const [pattern, replacement] of RISKY_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out.trim();
}

export function defaultDisclaimer(businessType?: string | null): string {
  const bt = (businessType || "").toLowerCase();
  if (bt.includes("mortgage") || bt.includes("loan")) {
    return "This is general information, not a loan approval or commitment. A lender would need to confirm eligibility and terms.";
  }
  if (bt.includes("insurance")) {
    return "This is general information only and not a quote or binding of coverage.";
  }
  return "This is general information and not legal, tax, or financial advice. Market conditions vary by home and location.";
}
