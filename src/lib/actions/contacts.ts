"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, requireUserForAction } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { parseDateInput, stringifyTags } from "@/lib/utils";
import { statusToStage } from "@/lib/constants";

function readContactForm(formData: FormData) {
  const strength = parseInt(String(formData.get("relationshipStrength") || "3"), 10);
  const estimated = String(formData.get("estimatedValue") || "").trim();
  const tagsRaw = String(formData.get("tags") || "").trim();
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const status = String(formData.get("status") || "New");

  return {
    name: String(formData.get("name") || "").trim(),
    email: (String(formData.get("email") || "").trim() || null) as string | null,
    phone: (String(formData.get("phone") || "").trim() || null) as string | null,
    category: String(formData.get("category") || "Other"),
    town: (String(formData.get("town") || "").trim() || null) as string | null,
    notes: (String(formData.get("notes") || "").trim() || null) as string | null,
    relationshipStrength: isNaN(strength) ? 3 : Math.max(1, Math.min(5, strength)),
    lastContactedAt: parseDateInput(formData.get("lastContactedAt")),
    nextFollowUpAt: parseDateInput(formData.get("nextFollowUpAt")),
    status,
    opportunityType: String(formData.get("opportunityType") || "General relationship nurture"),
    source: (String(formData.get("source") || "").trim() || null) as string | null,
    tags: stringifyTags(tags),
    estimatedValue: estimated ? Number(estimated.replace(/[^0-9.]/g, "")) || null : null,
    pipelineStage: statusToStage(status),
  };
}

export async function createContactAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const data = readContactForm(formData);
  if (!data.name) return;
  await prisma.contact.create({ data: { ...data, userId: user.id } });
  revalidatePath("/contacts");
  revalidatePath("/pipeline");
  redirect("/contacts");
}

export async function updateContactAction(id: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const data = readContactForm(formData);
  if (!data.name) return;
  await prisma.contact.updateMany({
    where: { id, userId: user.id },
    data,
  });
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/today");
  redirect(`/contacts/${id}?saved=1`);
}

export async function deleteContactAction(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.contact.deleteMany({ where: { id, userId: user.id } });
  await logAudit("contact.deleted", { userId: user.id, entity: "contact", entityId: id });
  revalidatePath("/contacts");
  revalidatePath("/pipeline");
  redirect("/contacts");
}

export async function updatePipelineStageAction(
  id: string,
  stage: string
): Promise<{ ok: boolean } | { error: string }> {
  const auth = await requireUserForAction();
  if (!auth.ok) return { error: auth.error };
  await prisma.contact.updateMany({
    where: { id, userId: auth.user.id },
    data: { pipelineStage: stage },
  });
  revalidatePath("/pipeline");
  return { ok: true };
}
