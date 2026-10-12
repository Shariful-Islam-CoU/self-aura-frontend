// Authentication utility functions
//
// Role checks are display helpers only - NEVER an authorization source.
// Authorization lives in the backend (permission keys resolved from the
// database on every request). Use the AuthProvider `canAccess(permission)`
// helper for any UI gating.

import type { User } from "@/features/auth/types";

export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false;
  return user.role === role;
}

export function hasAnyRole(user: User | null, roles: readonly string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function isOwner(user: User | null): boolean {
  return hasRole(user, "owner");
}

export function isManager(user: User | null): boolean {
  return hasRole(user, "manager");
}

export function isStaff(user: User | null): boolean {
  return hasRole(user, "staff");
}

export function isAtLeastManager(user: User | null): boolean {
  return hasAnyRole(user, ["owner", "manager"]);
}

export function getRoleDisplayName(role: string): string {
  const displayNames: Record<string, string> = {
    owner: "Owner",
    manager: "Manager",
    staff: "Staff",
  };
  return displayNames[role] ?? role;
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    owner: "bg-primary/10 text-primary",
    manager: "bg-info/10 text-info",
    staff: "bg-muted text-muted-foreground",
  };
  return colors[role] ?? colors.staff;
}

export function canAccessRoute(user: User | null, requiredRoles: readonly string[]): boolean {
  if (!user) return false;
  return hasAnyRole(user, requiredRoles);
}

export function getAuthRedirectPath(user: User | null): string {
  if (!user) return "/login";
  return "/dashboard";
}

export function formatUserDisplayName(user: User | null): string {
  if (!user) return "Guest";
  return user.username;
}

export function formatUserInitials(user: User | null): string {
  if (!user) return "?";
  return user.username.slice(0, 2).toUpperCase();
}