import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function main() {
  const email = "demo@advisorflow.ai";
  const passwordHash = await bcrypt.hash("demo1234", 10);

  // Reset demo user for a clean seed.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const memberships = await prisma.organizationMember.findMany({ where: { userId: existing.id } });
    for (const m of memberships) {
      await prisma.organization.delete({ where: { id: m.organizationId } }).catch(() => {});
    }
    await prisma.user.delete({ where: { email } });
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Jordan Avery",
      companyName: "Avery Group Realty",
      role: "Realtor",
      businessType: "Real estate agent",
      serviceAreas: "Needham, Newton, Wellesley",
      primaryBusinessFocus: "Listings and past-client repeat business",
      communicationStyle: "Warm advisor",
      aiStylePreference: "Warm advisor",
      dailyContactGoal: 5,
      defaultFollowUpDays: 14,
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: "Avery Group Realty",
      slug: "avery-group",
      plan: "team",
      subscriptionStatus: "active",
      seatsIncluded: 5,
    },
  });
  await prisma.organizationMember.create({
    data: { organizationId: org.id, userId: user.id, role: "admin" },
  });

  const contacts = [
    {
      name: "Raj Patel",
      email: "raj.patel@example.com",
      phone: "617-555-0142",
      category: "Past client",
      town: "Needham",
      notes: "Closed on a Needham colonial in Sept 2019 ($875K). Two kids (8 and 11). Wife Priya mentioned wanting more yard space and a stronger school district. May be 12–18 months from listing.",
      relationshipStrength: 4,
      lastContactedAt: daysAgo(210),
      nextFollowUpAt: daysAgo(5),
      status: "Needs follow-up",
      opportunityType: "Seller opportunity",
      source: "Past client",
      tags: ["school-parent", "upgrade"],
      estimatedValue: 18000,
    },
    {
      name: "Maria Gonzalez",
      email: "maria.g@example.com",
      phone: "617-555-0188",
      category: "Buyer lead",
      town: "Newton",
      notes: "Met at Newton open house (Mar 2025). First-time buyer, pre-approved up to $650K with local credit union but hasn't finalized. Interested in Newtonville and Auburndale. Timeline: 3–6 months.",
      relationshipStrength: 3,
      lastContactedAt: daysAgo(40),
      nextFollowUpAt: daysAgo(1),
      status: "Waiting for reply",
      opportunityType: "Buyer opportunity",
      source: "Open house",
      tags: ["first-time"],
      estimatedValue: 14000,
    },
    {
      name: "Tom Bradley",
      email: "tom.bradley@example.com",
      phone: "781-555-0110",
      category: "Refinance lead",
      town: "Wellesley",
      notes: "Referred by Linda Chen. Purchased Wellesley home in 2023 at ~6.5% rate. W-2 income stable. Asked whether a refinance review makes sense — wants lower payment, not cash-out.",
      relationshipStrength: 3,
      lastContactedAt: daysAgo(95),
      nextFollowUpAt: daysAgo(2),
      status: "Needs mortgage intro",
      opportunityType: "Refinance opportunity",
      source: "Referral",
      tags: ["refi"],
      estimatedValue: 6000,
    },
    {
      name: "Linda Chen",
      email: "linda.chen@example.com",
      phone: "617-555-0173",
      category: "Referral partner",
      town: "Newton",
      notes: "Local CPA. Great source of investor and small-business referrals. Always reciprocates.",
      relationshipStrength: 5,
      lastContactedAt: daysAgo(70),
      nextFollowUpAt: daysFromNow(0),
      status: "Long-term nurture",
      opportunityType: "Referral opportunity",
      source: "Networking",
      tags: ["CPA", "VIP"],
    },
    {
      name: "Derek Olsen",
      email: "derek.olsen@example.com",
      phone: "508-555-0199",
      category: "Investor",
      town: "Needham",
      notes: "Owns two duplexes. Looking for the next cash-flowing property. Open to off-market.",
      relationshipStrength: 4,
      lastContactedAt: daysAgo(120),
      nextFollowUpAt: daysAgo(10),
      status: "Contact today",
      opportunityType: "Investor opportunity",
      source: "Past client",
      tags: ["investor"],
      estimatedValue: 22000,
    },
    {
      name: "Sarah Whitman",
      email: "sarah.w@example.com",
      phone: "781-555-0144",
      category: "Seller lead",
      town: "Wellesley",
      notes: "Empty nesters considering downsizing in the next year. Want to understand value first.",
      relationshipStrength: 3,
      lastContactedAt: daysAgo(55),
      nextFollowUpAt: daysFromNow(2),
      status: "Needs CMA",
      opportunityType: "Seller opportunity",
      source: "Sphere",
      tags: ["downsizing"],
      estimatedValue: 20000,
    },
    {
      name: "Mike Russo",
      email: "mike.russo@example.com",
      phone: "617-555-0150",
      category: "Past client",
      town: "Newton",
      notes: "Closed in 2021. Loves to refer friends. Haven't checked in for a while.",
      relationshipStrength: 5,
      lastContactedAt: daysAgo(165),
      status: "New",
      opportunityType: "Referral opportunity",
      source: "Past client",
      tags: ["advocate"],
    },
    {
      name: "Priya Nair",
      email: "priya.nair@example.com",
      phone: "781-555-0121",
      category: "Mortgage lead",
      town: "Needham",
      notes: "Renting now, wants to buy within 6-12 months. Needs to understand what to prepare.",
      relationshipStrength: 2,
      lastContactedAt: daysAgo(30),
      nextFollowUpAt: daysFromNow(5),
      status: "Waiting for reply",
      opportunityType: "Mortgage opportunity",
      source: "Website",
      tags: ["pre-approval"],
      estimatedValue: 7000,
    },
    {
      name: "Greg Thompson",
      email: "greg.t@example.com",
      phone: "781-555-0188",
      category: "Community contact",
      town: "Wellesley",
      notes: "Coaches youth soccer with me. Well-connected in town. Pure relationship nurture.",
      relationshipStrength: 4,
      lastContactedAt: daysAgo(25),
      status: "Long-term nurture",
      opportunityType: "General relationship nurture",
      source: "Community",
      tags: ["soccer"],
    },
    {
      name: "Anna Kim",
      email: "anna.kim@example.com",
      phone: "617-555-0166",
      category: "Landlord",
      town: "Newton",
      notes: "Owns a triple-decker. Weighing whether to hold or sell next year.",
      relationshipStrength: 3,
      lastContactedAt: daysAgo(140),
      nextFollowUpAt: daysAgo(3),
      status: "Needs follow-up",
      opportunityType: "Rental opportunity",
      source: "Referral",
      tags: ["hold-vs-sell"],
      estimatedValue: 15000,
    },
    {
      name: "Carlos Mendez",
      email: "carlos.m@example.com",
      phone: "617-555-0177",
      category: "Agent recruit",
      town: "Needham",
      notes: "Newer agent at another brokerage, frustrated with support. Potential team fit.",
      relationshipStrength: 2,
      lastContactedAt: daysAgo(60),
      status: "Long-term nurture",
      opportunityType: "Agent recruiting opportunity",
      source: "Networking",
      tags: ["recruit"],
    },
    {
      name: "Helen Foster",
      email: "helen.foster@example.com",
      phone: "781-555-0134",
      category: "Past client",
      town: "Wellesley",
      notes: "Bought in 2018. Just had a baby — may need more space in a year or two.",
      relationshipStrength: 4,
      lastContactedAt: daysAgo(300),
      status: "New",
      opportunityType: "Seller opportunity",
      source: "Past client",
      tags: ["growing-family"],
      estimatedValue: 17000,
    },
    {
      name: "James & Evelyn Walsh",
      email: "jwalsh@example.com",
      phone: "617-555-0201",
      category: "Seller lead",
      town: "Needham",
      notes: "Lived on Greendale Ave 22 years. Kids moved out. Evelyn wants less maintenance; James is sentimental. Considering spring listing. Need equity estimate before deciding.",
      relationshipStrength: 3,
      lastContactedAt: daysAgo(18),
      nextFollowUpAt: daysAgo(1),
      status: "Contact today",
      opportunityType: "Seller opportunity",
      source: "Sphere of influence",
      tags: ["empty-nester", "CMA-needed"],
      estimatedValue: 24000,
    },
    {
      name: "Nicole Park",
      email: "nicole.park@example.com",
      phone: "781-555-0222",
      category: "Buyer lead",
      town: "Wellesley",
      notes: "Relocating from NYC for new job at Biogen. Needs to be in by August. Budget $1.1–1.3M. Wants walkable area, 3BR+, good commute to Cambridge.",
      relationshipStrength: 3,
      lastContactedAt: daysAgo(7),
      nextFollowUpAt: daysFromNow(1),
      status: "Meeting scheduled",
      opportunityType: "Buyer opportunity",
      source: "Relocation referral",
      tags: ["relocating", "pre-approved"],
      estimatedValue: 19000,
    },
    {
      name: "Robert Singh",
      email: "rsingh@example.com",
      phone: "617-555-0233",
      category: "Business owner",
      town: "Newton",
      notes: "Owns two dry-cleaning locations. Interested in commercial investment or mixed-use. Cash buyer for right deal under $800K.",
      relationshipStrength: 4,
      lastContactedAt: daysAgo(200),
      nextFollowUpAt: daysAgo(7),
      status: "Needs follow-up",
      opportunityType: "Investor opportunity",
      source: "Chamber of Commerce",
      tags: ["commercial", "cash-buyer"],
      estimatedValue: 25000,
    },
    {
      name: "Christine Boyd",
      email: "c.boyd@example.com",
      phone: "508-555-0244",
      category: "Insurance lead",
      town: "Wellesley",
      notes: "New homeowner (closed with us 2024). Asked about umbrella policy and home insurance review. Referred by closing attorney.",
      relationshipStrength: 3,
      lastContactedAt: daysAgo(45),
      nextFollowUpAt: daysFromNow(3),
      status: "Waiting for reply",
      opportunityType: "Insurance opportunity",
      source: "Attorney referral",
      tags: ["new-homeowner"],
      estimatedValue: 3000,
    },
    {
      name: "Marcus Webb",
      email: "marcus.webb@example.com",
      phone: "617-555-0255",
      category: "Renter",
      town: "Newton",
      notes: "Renting in Newton Centre, lease up in October. Saving for down payment (~$40K so far). Wants to buy a condo under $550K. Not pre-approved yet.",
      relationshipStrength: 2,
      lastContactedAt: daysAgo(22),
      nextFollowUpAt: daysAgo(2),
      status: "Needs follow-up",
      opportunityType: "Buyer opportunity",
      source: "Instagram DM",
      tags: ["first-time", "condo"],
      estimatedValue: 11000,
    },
  ];

  for (const c of contacts) {
    const { tags, ...rest } = c;
    const status = rest.status;
    await prisma.contact.create({
      data: {
        ...rest,
        userId: user.id,
        tags: JSON.stringify(tags ?? []),
        pipelineStage: statusToStage(status),
      },
    });
  }

  console.log(`Seeded demo user (${email} / demo1234) with ${contacts.length} contacts.`);
}

function statusToStage(status: string): string {
  switch (status) {
    case "Contact today":
      return "Contact Today";
    case "Waiting for reply":
      return "Waiting for Reply";
    case "Replied":
      return "Replied";
    case "Meeting scheduled":
      return "Meeting Scheduled";
    case "Needs CMA":
    case "Needs mortgage intro":
      return "Active Opportunity";
    case "Closed":
      return "Closed";
    case "Dead / inactive":
      return "Inactive";
    default:
      return "Long-Term Nurture";
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
