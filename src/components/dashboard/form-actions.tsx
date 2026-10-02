"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteFormAction, duplicateFormAction } from "@/server/actions/form-actions";

export function DuplicateFormButton({ formId }: { formId: string }) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={busy || pending}
      onClick={() => {
        setBusy(true);
        startTransition(() => {
          void duplicateFormAction(formId);
        });
      }}
    >
      {busy || pending ? "Duplicating…" : "Duplicate"}
    </Button>
  );
}

export function DeleteFormButton({ formId, formName }: { formId: string; formName: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-neutral-600">Delete?</span>
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => void deleteFormAction(formId))}
        >
          {pending ? "Deleting…" : "Confirm"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${formName}`}
    >
      Delete
    </Button>
  );
}
