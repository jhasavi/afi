import "server-only";
import OpenAI from "openai";
import { GUARDRAIL_SYSTEM_PROMPT, sanitizeText } from "./guardrails";
import { isOpenAIEnabled, getOpenAIModel, type AiSource } from "./config";

export type { AiSource };
export { isOpenAIEnabled, getOpenAIModel };

export type AiCompletionResult = {
  text: string | null;
  source: AiSource;
  /** True when OpenAI was configured but the call failed or returned empty. */
  fallbackUsed: boolean;
  /** Developer-facing error (logged server-side; safe to show generic fallback to users). */
  error?: string;
};

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

function logOpenAIError(context: string, err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[AdvisorFlow OpenAI] ${context}:`, message);
  return message;
}

/**
 * Call OpenAI chat completions. Returns null text with fallbackUsed=true when OpenAI
 * is configured but fails. Returns source=template when key is missing.
 */
export async function completeText(
  userPrompt: string,
  opts: { temperature?: number; maxTokens?: number; context?: string } = {}
): Promise<AiCompletionResult> {
  if (!isOpenAIEnabled()) {
    return { text: null, source: "template", fallbackUsed: false };
  }

  try {
    const res = await getClient().chat.completions.create({
      model: getOpenAIModel(),
      temperature: opts.temperature ?? 0.65,
      max_tokens: opts.maxTokens ?? 900,
      messages: [
        { role: "system", content: GUARDRAIL_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim() || null;
    if (!text) {
      const err = "OpenAI returned an empty response";
      console.error(`[AdvisorFlow OpenAI] ${opts.context || "completeText"}: ${err}`);
      return { text: null, source: "template", fallbackUsed: true, error: err };
    }
    return { text: sanitizeText(text), source: "openai", fallbackUsed: false };
  } catch (err) {
    const error = logOpenAIError(opts.context || "completeText", err);
    return { text: null, source: "template", fallbackUsed: true, error };
  }
}

/**
 * Request JSON from OpenAI. Parses first {...} block. Falls back on failure.
 */
export async function completeJSON<T extends Record<string, unknown>>(
  userPrompt: string,
  opts: { temperature?: number; maxTokens?: number; context?: string } = {}
): Promise<AiCompletionResult & { json: T | null }> {
  const result = await completeText(
    `${userPrompt}\n\nRespond ONLY with valid JSON. No markdown fences.`,
    { ...opts, temperature: opts.temperature ?? 0.5 }
  );

  if (!result.text) {
    return { ...result, json: null };
  }

  try {
    const match = result.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object in response");
    const json = JSON.parse(match[0]) as T;
    return { ...result, json };
  } catch (err) {
    const error = logOpenAIError(opts.context || "completeJSON parse", err);
    return {
      text: result.text,
      source: "template",
      fallbackUsed: true,
      error: error,
      json: null,
    };
  }
}

/** User-visible notice when OpenAI fallback was used. */
export const OPENAI_FALLBACK_NOTICE =
  "OpenAI was unavailable, so AdvisorFlow used safe built-in templates for this draft.";
