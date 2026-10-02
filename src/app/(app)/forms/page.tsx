import { Card, PageHeading, StatusBadge } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDate, formatNumber } from "@/lib/utils";
import { requireUser } from "@/server/services/auth-service";
import { listForms } from "@/server/services/form-service";
import { DeleteFormButton, DuplicateFormButton } from "@/components/dashboard/form-actions";

export const metadata = { title: "My Forms" };

export default async function FormsPage() {
  const user = await requireUser();
  const forms = await listForms(user.id);

  return (
    <>
      <PageHeading
        title="My Forms"
        description="Every form you own, newest first."
        actions={<ButtonLink href="/forms/new">Create form</ButtonLink>}
      />

      {forms.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-neutral-600">You have not created any forms yet.</p>
          <ButtonLink href="/forms/new" className="mt-4">
            Create your first form
          </ButtonLink>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Forms owned by you</caption>
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
                <th scope="col" className="px-4 py-3 font-medium">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Responses
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Updated
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr key={form.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{form.name}</p>
                    {form.description ? (
                      <p className="mt-0.5 max-w-md truncate text-neutral-600">{form.description}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={form.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{formatNumber(form.responseCount)}</td>
                  <td className="px-4 py-3 text-neutral-700">{formatDate(form.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <ButtonLink href={`/forms/${form.id}`} variant="secondary" size="sm">
                        Open
                      </ButtonLink>
                      <DuplicateFormButton formId={form.id} />
                      <DeleteFormButton formId={form.id} formName={form.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
