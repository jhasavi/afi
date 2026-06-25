import { describe, it, expect } from "vitest";
import { isOpenAIEnabled } from "@/lib/ai/config";

describe("template mode", () => {
  it("disables OpenAI when key is missing", () => {
    const prev = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";
    expect(isOpenAIEnabled()).toBe(false);
    process.env.OPENAI_API_KEY = prev;
  });
});
