import { notFound } from "next/navigation";
import { PageHeading } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { FormPreview } from "@/components/form-renderer/form-preview";
import { emptyFormSchema, parseFormSchema } from "@/lib/form-schema";
import { requireUser } from "@/server/services/auth-service";
import { FormActionError, getFormForOwner } from "@/server/services/form-service";

export const metadata = { title: "Preview" };

export default async function FormPreviewPage({ params }: PageProps<"/forms/[formId]/preview">) {
  const user = await requireUser();
  const { formId } = await params;

  let form: Awaited<ReturnType<typeof getFormForOwner>>;
  try {
    form = await getFormForOwner(user.id, formId);
  } catch (error) {
    if (error instanceof FormActionError) notFound();
    throw error;
  }

  const version = form.versions[0];
  const schema = parseFormSchema(version?.schema, emptyFormSchema);

  return (
    <>
      <PageHeading
        title={`Preview: ${form.name}`}
        description={`Version ${version?.version ?? 1} · preview responses are never stored.`}
        actions={
          <>
            <ButtonLink href="/forms" variant="secondary" size="sm">
              All forms
            </ButtonLink>
            <ButtonLink href={`/forms/${form.id}`} variant="secondary" size="sm">
              Back to builder
            </ButtonLink>
          </>
        }
      />

      <FormPreview
        schema={schema}
        title={form.name}
        description={form.description ?? undefined}
      />
    </>
  );
}