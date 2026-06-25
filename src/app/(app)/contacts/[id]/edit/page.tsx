import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";
import { updateContactAction } from "@/lib/actions/contacts";

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const contact = await prisma.contact.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!contact) notFound();

  const action = updateContactAction.bind(null, contact.id);

  return (
    <div>
      <PageHeader title={`Edit ${contact.name}`} />
      <div className="mx-auto max-w-3xl p-8">
        <Link
          href={`/contacts/${contact.id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to contact
        </Link>
        <p className="mb-4 text-sm text-slate-500">
          Update any field below, then save. Use Cancel to leave without saving.
        </p>
        <ContactForm
          contact={contact}
          action={action}
          submitLabel="Save changes"
          cancelHref={`/contacts/${contact.id}`}
        />
      </div>
    </div>
  );
}
