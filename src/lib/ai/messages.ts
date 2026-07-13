import type { Contact, User } from "@prisma/client";
import { buildAdvisorContext, DRAFT_ONLY_RULES } from "./context";
import { isOpenAIEnabled, type AiSource } from "./config";
import { sanitizeText } from "./guardrails";
import { parseTags } from "@/lib/utils";

export type MessageChannel =
  | "text"
  | "email"
  | "market-update"
  | "call"
  | "voicemail"
  | "social"
  | "follow-up-none"
  | "follow-up-positive"
  | "follow-up-notnow";

export type MessageDraftResult = {
  /** Copy-paste ready body (email includes Subject: line at top). */
  content: string;
  subject?: string;
  suggestedNextStep?: string;
  followUpTiming?: string;
  whyThisMessage?: string;
  source: AiSource;
  fallbackUsed: boolean;
};

const CHANNEL_LABELS: Record<MessageChannel, string> = {
  text: "Short SMS text (under 320 characters, warm and specific)",
  email: "Warm professional email",
  "market-update": "Past-client market update email (no rate quotes, no appreciation promises)",
  call: "Phone call talking points as a numbered list",
  voicemail: "Brief natural voicemail script",
  social: "Casual LinkedIn/Facebook DM",
  "follow-up-none": "Gentle follow-up after no response",
  "follow-up-positive": "Follow-up after a positive reply",
  "follow-up-notnow": "Graceful follow-up after a 'not now' reply",
};

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function toneOpener(tone: string, name: string): string {
  switch (tone) {
    case "Professional":
      return `Hi ${name},`;
    case "Concise":
      return `Hi ${name} —`;
    case "Community-oriented":
      return `Hey ${name}!`;
    case "More direct":
      return `Hi ${name},`;
    case "Very soft / non-pushy":
      return `Hi ${name}, hope you're doing well.`;
    case "Friendly":
      return `Hey ${name}!`;
    default:
      return `Hi ${name}, hope you and the family are doing well.`;
  }
}

function categoryLine(contact: Contact): string {
  switch (contact.category) {
    case "Past client":
      return "It's been a while since we worked together, and I wanted to check in.";
    case "Buyer lead":
      return "I know you've been exploring buying options";
    case "Seller lead":
      return "I wanted to touch base on your home plans";
    case "Refinance lead":
    case "Mortgage lead":
      return "I wanted to follow up on your financing questions";
    case "Investor":
      return "I was thinking about your investment goals";
    case "Landlord":
      return "I wanted to see how things are going with your rental property";
    case "Referral partner":
      return "I value our partnership and wanted to reconnect";
    default:
      return "You came to mind today";
  }
}

function notesSnippet(contact: Contact): string {
  const notes = contact.notes?.trim();
  if (!notes) return "";
  if (notes.length > 80) {
    return " Based on what we talked about last time, I thought a quick check-in might be helpful.";
  }
  return ` I remember you mentioned ${notes.charAt(0).toLowerCase()}${notes.slice(1).replace(/\.$/, "")}.`;
}

function lastContactLine(contact: Contact): string {
  if (!contact.lastContactedAt) {
    return " We haven't caught up in a bit, and I'd love to hear how you're doing.";
  }
  const days = Math.floor(
    (Date.now() - contact.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days >= 120) return ` It's been a few months since we last connected — I'd love to hear what's new.`;
  if (days >= 45) return ` It's been a little while since we last talked — hope all is well.`;
  return "";
}

function localTouch(contact: Contact, user: User): string {
  const town = contact.town?.trim();
  if (town) {
    return ` Things have been active around ${town} lately — happy to share a quick local snapshot if useful.`;
  }
  const areas = user.serviceAreas?.trim();
  if (areas) {
    return ` With everything shifting in ${areas.split(",")[0]?.trim() || "the area"}, I thought a quick hello might be helpful.`;
  }
  return "";
}

function valueOffer(contact: Contact, user: User): string {
  const bt = (user.businessType || "").toLowerCase();
  const mortgageCtx = bt.includes("mortgage") || bt.includes("loan");
  switch (contact.opportunityType) {
    case "Seller opportunity":
      return "If you're curious what's happening with values nearby, I can put together a no-pressure market snapshot — a precise range would need a closer look at your home.";
    case "Buyer opportunity":
      return "If buying is still on your radar, I'd be glad to help you review towns and next steps whenever timing feels right — a lender would confirm pre-approval details.";
    case "Mortgage opportunity":
      return mortgageCtx
        ? "If helpful, we can do a soft readiness review together — a lender would need to confirm eligibility and terms."
        : "If it's useful, I can connect you with a trusted lender for a no-pressure readiness check — this is not a loan approval.";
    case "Refinance opportunity":
      return "It may be worth reviewing your current mortgage when you have time — a lender would confirm whether it makes sense.";
    case "Investor opportunity":
      return "If you're still weighing investment property, I'd enjoy hearing how your goals have shifted.";
    case "Referral opportunity":
      return "As always, I'm here if you or anyone in your network needs a steady hand.";
    default:
      return "No agenda — just wanted to be a resource if anything comes up.";
  }
}

function signoff(user: User): string {
  const name = firstName(user.name);
  const company = user.companyName ? `\n${user.companyName}` : "";
  return `Talk soon,\n${name}${company}`;
}

function defaultNextStep(contact: Contact): string {
  switch (contact.opportunityType) {
    case "Seller opportunity":
      return "Offer a no-pressure market snapshot";
    case "Buyer opportunity":
      return "Offer a brief buying-options review";
    case "Mortgage opportunity":
    case "Refinance opportunity":
      return "Offer a soft financing readiness check";
    default:
      return "Warm check-in with no ask";
  }
}

function buildTemplate(
  channel: MessageChannel,
  contact: Contact,
  user: User
): MessageDraftResult {
  const fn = firstName(contact.name);
  const opener = toneOpener(user.communicationStyle || "Warm advisor", fn);
  const cat = categoryLine(contact);
  const notes = notesSnippet(contact);
  const stale = lastContactLine(contact);
  const local = localTouch(contact, user);
  const offer = valueOffer(contact, user);
  const sender = firstName(user.name);
  const nextStep = defaultNextStep(contact);
  const followUp = contact.nextFollowUpAt
    ? `Follow up around ${contact.nextFollowUpAt.toLocaleDateString()}`
    : `Follow up in ${user.defaultFollowUpDays || 14} days if no reply`;

  let content: string;
  let subject: string | undefined;

  switch (channel) {
    case "text":
      content = sanitizeText(
        `${opener} It's ${sender}. ${cat}${stale}${notes}${local} ${offer} No rush — reply whenever works.`
      );
      break;
    case "email":
      subject = `Quick check-in — ${fn}${contact.town ? ` (${contact.town})` : ""}`;
      content = sanitizeText(
        `Subject: ${subject}\n\n${opener}\n\n${cat}.${stale}${notes}${local}\n\n${offer}\n\nNo pressure on timing — if anything would help, just let me know.\n\n${signoff(user)}`
      );
      break;
    case "market-update":
      subject = `Market snapshot — ${contact.town || user.serviceAreas?.split(",")[0]?.trim() || "your area"}`;
      content = sanitizeText(
        `Subject: ${subject}\n\n${opener}\n\nI put together a quick local market snapshot${contact.town ? ` for ${contact.town}` : ""} — no agenda, just thought it might be useful.\n\n• Activity has been steady in the area; specific values depend on home, condition, and timing.\n• A precise pricing range would require a closer review of your property.\n• Market conditions vary by neighborhood — happy to walk through what we're seeing.\n\n${offer}\n\nNo pressure — only if useful. Reply anytime or ignore if timing isn't right.\n\n${signoff(user)}`
      );
      break;
    case "call":
      content = sanitizeText(
        `Phone call talking points — ${contact.name}\n\n1. Open warmly as ${sender}\n2. ${cat}\n3. Listen — ${contact.notes ? contact.notes.slice(0, 100) : "ask what's new"}\n4. ${offer}\n5. Close with no pressure`
      );
      break;
    case "voicemail":
      content = sanitizeText(
        `"Hi ${fn}, it's ${sender}. ${cat.toLowerCase()} ${offer} No need to call back unless you want to — just saying hello!"`
      );
      break;
    case "social":
      content = sanitizeText(`${opener} ${cat}${stale} ${offer} — ${sender}`);
      break;
    case "follow-up-none":
      content = sanitizeText(
        `${opener} Circling back gently in case my last note got buried.${local} ${offer} Whenever you're ready, I'm here.`
      );
      break;
    case "follow-up-positive":
      content = sanitizeText(
        `${opener} Really glad to hear from you! ${offer} Let's find 15 minutes that work for you.`
      );
      break;
    case "follow-up-notnow":
      content = sanitizeText(
        `${opener} Completely understand now isn't the right time. I'll stay in touch lightly — no pressure.${local}`
      );
      break;
    default:
      content = sanitizeText(`${opener} ${cat} ${offer}`);
  }

  const tags = parseTags(contact.tags);
  const why = sanitizeText(
    `Warm ${contact.category.toLowerCase()} outreach for ${contact.opportunityType.toLowerCase()}${contact.town ? ` in ${contact.town}` : ""}${tags.length ? ` (${tags.slice(0, 2).join(", ")})` : ""}.`
  );

  return {
    content,
    subject,
    suggestedNextStep: nextStep,
    followUpTiming: followUp,
    whyThisMessage: why,
    source: "template",
    fallbackUsed: false,
  };
}

type OpenAIMessageJson = {
  subject?: string;
  body: string;
  suggestedNextStep: string;
  followUpTiming: string;
  whyThisMessage: string;
};

export async function generateMessage(
  channel: MessageChannel,
  contact: Contact,
  user: User,
  opts?: { forceTemplate?: boolean }
): Promise<MessageDraftResult> {
  const template = buildTemplate(channel, contact, user);

  if (opts?.forceTemplate || !isOpenAIEnabled()) {
    return template;
  }

  const { completeJSON } = await import("./openai");

  const prompt = `Write a ${CHANNEL_LABELS[channel]} for a real estate/mortgage advisor to copy and send manually.

${buildAdvisorContext(user, contact)}

${DRAFT_ONLY_RULES}

Return JSON:
{
  "subject": "only for email, else omit",
  "body": "the draft text to copy",
  "suggestedNextStep": "one practical next step for the advisor",
  "followUpTiming": "e.g. follow up in 7 days if no reply",
  "whyThisMessage": "1-2 sentences explaining why this approach fits this contact"
}

Keep the body warm, specific, locally aware, and appropriately short. Reference notes only when provided.`;

  const ai = await completeJSON<OpenAIMessageJson>(prompt, {
    temperature: 0.7,
    maxTokens: 850,
    context: `generateMessage/${channel}`,
  });

  if (!ai.json?.body) {
    return ai.fallbackUsed
      ? { ...template, fallbackUsed: true }
      : template;
  }

  const body = sanitizeText(ai.json.body);
  let content = body;
  if (channel === "email" || channel === "market-update") {
    const subject =
      ai.json.subject?.trim() ||
      template.subject ||
      `Quick check-in — ${firstName(contact.name)}`;
    content = sanitizeText(`Subject: ${subject}\n\n${body}`);
  }

  return {
    content,
    subject: ai.json.subject || template.subject,
    suggestedNextStep: sanitizeText(ai.json.suggestedNextStep || template.suggestedNextStep || ""),
    followUpTiming: sanitizeText(ai.json.followUpTiming || template.followUpTiming || ""),
    whyThisMessage: sanitizeText(ai.json.whyThisMessage || template.whyThisMessage || ""),
    source: ai.fallbackUsed ? "template" : "openai",
    fallbackUsed: ai.fallbackUsed,
  };
}
