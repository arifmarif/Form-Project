"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signIn, signOut } from "@/lib/auth";
import { type ActionState, type RegisterInput, registerSchema, registerUser } from "@/server/services/user-service";

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input: RegisterInput = parsed.data;

  try {
    await registerUser(input);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to create the account.",
    };
  }

  await signIn("credentials", { email: input.email, password: input.password, redirect: false });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || email.length === 0) {
    return { status: "error", message: "Email and password are required." };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "error", message: "Invalid email or password." };
    }
    throw error;
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
