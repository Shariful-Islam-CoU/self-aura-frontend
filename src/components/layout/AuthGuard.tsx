"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { LoadingState } from "@/components/ui/LoadingState";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: string[];
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/login",
  allowedRoles,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
        router.push(redirectUrl);
      } else if (!requireAuth && isAuthenticated) {
        // Redirect authenticated users away from login page
        router.push("/dashboard");
      } else if (isAuthenticated && allowedRoles && allowedRoles.length > 0 && user) {
        if (!allowedRoles.includes(user.role)) {
          router.push("/dashboard");
        }
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, allowedRoles, user, router, pathname, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState text="Checking authentication..." />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (!requireAuth && isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (allowedRoles && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}