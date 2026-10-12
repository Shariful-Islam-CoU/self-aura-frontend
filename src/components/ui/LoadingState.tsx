import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizes = {
      sm: "h-4 w-4 border-2",
      md: "h-6 w-6 border-2",
      lg: "h-8 w-8 border-3",
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn(
          "rounded-full border-primary border-t-transparent animate-spin",
          sizes[size],
          className
        )}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
LoadingSpinner.displayName = "LoadingSpinner";

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  text?: string;
}

const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, text = "Loading...", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col items-center justify-center gap-4 p-8 text-center", className)}
      {...props}
    >
      <LoadingSpinner size="md" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
);
LoadingState.displayName = "LoadingState";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "text", width, height, lines = 1, ...props }, ref) => {
    const baseStyle = "animate-pulse rounded bg-muted";

    if (variant === "circular") {
      return (
        <div
          ref={ref}
          className={cn(baseStyle, "rounded-full", className)}
          style={{ width, height, ...props.style }}
          {...props}
        />
      );
    }

    if (variant === "rectangular") {
      return (
        <div
          ref={ref}
          className={cn(baseStyle, className)}
          style={{ width, height, ...props.style }}
          {...props}
        />
      );
    }

    return (
      <div ref={ref} className={cn(className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseStyle, "h-4", i === lines - 1 && "w-3/4")}
            style={{
              width: i === lines - 1 ? "75%" : "100%",
              marginBottom: i === lines - 1 ? 0 : 8,
            }}
          />
        ))}
      </div>
    );
  }
);
Skeleton.displayName = "Skeleton";

export { LoadingSpinner, LoadingState, Skeleton };