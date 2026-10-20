import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  /** Avatar image URL */
  src?: string | null;
  /** Fallback name for initials */
  name?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Additional CSS classes */
  className?: string;
  /** Alt text for the image */
  alt?: string;
}

/**
 * Avatar component with image fallback to initials.
 * Supports multiple sizes and handles loading/error states gracefully.
 */
export function Avatar({
  src,
  name,
  size = "md",
  className,
  alt,
}: AvatarProps) {
  const sizeClasses = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl",
  };

  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = name ? getInitials(name) : "?";

  if (!src) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium select-none",
          sizeClasses[size],
          className
        )}
        aria-label={name ? `${name}'s avatar` : "User avatar"}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <div className={cn("rounded-full overflow-hidden", sizeClasses[size])}>
        <Image
          src={src}
          alt={alt || (name ? `${name}'s avatar` : "User avatar")}
          fill
          className="object-cover"
          sizes={size === "xl" ? "64px" : size === "lg" ? "48px" : size === "md" ? "40px" : size === "sm" ? "32px" : "24px"}
        />
      </div>
    </div>
  );
}