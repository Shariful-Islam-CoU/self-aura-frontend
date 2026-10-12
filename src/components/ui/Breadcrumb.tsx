"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const Breadcrumb = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn("flex items-center gap-1.5 overflow-x-auto text-sm", className)}
      aria-label="Breadcrumb"
      {...props}
    >
      {children}
    </nav>
  )
);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = forwardRef<HTMLOListElement, HTMLAttributes<HTMLOListElement>>(
  ({ className, children, ...props }, ref) => (
    <ol ref={ref} className={cn("flex items-center gap-1.5", className)} {...props}>
      {children}
    </ol>
  )
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  ({ className, children, ...props }, ref) => (
    <li ref={ref} className={cn("flex items-center gap-1.5", className)} {...props}>
      {children}
    </li>
  )
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = forwardRef<HTMLAnchorElement, HTMLAttributes<HTMLAnchorElement> & { href: string }>(
  ({ className, children, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        "font-medium text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
);
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-current="page"
      className={cn("font-medium text-foreground truncate", className)}
      {...props}
    >
      {children}
    </span>
  )
);
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("flex items-center gap-1.5 text-muted-foreground", className)} {...props}>
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </li>
  )
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator };