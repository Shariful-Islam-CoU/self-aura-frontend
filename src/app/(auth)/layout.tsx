import { AuthGuard } from "@/components/layout/AuthGuard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={false} redirectTo="/dashboard">
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        {children}
      </div>
    </AuthGuard>
  );
}