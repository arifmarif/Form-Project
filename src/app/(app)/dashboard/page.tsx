import { redirect } from "next/navigation";
import { Card, PageHeading, StatusBadge } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDate, formatNumber } from "@/lib/utils";
import { getCurrentUser } from "@/server/services/auth-service";
import { getDashboardStats, listForms } from "@/server/services/form-service";

export const metadata = { title: "Dashboard" };

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
        {formatNumber(value)}
      </p>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [stats, forms] = await Promise.all([getDashboardStats(user.id), listForms(user.id)]);
  const recent = forms.slice(0, 5);

  return (
    <>
      <PageHeading
        title={`Welcome back, ${user.name ?? user.email}`}
        description="An overview of your forms and responses."
        actions={<ButtonLink href="/forms/new">Create form</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total forms" value={stats.totalForms} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Draft" value={stats.drafts} />
        <StatCard label="Closed" value={stats.closed} />
        <StatCard label="Responses" value={stats.totalResponses} />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Recent forms</h2>
          <ButtonLink href="/forms" variant="ghost" size="sm">
            View all
          </ButtonLink>
        </div>

        {recent.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-neutral-600">No forms yet.</p>
            <ButtonLink href="/forms/new" className="mt-4">
              Create your first form
            </ButtonLink>
          </Card>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {recent.map((form) => (
              <li key={form.id}>
                <Card className="p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900">{form.name}</p>
                      <p className="mt-0.5 text-sm text-neutral-600">
                        Updated {formatDate(form.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={form.status} />
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-neutral-600">
                    <span>{formatNumber(form.responseCount)} responses</span>
                    <ButtonLink href={`/forms/${form.id}`} variant="secondary" size="sm">
                      Open
                    </ButtonLink>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
