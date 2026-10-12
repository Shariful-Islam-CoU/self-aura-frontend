"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { LoadingState } from "@/components/ui/LoadingState";
import { Card } from "@/components/ui/Card";
import { getFirstAccessibleNavPath } from "@/constants/navigation";
import { ShieldAlert } from "lucide-react";

interface RequirePermissionProps {
  /** Permission key(s) needed to view the wrapped content. */
  permission: string | string[];
  children: React.ReactNode;
}

/**
 * UX-only permission gate for pages. The backend is the authorization source
 * of truth: this component only decides what to render, and a mismatch with
 * the backend surfaces as a 403 (rendered by the API error handlers),
 * never as an automatic logout.
 */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { canAccess, isLoading } = useAuth();

  const allowed = Array.isArray(permission)
    ? permission.some((key) => canAccess(key))
    : canAccess(permission);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingState text="Checking permissions..." />
      </div>
    );
  }

  if (!allowed) {
    const fallbackPath = getFirstAccessibleNavPath(canAccess);
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not have permission to view this page. If you
            believe this is a mistake, contact an Owner to review your role and
            permissions.
          </p>
          <Link
            href={fallbackPath}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to an area you can access
          </Link>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}