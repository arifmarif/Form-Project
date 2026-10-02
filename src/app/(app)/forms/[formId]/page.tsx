import { notFound } from "next/navigation";
import { Card, PageHeading, StatusBadge } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { FieldEditor } from "@/components/form-builder/field-editor";
import { FormMetadataForm } from "@/components/form-builder/form-metadata-form";
import { formatDate, formatNumber } from "@/lib/utils";
import { requireUser } from "@/server/services/auth-service";
import { FormActionError, getFormForOwner } from "@/server/services/form-service";

export const metadata = { title: "Form" };

export default async function FormDetailPage({ params }: PageProps<"/forms/[formId]">) {
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

  return (
    <>
      <PageHeading
        title={form.name}
        description={form.description ?? "No description yet."}
        actions={
          <>
            <ButtonLink href="/forms" variant="secondary" size="sm">
              All forms
            </ButtonLink>
            <ButtonLink href={`/forms/${form.id}/preview`} variant="secondary" size="sm">
              Preview
            </ButtonLink>
            <ButtonLink href={`/forms/${form.id}/responses`} variant="secondary" size="sm">
              Responses ({formatNumber(form.responseCount)})
            </ButtonLink>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
        <StatusBadge status={form.status} />
        <span>Version {version?.version ?? 1}</span>
        <span>Created {formatDate(form.createdAt)}</span>
        <span className="font-mono text-xs">/f/{form.slug}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Fields</h2>
          <FieldEditor formId={form.id} initialSchema={version?.schema ?? null} />
        </Card>

        <Card className="h-fit p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Form settings</h2>
          <FormMetadataForm
            formId={form.id}
            name={form.name}
            description={form.description ?? ""}
          />
        </Card>
      </div>
    </>
  );
}
