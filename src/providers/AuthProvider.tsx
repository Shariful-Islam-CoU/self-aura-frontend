"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/features/auth/services/authService";
import type { User } from "@/features/auth/types";
import { getStoredUser, setStoredUser, hasAuthToken, clearAllAuth } from "@/lib/auth/authStorage";
import { ApiClient } from "@/lib/api";
import { ApiError } from "@/lib/api/types";

interface AuthContextType {
  user: User | null;
  /** Effective permission keys snapshot (UI-only; the backend re-resolves per request). */
  permissions: string[];
  /** UX-only permission check. The backend remains the source of truth: a 403
   *  renders "Access denied", it never logs the user out. */
  canAccess: (permission: string) => boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Permission snapshot for UX gating. An empty/unknown value degrades to
  // "no access" - the backend decides and can re-grant or revoke at any time.
  const permissions = useMemo(() => user?.permissions ?? [], [user]);

  const canAccess = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions]
  );

  // Global 401 handling: any API request with an invalid/expired token clears
  // the auth state and redirects to login (no broken authenticated UI). A guard
  // flag prevents duplicate redirects from concurrent failing requests.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let redirecting = false;

    ApiClient.setUnauthorizedHandler(() => {
      if (redirecting) return;
      if (window.location.pathname.startsWith("/login")) return;

      redirecting = true;
      clearAllAuth();
      setUser(null);
      setIsAuthenticated(false);

      const current = window.location.pathname + window.location.search;
      void router.push(`/login?redirect=${encodeURIComponent(current)}`);
    });

    return () => ApiClient.setUnauthorizedHandler(null);
  }, [router]);

  // Restore the session on mount: validate the stored token against the
  // backend. All state updates happen inside this locally-defined async
  // function so the effect body never sets state synchronously.
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!hasAuthToken()) {
        if (!cancelled) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const userData = await authService.getCurrentUser();
        if (cancelled) return;
        setStoredUser(userData);
        setUser(userData);
        setIsAuthenticated(true);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        // 401 = invalid/expired token: clear the local session.
        // Any other failure (network/server) keeps the stored user so a
        // transient backend outage does not log the user out.
        if (err instanceof ApiError && err.status === 401) {
          clearAllAuth();
          setUser(null);
          setIsAuthenticated(false);
        } else {
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ username, password });
      setUser(response.user);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        canAccess,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}