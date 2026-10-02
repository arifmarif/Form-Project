"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, FormBanner, Input, Label } from "@/components/ui/input";
import { registerAction } from "@/server/actions/auth-actions";
import type { ActionState } from "@/server/services/user-service";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registerAction, {
    status: "idle",
  });

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "error" && state.message ? (
        <FormBanner tone="error">{state.message}</FormBanner>
      ) : null}

      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required autoFocus />
        {errors.name?.[0] ? <FieldError>{errors.name[0]}</FieldError> : null}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {errors.email?.[0] ? <FieldError>{errors.email[0]}</FieldError> : null}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        {errors.password?.[0] ? <FieldError>{errors.password[0]}</FieldError> : null}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        {errors.confirmPassword?.[0] ? <FieldError>{errors.confirmPassword[0]}</FieldError> : null}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
