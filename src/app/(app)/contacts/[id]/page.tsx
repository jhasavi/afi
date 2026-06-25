import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  PageHeader,
  StatusBadge,
  CategoryBadge,
  StrengthMeter,
} from "@/components/ui";
import { MessageGenerator } from "@/components/MessageGenerator";
import { ResponseButtons } from "@/components/ResponseButtons";
import { BriefGenerator } from "@/components/BriefGenerator";
import { LogInteractionForm } from "@/components/LogInteractionForm";
import { DeleteContactButton } from "@/components/DeleteContactButton";
import { logInteractionAction } from "@/lib/actions/interactions";
import { formatDate, parseTags, relativeDate } from "@/lib/utils";
import { SuccessBanner } from "@/components/SuccessBanner";

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { saved?: string };
}) {
  const user = await requireUser();
  const contact = await prisma.contact.findFirst({
    where: { id: params.id, userId: user.id },
    include: { interactions: { orderBy: { date: "desc" }, take: 20 } },
  });
  if (!contact) notFound();

  const tags = parseTags(contact.tags);
  const logAction = logInteractionAction.bind(null, contact.id);
  const overdue = contact.nextFollowUpAt && contact.nextFollowUpAt < new Date();

  return (
    <div>
      <PageHeader
        title={contact.name}
        subtitle={`${contact.category} · ${contact.opportunityType}`}
        action={
          <div className="flex gap-2">
            <Link href={`/contacts/${contact.id}/edit`} className="btn-secondary">
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            <DeleteContactButton contactId={contact.id} name={contact.name} />
          </div>
        }
      />

      <div className="p-8">
        {searchParams.saved === "1" && (
          <SuccessBanner
            message="Contact saved successfully. Your changes are stored."
            dismissHref={`/contacts/${contact.id}`}
          />
        )}
        <Link
          href="/contacts"
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to contacts
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* AI message generator */}
            <section className="card p-6">
              <div className="mb-1 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand-600" />
                <h2 className="text-base font-semibold text-slate-900">AI message generator</h2>
              </div>
              <p className="mb-4 text-sm text-slate-500">
                Warm, advisor-like drafts — copy and send from your own phone or email.
              </p>
              <MessageGenerator contactId={contact.id} />
              <div className="mt-4 border-t border-slate-100 pt-4">
                <ResponseButtons contactId={contact.id} />
              </div>
            </section>

            {/* Advisory brief */}
            <section className="card p-6">
              <h2 className="text-base font-semibold text-slate-900">Advisory brief</h2>
              <p className="mb-4 text-sm text-slate-500">
                Prep like a trusted advisor before you reach out.
              </p>
              <BriefGenerator contactId={contact.id} />
            </section>

            {/* Log interaction */}
            <section className="card p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Log an interaction</h2>
              <LogInteractionForm action={logAction} />
            </section>

            {/* History */}
            <section className="card p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900">
                Interaction history
              </h2>
              {contact.interactions.length === 0 ? (
                <p className="text-sm text-slate-400">No interactions logged yet.</p>
              ) : (
                <ul className="space-y-3">
                  {contact.interactions.map((it) => (
                    <li key={it.id} className="border-l-2 border-brand-200 pl-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-800">{it.type}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{formatDate(it.date)}</span>
                        <span className="badge bg-slate-100 text-slate-600">{it.response}</span>
                      </div>
                      {it.notes && <p className="mt-1 text-sm text-slate-600">{it.notes}</p>}
                      {it.nextAction && (
                        <p className="mt-1 text-xs text-slate-500">
                          Next: {it.nextAction}
                          {it.followUpAt ? ` · follow up ${formatDate(it.followUpAt)}` : ""}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Sidebar info */}
          <div className="space-y-6">
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <StatusBadge status={contact.status} />
                <CategoryBadge category={contact.category} />
              </div>
              <dl className="space-y-3 text-sm">
                {contact.email && (
                  <InfoRow icon={<Mail className="h-4 w-4" />} value={contact.email} href={`mailto:${contact.email}`} />
                )}
                {contact.phone && (
                  <InfoRow icon={<Phone className="h-4 w-4" />} value={contact.phone} href={`tel:${contact.phone}`} />
                )}
                {contact.town && <InfoRow icon={<MapPin className="h-4 w-4" />} value={contact.town} />}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Relationship</span>
                  <StrengthMeter value={contact.relationshipStrength} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last contacted</span>
                  <span className="text-slate-700">
                    {formatDate(contact.lastContactedAt)}{" "}
                    <span className="text-slate-400">({relativeDate(contact.lastContactedAt)})</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Next follow-up</span>
                  <span className={overdue ? "font-medium text-red-600" : "text-slate-700"}>
                    {formatDate(contact.nextFollowUpAt)}
                  </span>
                </div>
                {contact.source && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Source</span>
                    <span className="text-slate-700">{contact.source}</span>
                  </div>
                )}
                {contact.estimatedValue != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Est. value</span>
                    <span className="text-slate-700">
                      ${contact.estimatedValue.toLocaleString()}
                    </span>
                  </div>
                )}
              </dl>

              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t} className="badge bg-slate-100 text-slate-600">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {contact.notes && (
              <section className="card p-6">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Notes</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-600">{contact.notes}</p>
              </section>
            )}

            <section className="card bg-brand-50/50 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-800">
                <Calendar className="h-4 w-4" />
                Pipeline stage
              </div>
              <p className="mt-1 text-sm text-brand-700">{contact.pipelineStage}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  value,
  href,
}: {
  icon: React.ReactNode;
  value: string;
  href?: string;
}) {
  const content = (
    <span className="flex items-center gap-2 text-slate-700">
      <span className="text-slate-400">{icon}</span>
      {value}
    </span>
  );
  return href ? (
    <a href={href} className="block hover:text-brand-600">
      {content}
    </a>
  ) : (
    content
  );
}
