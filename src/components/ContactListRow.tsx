"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil } from "lucide-react";
import type { Contact } from "@prisma/client";
import { StatusBadge, CategoryBadge, StrengthMeter } from "@/components/ui";
import { formatDate, parseTags } from "@/lib/utils";

export function ContactListRow({ contact }: { contact: Contact }) {
  const router = useRouter();
  const overdue = contact.nextFollowUpAt && contact.nextFollowUpAt < new Date();
  const tags = parseTags(contact.tags);
  const tagPreview = tags.slice(0, 2).join(", ");

  return (
    <tr
      className="cursor-pointer hover:bg-slate-50"
      onClick={() => router.push(`/contacts/${contact.id}`)}
    >
      <td className="px-4 py-3">
        <span className="font-medium text-slate-900">{contact.name}</span>
        <div className="text-xs text-slate-500">
          {[contact.email, contact.phone].filter(Boolean).join(" · ") || "—"}
        </div>
      </td>
      <td className="px-4 py-3">
        <CategoryBadge category={contact.category} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={contact.status} />
      </td>
      <td className="px-4 py-3 text-slate-600">{contact.opportunityType}</td>
      <td className="px-4 py-3 text-slate-600">{contact.town || "—"}</td>
      <td className="px-4 py-3">
        <StrengthMeter value={contact.relationshipStrength} />
      </td>
      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(contact.lastContactedAt)}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={overdue ? "font-medium text-red-600" : "text-slate-500"}>
          {formatDate(contact.nextFollowUpAt)}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate" title={tagPreview || contact.source || ""}>
        {tagPreview || contact.source || "—"}
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Link
            href={`/contacts/${contact.id}`}
            className="btn-ghost !px-2 !py-1.5"
            title="View contact"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Link>
          <Link
            href={`/contacts/${contact.id}/edit`}
            className="btn-ghost !px-2 !py-1.5"
            title="Edit contact"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Link>
        </div>
      </td>
    </tr>
  );
}
