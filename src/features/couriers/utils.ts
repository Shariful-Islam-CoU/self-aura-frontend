import { formatDate, toDateInputValue } from "@/features/payments/utils";

// A courier's status is the backend boolean `isActive` (no status enum).
export const getCourierStatusLabel = (isActive: boolean): string =>
  isActive ? "Active" : "Inactive";

// Safely builds an http(s) href from a backend-provided website string. When
// the value can't be turned into a safe http(s) link the UI renders it as
// plain text instead - no URLs are constructed from assumptions.
export const toWebsiteHref = (website?: string): string | null => {
  if (!website) return null;
  const value = website.trim();
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("www.")) return `https://${value}`;
  return null;
};

export { formatDate, toDateInputValue };