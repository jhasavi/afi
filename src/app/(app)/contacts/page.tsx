import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { ContactListRow } from "@/components/ContactListRow";
import { CONTACT_CATEGORIES, CONTACT_STATUSES } from "@/lib/constants";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; status?: string };
}) {
  const user = await requireUser();
  const q = searchParams.q?.trim() || "";
  const category = searchParams.category || "";
  const status = searchParams.status || "";

  const where: Prisma.ContactWhereInput = { userId: user.id };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { town: { contains: q } },
      { notes: { contains: q } },
      { tags: { contains: q } },
    ];
  }
  if (category) where.category = category;
  if (status) where.status = status;

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
  });

  const total = await prisma.contact.count({ where: { userId: user.id } });

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={`${total} contact${total === 1 ? "" : "s"} — click a row to view, or use Edit`}
        action={
          <div className="flex gap-2">
            <Link href="/import" className="btn-secondary">
              Import CSV
            </Link>
            <Link href="/contacts/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              Add contact
            </Link>
          </div>
        }
      />

      <div className="p-8">
        <form className="mb-5 flex flex-wrap items-center gap-3" method="get">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, town, notes, tags…"
              className="input pl-9"
            />
          </div>
          <select name="category" defaultValue={category} className="input w-auto">
            <option value="">All categories</option>
            {CONTACT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={status} className="input w-auto">
            <option value="">All statuses</option>
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary">
            Filter
          </button>
        </form>

        {contacts.length === 0 ? (
          <EmptyState
            title={total === 0 ? "No contacts yet" : "No matches"}
            description={
              total === 0
                ? "Import a CSV or add your first contact to start getting daily recommendations."
                : "Try a different search or clear the filters."
            }
            action={
              total === 0 ? (
                <div className="flex gap-2">
                  <Link href="/import" className="btn-secondary">
                    Import CSV
                  </Link>
                  <Link href="/contacts/new" className="btn-primary">
                    Add contact
                  </Link>
                </div>
              ) : (
                <Link href="/contacts" className="btn-secondary">
                  Clear filters
                </Link>
              )
            }
          />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Opportunity</th>
                  <th className="px-4 py-3 font-medium">Town</th>
                  <th className="px-4 py-3 font-medium">Strength</th>
                  <th className="px-4 py-3 font-medium">Last contacted</th>
                  <th className="px-4 py-3 font-medium">Next follow-up</th>
                  <th className="px-4 py-3 font-medium">Tags / source</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((c) => (
                  <ContactListRow key={c.id} contact={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
