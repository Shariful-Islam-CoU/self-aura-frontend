// Product types matching the backend API
// Backend: src/types/product.ts (ProductResponse, ProductListData),
// src/types/productImage.ts and src/config/media.ts

export interface ProductCategoryRef {
  id: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
}

/**
 * Canonical product image.
 *
 * The backend returns a densely ordered list where `sortOrder: 0` is the
 * primary image - there is no separate `isPrimary` flag, so the order and the
 * primary image can never disagree. `url` is a Cloudinary delivery URL (or, for
 * a record written by the previous local-filesystem adapter, a root-relative
 * `/media/<key>` path); use `resolveMediaUrl()` from `../lib/media` before
 * handing it to `next/image`.
 */
export interface ProductImage {
  url: string;
  alt: string;
  sortOrder: number;
}

/**
 * Canonical product video.
 *
 * `url` is always a Cloudinary MP4 delivery URL, so a MOV or WebM uploaded by
 * staff still plays in every browser. `thumbnailUrl` is a poster frame grabbed
 * from the video itself - the gallery needs it for layout stability and for the
 * "play" affordance, and it is what the grid uses instead of autoplaying.
 */
export interface ProductVideo {
  url: string;
  alt: string;
  sortOrder: number;
  /** Cloudinary-generated poster frame. Absent only for a legacy record. */
  thumbnailUrl?: string;
}

/**
 * Management-only view of an image: the same canonical fields plus the file
 * facts needed to manage the asset.
 *
 * `key` is the stable handle the media endpoints address an image by (use it to
 * reorder/retitle). `managed` is true when this deployment owns the file.
 * Never contains a filesystem path, an API key or a provider secret.
 */
export interface ManagedProductImage extends ProductImage {
  key: string;
  mimeType?: string;
  width?: number;
  height?: number;
  managed: boolean;
}

/** Management-only view of a video. `key` plays the same role as for an image. */
export interface ManagedProductVideo extends ProductVideo {
  key: string;
  mimeType?: string;
  /** Seconds, when the provider reported them. Used for the duration label. */
  duration?: number;
  managed: boolean;
}

/** Result of every `/products/:id/images` call. */
export interface ProductImagesResult {
  images: ManagedProductImage[];
  /** Present on upload only: the image that was just added. */
  image?: ManagedProductImage;
}

/** Result of every `/products/:id/videos` call. */
export interface ProductVideosResult {
  videos: ManagedProductVideo[];
  /** Present on upload only: the video that was just added. */
  video?: ManagedProductVideo;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  category: ProductCategoryRef;
  /** Ordered image list; `images[0]` is the primary image. */
  images: ProductImage[];
  /** Ordered video list. Always present on the backend; may be empty. */
  videos?: ProductVideo[];
  costPrice: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListData {
  items: Product[];
  pagination: ProductPagination;
}

/**
 * Media entry accepted when writing a product's image list.
 *
 * The backend also accepts a bare URL string for backward compatibility with
 * existing integrations, but the product form no longer sends images inline:
 * files are uploaded through the media endpoints, which validate the actual
 * bytes. See `productService.uploadProductImage`.
 */
export interface ProductImageInput {
  url: string;
  alt?: string;
}
export interface CreateProductInput {
  name: string;
  sku: string;
  description?: string;
  category: string;
  images?: ProductImageInput[];
  costPrice: number;
  sellingPrice: number;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  description?: string;
  category?: string;
  images?: ProductImageInput[];
  costPrice?: number;
  sellingPrice?: number;
  isActive?: boolean;
  lowStockThreshold?: number;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  sortBy?: "createdAt" | "name" | "sellingPrice" | "stock";
  sortOrder?: "asc" | "desc";
}

export type ProductSortBy = NonNullable<ProductListParams["sortBy"]>;
export type ProductSortOrder = NonNullable<ProductListParams["sortOrder"]>;