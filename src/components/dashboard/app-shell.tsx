import Link from "next/link";
import { logoutAction } from "@/server/actions/auth-actions";
import type { SessionUser } from "@/server/services/auth-service";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/forms", label: "My Forms" },
  { href: "/forms/new", label: "Create Form" },
  { href: "/responses", label: "Responses" },
] as const;

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-neutral-900">
            Form Platform
          </Link>
          <nav aria-label="Main" className="hidden gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-neutral-600 sm:inline">{user.email}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
