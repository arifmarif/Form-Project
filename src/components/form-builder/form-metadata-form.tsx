"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, FormBanner, Input, Label, Textarea } from "@/components/ui/input";
import { type FormActionState, updateFormMetadataAction } from "@/server/actions/form-actions";

export function FormMetadataForm({
  formId,
  name,
  description,
}: {
  formId: string;
  name: string;
  description: string;
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    updateFormMetadataAction,
    { status: "idle" },
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="formId" value={formId} />

      {state.status === "error" && state.message ? (
        <FormBanner tone="error">{state.message}</FormBanner>
      ) : null}
      {state.status === "success" ? <FormBanner tone="success">Saved.</FormBanner> : null}

      <div>
        <Label htmlFor="form-name">Name</Label>
        <Input id="form-name" name="name" type="text" defaultValue={name} required maxLength={160} />
        {state.fieldErrors?.name?.[0] ? <FieldError>{state.fieldErrors.name[0]}</FieldError> : null}
      </div>

      <div>
        <Label htmlFor="form-description">Description</Label>
        <Textarea
          id="form-description"
          name="description"
          rows={4}
          defaultValue={description}
          maxLength={2000}
        />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
