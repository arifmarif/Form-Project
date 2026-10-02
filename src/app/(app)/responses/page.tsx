import { Card, PageHeading } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { requireUser } from "@/server/services/auth-service";
import { getDashboardStats } from "@/server/services/form-service";
import { prisma } from "@/lib/db";

export const metadata = { title: "Responses" };

export default async function ResponsesPage() {
  const user = await requireUser();
  const [stats, latest] = await Promise.all([
    getDashboardStats(user.id),
    prisma.response.findMany({
      where: { form: { ownerId: user.id } },
      orderBy: { submittedAt: "desc" },
      take: 10,
      select: {
        id: true,
        publicId: true,
        submittedAt: true,
        form: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeading
        title="Responses"
        description={`${stats.totalResponses} responses collected across ${stats.totalForms} forms.`}
      />

      <Card className="overflow-hidden">
        {latest.length === 0 ? (
          <p className="p-10 text-center text-sm text-neutral-600">
            No responses yet. Publish a form to start collecting submissions.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Most recent responses</caption>
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
                <th scope="col" className="px-4 py-3 font-medium">
                  Response
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Form
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {latest.map((response) => (
                <tr key={response.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-700">{response.publicId}</td>
                  <td className="px-4 py-3 text-neutral-900">
                    <ButtonLink
                      href={`/forms/${response.form.id}/responses`}
                      variant="ghost"
                      size="sm"
                    >
                      {response.form.name}
                    </ButtonLink>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(response.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
