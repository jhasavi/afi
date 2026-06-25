import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { PipelineBoard, type PipelineContact } from "@/components/PipelineBoard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const user = await requireUser();
  const contacts = await prisma.contact.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      category: true,
      town: true,
      pipelineStage: true,
      nextFollowUpAt: true,
      estimatedValue: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="A lightweight view of where every relationship stands. Drag cards between stages."
      />
      <div className="p-8">
        {contacts.length === 0 ? (
          <EmptyState
            title="Your pipeline is empty"
            description="Add or import contacts to see them flow through your pipeline."
            action={
              <Link href="/contacts/new" className="btn-primary">
                Add contact
              </Link>
            }
          />
        ) : (
          <PipelineBoard contacts={contacts as PipelineContact[]} />
        )}
      </div>
    </div>
  );
}
