/**
 * Developer checks for AdvisorFlow AI generation (template + OpenAI safety).
 * Run: npx tsx scripts/test-ai.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { isOpenAIEnabled } from "../src/lib/ai/config";

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function ok(label: string) {
  passed++;
  console.log(`  ✅ ${label}`);
}

function fail(label: string, detail?: string) {
  failed++;
  console.log(`  ❌ ${label}${detail ? `: ${detail}` : ""}`);
}

async function main() {
  console.log("AdvisorFlow AI — generation tests\n");

  const prevKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "";
  if (!isOpenAIEnabled()) ok("Template mode: OpenAI disabled when key missing");
  else fail("Template mode: key should be disabled");

  const user = await prisma.user.findUnique({ where: { email: "demo@advisorflow.ai" } });
  const contact = user
    ? await prisma.contact.findFirst({ where: { userId: user.id, name: "Raj Patel" } })
    : null;

  if (user && contact) {
    const { generateMessage } = await import("../src/lib/ai/messages");
    const draft = await generateMessage("text", contact, user);
    if (draft.content && draft.source === "template") ok("Template mode: generateMessage works");
    else fail("Template mode: generateMessage", JSON.stringify(draft));

    if (!/has been sent|your email was sent/i.test(draft.content))
      ok("Draft wording: no sent/delivered claim");
    else fail("Draft wording: contains sent claim");

    const { generateBrief } = await import("../src/lib/ai/briefs");
    const brief = await generateBrief(contact, user);
    if (brief.summary && brief.source === "template") ok("Template mode: generateBrief works");
    else fail("Template mode: generateBrief");
  } else {
    fail("Seed data missing — run npm run db:seed");
  }

  const clientFiles = [
    "src/components/MessageGenerator.tsx",
    "src/components/BriefGenerator.tsx",
  ];
  let keyInClient = false;
  for (const f of clientFiles) {
    const content = fs.readFileSync(path.join(process.cwd(), f), "utf8");
    if (content.includes("OPENAI_API_KEY") || content.includes("process.env.OPENAI")) {
      keyInClient = true;
      fail(`API key not in client file: ${f}`);
    }
  }
  if (!keyInClient) ok("OpenAI key not referenced in client components");

  const pkg = fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8");
  const forbidden = ["nodemailer", "sendgrid", "@sendgrid", "twilio", "resend"];
  const foundForbidden = forbidden.filter((p) => pkg.includes(p));
  if (foundForbidden.length === 0) ok("No email/SMS packages in package.json");
  else fail("Email packages found", foundForbidden.join(", "));

  process.env.OPENAI_API_KEY = "sk-invalid-test-key-for-fallback";
  if (isOpenAIEnabled()) ok("OpenAI enabled with test key (fallback tested at runtime in app)");
  else fail("OpenAI should detect test key");

  process.env.OPENAI_API_KEY = prevKey ?? "";

  console.log(`\n${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
