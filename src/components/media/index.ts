/**
 * Shared product-media presentation components.
 *
 * Every surface that shows a product image (table thumbnail, details grid,
 * media manager preview) goes through `ProductImageFrame`, so a missing or
 * broken file always looks the same and never renders as a browser
 * broken-image glyph. `MediaUploadProgress` is the matching upload affordance.
 */
export { ProductImageFallback } from "./ProductImageFallback";
export type { ProductImageFallbackProps } from "./ProductImageFallback";
export { ProductImageFrame } from "./ProductImageFrame";
export type { ProductImageFrameProps } from "./ProductImageFrame";
export { MediaUploadProgress } from "./MediaUploadProgress";
export type { MediaUploadProgressProps } from "./MediaUploadProgress";
