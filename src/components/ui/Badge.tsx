import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "info" | "secondary" | "outline";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
      secondary: "bg-secondary text-secondary-foreground ring-1 ring-inset ring-border",
      destructive: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/25",
      outline: "text-foreground border border-border",
      success: "bg-success/10 text-success ring-1 ring-inset ring-success/25",
      warning: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/25",
      info: "bg-info/10 text-info ring-1 ring-inset ring-info/25",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };