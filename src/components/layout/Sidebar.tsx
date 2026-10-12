"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigationConfig, isRouteActive, sidebarIcons, canAccessNavItem } from "@/constants/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";

interface SidebarProps {
  isMobile?: boolean;
  isCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

function SidebarContent({
  pathname,
  isCollapsed,
  isMobile,
  onCollapseChange,
}: {
  pathname: string;
  isCollapsed: boolean;
  isMobile: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}) {
  const handleToggleCollapse = () => {
    onCollapseChange?.(!isCollapsed);
  };

  const { canAccess } = useAuth();
  // Permission-driven navigation (UX-only; the backend re-enforces every route).
  const visibleGroups = navigationConfig
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessNavItem(item, canAccess)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      {/* Brand Area */}
      <div className={cn("flex h-16 items-center justify-between px-4 border-b border-border", isCollapsed && "justify-center")}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/images/logo.jpg"
              alt="Self Aura"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">Self Aura</h1>
              <span className="text-xs text-muted-foreground truncate block">Management</span>
            </div>
          </div>
        )}
        {!isMobile && (
          <Tooltip content={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleCollapse}
              className="h-8 w-8"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <sidebarIcons.chevronRight className="h-4 w-4" /> : <sidebarIcons.chevronLeft className="h-4 w-4" />}
            </Button>
          </Tooltip>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
        {visibleGroups.map((group) => (
          <div key={group.groupLabel} className="mb-6">
            {!isCollapsed && (
              <h2 className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.groupLabel}
              </h2>
            )}
            <ul className="space-y-1" role="list">
              {group.items.map((item) => {
                const isActive = isRouteActive(pathname, item.href);
                const hasChildren = item.children && item.children.length > 0;

                if (isCollapsed) {
                  return (
                    <li key={item.href}>
                      <Tooltip content={item.label} side="right">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center mx-auto rounded-lg transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                          aria-current={isActive ? "page" : undefined}
                          aria-label={item.label}
                        >
                          <item.icon className="h-5 w-5" aria-hidden="true" />
                        </Link>
                      </Tooltip>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isActive
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-success"
                          aria-hidden="true"
                        />
                      )}
                      <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-muted rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {hasChildren && (
                        <span className="ml-auto" aria-hidden="true">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle sits at the bottom; Settings is only reachable from the
          nav groups above, so there is no duplicate link here. */}
      {!isCollapsed && (
        <div className="border-t border-border p-3">
          <p className="px-3 text-xs text-muted-foreground">
            Manage zones, payments and more under Settings.
          </p>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ isMobile = false, isCollapsed = false, onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-200",
          isCollapsed ? "w-16" : "w-64"
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col" />
      </aside>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={false} onOpenChange={() => {}}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open navigation menu">
            <sidebarIcons.menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" size="lg">
          <SidebarContent
            pathname={pathname}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            onCollapseChange={onCollapseChange}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-200",
        isCollapsed ? "w-16" : "w-64"
      )}
      aria-label="Main navigation"
    >
      <SidebarContent
        pathname={pathname}
        isCollapsed={isCollapsed}
        isMobile={isMobile}
        onCollapseChange={onCollapseChange}
      />
    </aside>
  );
}