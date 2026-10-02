"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, FormBanner, Input, Label, Textarea } from "@/components/ui/input";
import { createFormAction, type FormActionState } from "@/server/actions/form-actions";

export function CreateFormForm() {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(createFormAction, {
    status: "idle",
  });

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "error" && state.message ? (
        <FormBanner tone="error">{state.message}</FormBanner>
      ) : null}

      <div>
        <Label htmlFor="name">Form name</Label>
        <Input id="name" name="name" type="text" required autoFocus maxLength={160} />
        {state.fieldErrors?.name?.[0] ? <FieldError>{state.fieldErrors.name[0]}</FieldError> : null}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} maxLength={2000} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create form"}
      </Button>
    </form>
  );
}
