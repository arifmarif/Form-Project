import { CreateFormForm } from "@/components/dashboard/create-form-form";
import { Card, PageHeading } from "@/components/ui/card";
import { requireUser } from "@/server/services/auth-service";

export const metadata = { title: "Create Form" };

export default async function NewFormPage() {
  await requireUser();

  return (
    <>
      <PageHeading title="Create form" description="Start with a name. You can add fields next." />
      <Card className="max-w-xl p-6">
        <CreateFormForm />
      </Card>
    </>
  );
}
