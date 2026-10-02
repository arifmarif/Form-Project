"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type FormSchema, formSchemaSchema } from "@/lib/form-schema";
import {
  createForm,
  deleteForm,
  duplicateForm,
  saveFormSchema,
  updateFormMetadata,
} from "@/server/services/form-service";
import { requireUser } from "@/server/services/auth-service";

const metadataSchema = z.object({
  formId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required.").max(160),
  description: z.string().trim().max(2000),
});

export type FormActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createFormAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { status: "error", message: "Form name is required.", fieldErrors: { name: ["Form name is required."] } };
  }

  const form = await createForm({ ownerId: user.id, name, description: description || null });
  revalidatePath("/dashboard");
  redirect(`/forms/${form.id}`);
}

export async function updateFormMetadataAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();

  const parsed = metadataSchema.safeParse({
    formId: formData.get("formId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateFormMetadata({
      ownerId: user.id,
      formId: parsed.data.formId,
      name: parsed.data.name,
      description: parsed.data.description || null,
    });
  } catch {
    return { status: "error", message: "Unable to save the form. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/forms/${parsed.data.formId}`);
  return { status: "success", message: "Saved." };
}

export async function saveSchemaAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();

  const formId = String(formData.get("formId") ?? "");
  const raw = String(formData.get("schema") ?? "{}");

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { status: "error", message: "The form structure could not be read." };
  }

  const parsed = formSchemaSchema.safeParse(json);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "The form structure is invalid.",
    };
  }

  const schema: FormSchema = parsed.data;

  try {
    await saveFormSchema({ ownerId: user.id, formId, schema });
  } catch {
    return { status: "error", message: "Unable to save the form. Please try again." };
  }

  revalidatePath(`/forms/${formId}`);
  return { status: "success", message: "Saved." };
}

export async function duplicateFormAction(formId: string): Promise<void> {
  const user = await requireUser();
  const copy = await duplicateForm({ ownerId: user.id, formId });
  redirect(`/forms/${copy.id}`);
}

export async function deleteFormAction(formId: string): Promise<void> {
  const user = await requireUser();
  await deleteForm({ ownerId: user.id, formId });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
