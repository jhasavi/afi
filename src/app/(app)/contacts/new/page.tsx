import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";
import { createContactAction } from "@/lib/actions/contacts";

export default async function NewContactPage() {
  await requireUser();

  return (
    <div>
      <PageHeader title="Add contact" subtitle="Add someone to your relationship network" />
      <div className="mx-auto max-w-3xl p-8">
        <Link href="/contacts" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="h-4 w-4" />
          Back to contacts
        </Link>
        <ContactForm
          action={createContactAction}
          submitLabel="Create contact"
          cancelHref="/contacts"
        />
      </div>
    </div>
  );
}
