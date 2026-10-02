import { Card, PageHeading } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { formatNumber } from "@/lib/utils";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/services/auth-service";
import { FormActionError, getFormForOwner } from "@/server/services/form-service";

export const metadata = { title: "Responses" };

export default async function FormResponsesPage({ params }: PageProps<"/forms/[formId]/responses">) {
  const user = await requireUser();
  const { formId } = await params;

  let form: Awaited<ReturnType<typeof getFormForOwner>>;
  try {
    form = await getFormForOwner(user.id, formId);
  } catch (error) {
    if (error instanceof FormActionError) notFound();
    throw error;
  }

  return (
    <>
      <PageHeading
        title={`${form.name} responses`}
        description={`${formatNumber(form.responseCount)} responses collected.`}
        actions={
          <ButtonLink href={`/forms/${form.id}`} variant="secondary" size="sm">
            Back to form
          </ButtonLink>
        }
      />

      <Card className="p-10 text-center text-sm text-neutral-600">
        Response listing, filtering and CSV export arrive with Milestone 7. Submission handling is
        wired up server-side so this page only needs the query layer.
      </Card>
    </>
  );
}
