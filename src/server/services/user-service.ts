import "server-only";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be 128 characters or fewer."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const IDLE_STATE: ActionState = { status: "idle" };

export async function registerUser(input: RegisterInput): Promise<{ userId: string }> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await hash(input.password, 12);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
    select: { id: true },
  });

  return { userId: user.id };
}
