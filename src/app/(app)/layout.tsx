import { AppShell } from "@/components/dashboard/app-shell";
import { requireUser } from "@/server/services/auth-service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
