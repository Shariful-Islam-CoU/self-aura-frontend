import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductImageFallbackProps {
  /** Optional line under the icon, e.g. "No image yet". */
  label?: string;
  /** `decorative` hides the text from screen readers (purely visual). */
  className?: string;
}

/**
 * `font-label` is defined in the storefront's type scale. The management app uses
 * the same utility, but naming the fallback's own class here would couple the two
 * apps' design systems. The tracking/labels styling is inline for that reason.
 */

/**
 * Styled placeholder for a product image that is missing or failed to load.
 *
 * A broken image must never reach the user as a browser "broken image" glyph or
 * an empty box: this renders the Self Aura neutral surface (muted background +
 * hairline border + dashed inner frame) with a subtle icon, so an incomplete
 * catalogue still looks intentional in light and dark mode. Every colour comes
 * from theme tokens, so it follows the active theme without extra work.
 */
export function ProductImageFallback({
  label = "No image yet",
  className,
}: ProductImageFallbackProps) {
  return (
    <div
      // Purely decorative: the surrounding card/row already names the product.
      aria-hidden="true"
      data-testid="product-image-fallback"
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-1.5",
        "bg-muted text-muted-foreground",
        className
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          "border border-dashed border-muted-foreground/35 bg-background/60"
        )}
      >
        <ImageOff className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      </span>
      <span className="text-[11px] font-label uppercase tracking-[0.14em] opacity-80">
        {label}
      </span>
    </div>
  );
}
