import type { ManagedProductImage, ManagedProductVideo, ProductImage, ProductVideo } from "../types";

/**
 * Product-media helpers.
 *
 * Product media is stored in Cloudinary and delivered straight from Cloudinary's
 * CDN, so a new upload comes back as an absolute `https://res.cloudinary.com/...`
 * URL. A record written by the previous local-filesystem adapter still holds a
 * root-relative `/media/<key>` path; those products must keep rendering, so the
 * URL reconciliation lives in `lib/mediaUrl` and is re-exported here for the
 * many components that already import their media helpers from this module.
 *
 * What is left here is the product-specific part: the canonical order, and the
 * formatting the management media lists need.
 */

export { resolveMediaUrl } from "@/lib/mediaUrl";
/**
 * The primary image: the canonical first entry.
 *
 * There is deliberately no `isPrimary` flag anywhere - position 0 is the only
 * definition, so "make this primary" is just "move it to the top".
 */
export function getPrimaryImage<T extends { sortOrder: number }>(
  images: T[] | undefined | null
): T | undefined {
  if (!images || images.length === 0) return undefined;
  return images.reduce((best, image) => (image.sortOrder < best.sortOrder ? image : best), images[0]);
}

/** Sorts a list into canonical order and re-numbers `sortOrder` densely. */
export function normalizeOrder<T extends { sortOrder: number }>(images: T[]): T[] {
  return [...images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image, index) => ({ ...image, sortOrder: index }));
}

/** Human-readable file size for the management media lists. */
export function formatBytes(bytes: number | undefined): string | null {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** `1200 × 1600` when the backend reported dimensions, otherwise `null`. */
export function formatDimensions(
  width: number | undefined,
  height: number | undefined
): string | null {
  if (typeof width !== "number" || typeof height !== "number") return null;
  return `${width} × ${height}`;
}

/** `1:24` for the management video list, or `null` when the length is unknown. */
export function formatDuration(seconds: number | undefined): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  if (minutes === 0) return `${remainder}s`;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

/** Structural equality for two media lists, used to detect unsaved changes. */
export function sameMediaList<T extends { url: string; alt: string; sortOrder: number }>(
  a: readonly T[],
  b: readonly T[]
): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return (
      item.url === other.url && item.alt === other.alt && item.sortOrder === other.sortOrder
    );
  });
}

/** Structural equality for image lists. Thin alias kept for readability. */
export function sameImageList(
  a: readonly Pick<ProductImage, "url" | "alt" | "sortOrder">[],
  b: readonly Pick<ProductImage, "url" | "alt" | "sortOrder">[]
): boolean {
  return sameMediaList(a, b);
}

/** Moves an item, returning a new array. Out-of-range indices are a no-op. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Moves an item to the front of the list. */
export function moveToFront<T>(items: T[], from: number): T[] {
  return moveItem(items, from, 0);
}

/**
 * The MIME types the backend will accept, duplicated here ONLY so the file
 * picker can filter and so an obviously wrong file is refused before it is
 * uploaded.
 *
 * This is a convenience filter, not a security control: the server sniffs the
 * actual bytes, so a file that slips past this check is still validated
 * properly. The sizes below are the same ceilings the server enforces.
 */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/** `accept` attribute for the image file input. */
export const IMAGE_INPUT_ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");
/** `accept` attribute for the video file input. */
export const VIDEO_INPUT_ACCEPT = ACCEPTED_VIDEO_TYPES.join(",");

/** Bytes for a multipart `max` attribute the picker can enforce locally. */
export const MAX_IMAGE_UPLOAD_LABEL = "5 MB";
export const MAX_VIDEO_UPLOAD_LABEL = "100 MB";

export type { ManagedProductImage, ManagedProductVideo, ProductImage, ProductVideo };
