"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ProductImageFallback } from "./ProductImageFallback";

export interface ProductImageFrameProps {
  /** Raw URL from the API. Root-relative URLs are resolved by the caller. */
  src: string | null | undefined;
  /** Accessible description. Pass `""` for a decorative thumbnail. */
  alt: string;
  /** CSS aspect ratio for the reserved box, e.g. `"4 / 5"`. Reserves space. */
  aspectRatio?: string;
  /** Responsive `sizes` hint for `next/image`. Always pass one. */
  sizes: string;
  className?: string;
  imageClassName?: string;
  /** Above-the-fold images (first row of a grid) should be eager. */
  priority?: boolean;
  /** Fallback caption. */
  fallbackLabel?: string;
  /** Fixed square box (used by list thumbnails) instead of an aspect ratio. */
  rounded?: string;
}

/**
 * Image box with reserved space, a loading state and a styled fallback.
 *
 * Guarantees, for every product surface (table thumbnail, detail grid, image
 * manager preview):
 *   - no layout shift: the box is sized by `aspectRatio` before the bytes load
 *   - no raw broken-image glyph: a failed load swaps to `ProductImageFallback`
 *   - no empty box: a missing URL renders the same fallback
 *   - one code path, so every surface degrades identically
 */
export function ProductImageFrame({
  src,
  alt,
  aspectRatio,
  sizes,
  className,
  imageClassName,
  priority = false,
  fallbackLabel,
  rounded = "rounded-md",
}: ProductImageFrameProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">(
    src ? "loading" : "failed"
  );

  // A new `src` restarts the cycle; without this the previous "failed" state
  // would persist across a list refresh and hide a now-valid image.
  const [previousSrc, setPreviousSrc] = useState(src);
  if (previousSrc !== src) {
    setPreviousSrc(src);
    setStatus(src ? "loading" : "failed");
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-border bg-muted",
        rounded,
        className
      )}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {src && status !== "failed" ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("failed")}
            className={cn(
              "object-cover transition-opacity duration-300",
              status === "loaded" ? "opacity-100" : "opacity-0",
              imageClassName
            )}
          />
          {status === "loading" && (
            <div
              aria-hidden="true"
              className="absolute inset-0 animate-pulse bg-muted"
              data-testid="product-image-loading"
            />
          )}
        </>
      ) : (
        <ProductImageFallback label={fallbackLabel} />
      )}
    </div>
  );
}
