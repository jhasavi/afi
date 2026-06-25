import { PrismaClient } from "@prisma/client";
import { stringifyTags } from "../src/lib/utils";
import { statusToStage } from "../src/lib/constants";

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: "demo@advisorflow.ai" } });
  if (!user) throw new Error("Run npm run db:seed first");

  const before = await prisma.contact.count({ where: { userId: user!.id } });

  // Simulate import rows: one duplicate (Raj), one new
  const rows = [
    {
      name: "Raj Patel",
      email: "raj.patel@example.com",
      phone: "617-555-0142",
      category: "Past client",
      town: "Needham",
    },
    {
      name: "QA Import Test",
      email: "qa.import.test@example.com",
      phone: "617-555-9999",
      category: "Buyer lead",
      town: "Newton",
      notes: "Created by QA import script",
      tags: "qa-test",
    },
  ];

  const existing = await prisma.contact.findMany({
    where: { userId: user!.id },
    select: { email: true, phone: true, name: true },
  });
  const existingEmails = new Set(
    existing.map((c) => c.email?.toLowerCase()).filter(Boolean) as string[]
  );

  let imported = 0;
  let skipped = 0;
  for (const row of rows) {
    const email = row.email?.toLowerCase();
    if (email && existingEmails.has(email)) {
      skipped++;
      continue;
    }
    await prisma.contact.create({
      data: {
        userId: user!.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        category: row.category,
        town: row.town,
        notes: row.notes || null,
        tags: row.tags ? stringifyTags(row.tags.split(",")) : null,
        source: "CSV import",
        status: "New",
        pipelineStage: statusToStage("New"),
      },
    });
    imported++;
  }

  const after = await prisma.contact.count({ where: { userId: user!.id } });
  const qaContact = await prisma.contact.findFirst({
    where: { userId: user!.id, email: "qa.import.test@example.com" },
  });

  console.log(JSON.stringify({ before, after, imported, skipped, qaContactFound: !!qaContact }, null, 2));
  await prisma.$disconnect();
}

main();
