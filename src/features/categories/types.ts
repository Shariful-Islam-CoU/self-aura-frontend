// Category types matching the backend API
// Backend: src/types/product.ts (CategoryResponse, CategoryThumbnailResponse)
// and validators/categoryValidators.ts

/**
 * A category thumbnail, as the management API returns it.
 *
 * `managed` is true only when this deployment owns the bytes in Cloudinary. A
 * thumbnail with `managed: false` is a record written before the migration or by
 * an external system: the dashboard can show and replace it, but replacing it
 * will not delete the old file, because the old file is not ours to delete.
 */
export interface CategoryThumbnail {
  /** Cloudinary delivery URL, or a legacy `/media/<key>` path. */
  url: string;
  alt?: string;
  publicId?: string;
  managed: boolean;
}

export interface CategoryBanner {
  url: string;
  alt?: string;
  publicId?: string;
  managed: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  /**
   * `null` when the category has no thumbnail.
   *
   * Explicit rather than omitted: the thumbnail control's state depends on it,
   * and "the field was dropped" and "there is no thumbnail" are different
   * things to get right.
   */
  thumbnail: CategoryThumbnail | null;
  banner?: CategoryBanner | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}