import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/server/services/auth-service";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Sign in</h1>
        <p className="mt-1 mb-6 text-sm text-neutral-600">
          Welcome back. Enter your credentials to continue.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
