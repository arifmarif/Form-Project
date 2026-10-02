"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, FormBanner, Input, Label } from "@/components/ui/input";
import { loginAction } from "@/server/actions/auth-actions";
import { type ActionState } from "@/server/services/user-service";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, {
    status: "idle",
  });

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "error" && state.message ? (
        <FormBanner tone="error">{state.message}</FormBanner>
      ) : null}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <FieldError className="sr-only" aria-live="polite">
        {state.status === "error" ? (state.message ?? "") : ""}
      </FieldError>
    </form>
  );
}
