/**
 * Grant Team plan to a user's organization (pilot / founder pricing).
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/grant-team-plan.ts you@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureOrg(userId: string, name: string, email: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  });
  if (membership?.organization) return membership.organization;

  const slugBase = email.split("@")[0].replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "org";
  let slug = slugBase;
  let n = 0;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${slugBase}-${n}`;
  }

  const org = await prisma.organization.create({
    data: {
      name: name.trim() || "My practice",
      slug,
      plan: "free",
      subscriptionStatus: "active",
    },
  });
  await prisma.organizationMember.create({
    data: { organizationId: org.id, userId, role: "admin" },
  });
  return org;
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx scripts/grant-team-plan.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found for ${email}. Sign up first at /signup, then re-run this script.`);
    process.exit(1);
  }

  const org = await ensureOrg(user.id, user.name, user.email);
  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      plan: "team",
      subscriptionStatus: "active",
      seatsIncluded: 5,
    },
  });

  console.log(`Granted Team plan to ${email} (org: ${updated.name}, slug: ${updated.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
