// Settings feature helpers.

import { ApiError } from "@/lib/api";

/**
 * Maps any thrown error to a safe, user-facing message, following project
 * conventions for HTTP status handling. A 403 is always reported as a
 * permission problem (never a logout). Passwords are never included anywhere.
 */
export function settingsErrorMessage(
  error: unknown,
  fallback = "Unable to save. Please try again."
): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "Your session is no longer valid. Please sign in again.";
      case 403:
        return "You do not have permission to perform this action. Only owners can change some settings.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return error.message || "The request conflicts with the current state.";
      case 422:
        return error.message || "The submitted data is invalid.";
      default:
        return error.message || fallback;
    }
  }
  return error instanceof Error ? error.message : fallback;
}

/** Formats an ISO timestamp with the browser locale (safe fallback to the raw value). */
export function formatSettingsDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}