"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigationConfig, isRouteActive, findNavItemByHref, sidebarIcons } from "@/constants/navigation";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/Breadcrumb";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "./UserMenu";
import { X } from "lucide-react";

export function Topbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Breadcrumb for the current page. Only exact navigation-config routes get a
  // crumb; dynamic detail routes (e.g. /orders/:id) intentionally hide it
  // rather than showing a raw/undecorated id segment.
  const crumb = findNavItemByHref(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <sidebarIcons.menu className="h-6 w-6" />
        </Button>

        {/* Breadcrumbs */}
        {crumb ? (
          <nav className="flex-1 hidden sm:block" aria-label="Breadcrumb">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </nav>
        ) : (
          <div className="flex-1 hidden sm:block" aria-hidden="true" />
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" size="lg">
          <div className="flex h-full flex-col">
            {/* Mobile header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo.jpg"
                  alt="Self Aura"
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <div>
                  <h1 className="text-sm font-semibold text-foreground">Self Aura</h1>
                  <span className="text-xs text-muted-foreground">Management</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Mobile navigation */}
            <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile navigation">
              {navigationConfig.map((group) => (
                <div key={group.groupLabel} className="mb-6">
                  <h2 className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.groupLabel}
                  </h2>
                  <ul className="space-y-1" role="list">
                    {group.items.map((item) => {
                      const isActive = isRouteActive(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "relative flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              isActive
                                ? "bg-primary/10 text-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {isActive && (
                              <span
                                className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-success"
                                aria-hidden="true"
                              />
                            )}
                            <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {/* Settings at bottom */}
              <div className="border-t border-border pt-3">
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isRouteActive(pathname, "/settings")
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  aria-current={isRouteActive(pathname, "/settings") ? "page" : undefined}
                >
                  {isRouteActive(pathname, "/settings") && (
                    <span
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-success"
                      aria-hidden="true"
                    />
                  )}
                  <sidebarIcons.settings className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>Settings</span>
                </Link>
              </div>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}