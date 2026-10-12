import { appConfig } from "@/lib/config";

/**
 * Media URL reconciliation.
 *
 * `next/image` resolves a ROOT-RELATIVE `src` against the *app* origin, not the
 * API origin, so in a split-origin deployment (app on :3000, API on :5000) a raw
 * `/media/<key>` path 404s. Product media now lives in Cloudinary and is
 * delivered from `https://res.cloudinary.com/...` over absolute URLs, so most
 * values pass straight through - but records written by the previous
 * local-filesystem adapter still hold a root-relative path, and those products
 * must keep rendering.
 *
 * This lives in `lib` rather than in a feature folder because the management
 * app has two features that show media (products and categories) and neither
 * should own the rule.
 */

/** Origin of the backend API, e.g. `http://localhost:5000` from `.../api`. */
function apiOrigin(): string | null {
  try {
    return new URL(appConfig.apiUrl).origin;
  } catch {
    return null;
  }
}

/**
 * Turns a stored media URL into something `next/image` can load.
 *
 * Absolute `http(s)` URLs are returned untouched - which covers every Cloudinary
 * delivery URL. Root-relative URLs are resolved against the API origin, for the
 * legacy records described above. Anything else returns `null` so the caller
 * renders its styled fallback instead of a broken image.
 */
export function resolveMediaUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const value = url.trim();
  if (value.length === 0) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      // Reject anything that is not a parseable http(s) URL (e.g. `javascript:`).
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? value : null;
    } catch {
      return null;
    }
  }

  // Protocol-relative (`//host/x`) would silently escape to another origin.
  if (!value.startsWith("/") || value.startsWith("//")) return null;

  const origin = apiOrigin();
  return origin ? `${origin}${value}` : value;
}
