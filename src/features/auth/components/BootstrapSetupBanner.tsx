"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authService } from "@/features/auth/services/authService";
import { KeyRound } from "lucide-react";

/**
 * Surfaces the one-time Owner setup on the login screen while it is still
 * available. The backend exposes a public read-only bootstrap-status endpoint;
 * the banner is purely informational - any fetch failure renders nothing so it
 * can never block or break the login flow.
 */
export function BootstrapSetupBanner() {
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    // setState only inside async callbacks keeps the Next.js effect lint rule
    // happy (no synchronous state updates in the effect body).
    authService
      .getBootstrapStatus()
      .then((status) => {
        if (!cancelled) setOwnerExists(status.ownerExists);
      })
      .catch(() => {
        // Network/backend unavailable: hide the banner silently.
        if (!cancelled) setOwnerExists(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (ownerExists !== false) return null;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 text-center sm:flex-row sm:text-left">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">No Owner account exists yet</p>
        <p className="text-xs text-muted-foreground">
          Set up the principal Owner account to manage users, roles and
          permissions. Available only once.
        </p>
      </div>
      <Link
        href="/setup/owner"
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Set up now
      </Link>
    </div>
  );
}