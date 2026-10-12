import { AppShell } from "@/components/layout";
import { AuthGuard } from "@/components/layout/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth>
      <AppShell>{children}</AppShell>
     </AuthGuard>
  );
}