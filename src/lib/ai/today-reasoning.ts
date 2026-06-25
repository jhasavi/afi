import type { Contact, User } from "@prisma/client";
import type { ScoredContact } from "./scoring";
import { isOpenAIEnabled } from "./config";
import { sanitizeText } from "./guardrails";
import { buildAdvisorContext, DRAFT_ONLY_RULES } from "./context";
import { generateMessage, type MessageChannel } from "./messages";

export type TodayEnhancement = {
  reason: string;
  nextStep: string;
  message: string;
  fallbackUsed: boolean;
};

function formatScoreFactors(scored: ScoredContact): string {
  const top = [...scored.factors].sort((a, b) => b.weight - a.weight).slice(0, 3);
  if (top.length === 0) return `Priority score: ${scored.score}/100.`;
  return `Priority score: ${scored.score}/100. Key factors: ${top.map((f) => f.label).join("; ")}.`;
}

type TodayReasonJson = {
  whyReachOut: string;
  suggestedNextStep: string;
  messageBody: string;
};

/**
 * Keeps deterministic scoring; optionally polishes reason, next step, and message via OpenAI.
 */
export async function enhanceTodayRecommendation(
  scored: ScoredContact,
  user: User,
  channel: MessageChannel,
  templateMessage: string
): Promise<TodayEnhancement> {
  const factorLine = formatScoreFactors(scored);
  const templateReason = `${scored.reason} ${factorLine}`;

  if (!isOpenAIEnabled()) {
    return {
      reason: templateReason,
      nextStep: scored.suggestedNextStep,
      message: templateMessage,
      fallbackUsed: false,
    };
  }

  const prompt = `You are helping a real estate/mortgage advisor prioritize today's outreach.

${buildAdvisorContext(user, scored.contact)}

Deterministic scoring (DO NOT change the score or dispute these factors):
${factorLine}
Template reason: ${scored.reason}
Suggested next step (template): ${scored.suggestedNextStep}
Channel: ${channel}

${DRAFT_ONLY_RULES}

Write JSON:
{
  "whyReachOut": "2-3 plain-English sentences explaining why reach out TODAY. MUST acknowledge the score factors above.",
  "suggestedNextStep": "one specific, practical next action",
  "messageBody": "warm draft for ${channel} — copy/paste ready, not too long"
}

Be specific to this contact's notes, town, category, and opportunity. No pressure.`;

  const { completeJSON } = await import("./openai");
  const ai = await completeJSON<TodayReasonJson>(prompt, {
    temperature: 0.65,
    maxTokens: 700,
    context: "enhanceTodayRecommendation",
  });

  if (!ai.json?.whyReachOut) {
    return {
      reason: templateReason,
      nextStep: scored.suggestedNextStep,
      message: templateMessage,
      fallbackUsed: ai.fallbackUsed,
    };
  }

  return {
    reason: sanitizeText(`${ai.json.whyReachOut} ${factorLine}`),
    nextStep: sanitizeText(ai.json.suggestedNextStep || scored.suggestedNextStep),
    message: sanitizeText(ai.json.messageBody || templateMessage),
    fallbackUsed: ai.fallbackUsed,
  };
}

/** Build template message only (used before OpenAI enhancement). */
export async function buildTodayMessage(
  channel: MessageChannel,
  contact: Contact,
  user: User
): Promise<string> {
  const draft = await generateMessage(channel, contact, user);
  return draft.content;
}

export { formatScoreFactors };
