"use client";

import { createContext, useContext, useState, ReactNode, forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
  orientation: "horizontal" | "vertical";
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within Tabs");
  }
  return context;
}

export interface TabsProps {
  children: ReactNode;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

const TabsRoot = ({ children, defaultValue, value, onValueChange, orientation = "horizontal" }: TabsProps) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;
  const handleValueChange = isControlled ? onValueChange ?? (() => {}) : setUncontrolledValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, orientation }}>
      <div data-orientation={orientation}>{children}</div>
    </TabsContext.Provider>
  );
};

export type TabsListProps = HTMLAttributes<HTMLDivElement>;

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(({ className, children, ...props }, ref) => {
  const { orientation } = useTabsContext();

  // WAI-ARIA tabs pattern: arrow keys / Home / End move focus between the
  // tab triggers and activate the focused tab.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const triggers = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)'
      )
    );
    if (triggers.length === 0) return;

    const currentIndex = triggers.indexOf(document.activeElement as HTMLButtonElement);

    const activate = (index: number) => {
      const target = triggers[(index + triggers.length) % triggers.length];
      target.focus();
      target.click();
    };

    if (orientation === "vertical") {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        activate(currentIndex - 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        activate(currentIndex + 1);
      }
    } else {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        activate(currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        activate(currentIndex + 1);
      }
    }

    if (e.key === "Home") {
      e.preventDefault();
      activate(0 - currentIndex);
    } else if (e.key === "End") {
      e.preventDefault();
      activate(triggers.length - 1 - currentIndex);
    }
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
TabsList.displayName = "TabsList";

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    const { value: currentValue, onValueChange } = useTabsContext();
    const isActive = currentValue === value;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        aria-controls={`panel-${value}`}
        id={`tab-${value}`}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={() => !disabled && onValueChange(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-background text-foreground shadow-sm ring-1 ring-inset ring-border"
            : "hover:bg-accent hover:text-accent-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: currentValue } = useTabsContext();
    const isActive = currentValue === value;

    // Lazy mount: inactive panels render nothing, so heavy content inside a
    // tab only mounts once the tab is selected.
    if (!isActive) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`panel-${value}`}
        aria-labelledby={`tab-${value}`}
        tabIndex={0}
        className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { TabsRoot as Tabs, TabsList, TabsTrigger, TabsContent };