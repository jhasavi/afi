"use client";

import { Trash2 } from "lucide-react";
import { deleteContactAction } from "@/lib/actions/contacts";

export function DeleteContactButton({ contactId, name }: { contactId: string; name: string }) {
  const action = deleteContactAction.bind(null, contactId);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete ${name}? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn-danger">
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </form>
  );
}
