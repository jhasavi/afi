import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";
import { createContactAction } from "@/lib/actions/contacts";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  await requireUser();
  const error = searchParams?.error;

  return (
    <div>
      <PageHeader title="Add contact" subtitle="Add someone to your relationship network" />
      <div className="mx-auto max-w-3xl p-8">
        <Link href="/contacts" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="h-4 w-4" />
          Back to contacts
        </Link>
        {error && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}{" "}
            <Link href="/pricing" className="font-medium text-brand-700 underline">
              View pricing
            </Link>
          </div>
        )}
        <ContactForm
          action={createContactAction}
          submitLabel="Create contact"
          cancelHref="/contacts"
        />
      </div>
    </div>
  );
}
