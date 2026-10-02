import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/server/services/auth-service";

export const metadata = { title: "Register" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Create an account</h1>
        <p className="mt-1 mb-6 text-sm text-neutral-600">
          Start building forms with formulas and calculations.
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
