import type { CategoryThumbnail } from "../types";
import { resolveMediaUrl } from "@/lib/mediaUrl";

/**
 * Category media helpers.
 *
 * A category has at most one thumbnail, so there is no list to order and no
 * primary to pick - just "is there an image, and can `next/image` load it".
 */

export { resolveMediaUrl };

/**
 * The thumbnail URL ready for `next/image`, or `null` when the category has no
 * thumbnail at all.
 *
 * `null` is deliberately distinct from a failed resolution: a missing thumbnail
 * means the table shows a neutral placeholder, whereas an unusable URL means a
 * broken one. Both render the same fallback, but only the first is a normal
 * state worth counting in metrics.
 */
export function resolveCategoryThumbnailUrl(
  thumbnail: CategoryThumbnail | null | undefined
): string | null {
  if (!thumbnail) return null;
  return resolveMediaUrl(thumbnail.url);
}

/**
 * The accessible description of a category thumbnail.
 *
 * Never empty: a category card image with an empty `alt` is announced as
 * unlabelled, which is worse than no image at all. Falls back to the category
 * name, which is what the backend does for a legacy record with no stored alt.
 */
export function categoryThumbnailAlt(
  thumbnail: CategoryThumbnail | null | undefined,
  categoryName: string
): string {
  const alt = thumbnail?.alt?.trim();
  return alt && alt.length > 0 ? alt : `${categoryName} category`;
}

/** True when the thumbnail's bytes are ours to delete at the provider. */
export function isManagedThumbnail(
  thumbnail: CategoryThumbnail | null | undefined
): boolean {
  return Boolean(thumbnail?.managed);
}

