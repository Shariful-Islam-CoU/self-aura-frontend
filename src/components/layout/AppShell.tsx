"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { PageContainer, PageContainerProps } from "./PageContainer";

interface AppShellProps {
  children: React.ReactNode;
  pageContainerProps?: Omit<PageContainerProps, "children">;
}

export function AppShell({ children, pageContainerProps }: AppShellProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize mounted state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Check mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load persisted collapse state on mount
  useEffect(() => {
    if (mounted) {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSidebarCollapsed(JSON.parse(stored));
      }
    }
  }, [mounted]);

  // Persist collapse state
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          <div className="w-64 border-r border-border bg-card" />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 border-b border-border bg-card" />
            <main className="flex-1 overflow-auto">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        />
      )}

      {/* Main content area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-200",
          !isMobile && sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <PageContainer {...pageContainerProps}>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}