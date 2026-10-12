"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

const maxWidthClasses = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[90rem]",
  "2xl": "max-w-[100rem]",
  full: "max-w-full",
};

const paddingClasses = {
  none: "",
  sm: "px-4 sm:px-6",
  md: "px-4 sm:px-6 lg:px-6",
  lg: "px-6 sm:px-8 lg:px-10",
};

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ children, maxWidth = "lg", padding = "md", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mx-auto w-full",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        "py-4 sm:py-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
PageContainer.displayName = "PageContainer";