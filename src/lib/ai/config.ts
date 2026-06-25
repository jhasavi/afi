/** Shared OpenAI config — safe to import from scripts (no API calls). */
export type AiSource = "openai" | "template";

export function isOpenAIEnabled(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key && key.length > 0);
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}
