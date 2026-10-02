import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          Build forms that calculate
        </h1>
        <p className="mt-3 text-neutral-600">
          A form builder with a native formula engine. Create a form, wire fields together with
          expressions like <code className="font-mono">quantity * price</code>, publish it, and
          collect responses with server-verified totals.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <ButtonLink href="/register">Get started</ButtonLink>
          <ButtonLink href="/login" variant="secondary">
            Sign in
          </ButtonLink>
        </div>
        <p className="mt-8 text-sm text-neutral-500">
          <Link href="/dashboard" className="underline-offset-2 hover:underline">
            Go to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
