"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
  forwardRef,
  HTMLAttributes,
  CSSProperties,
} from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Portal } from "./Portal";

interface DropdownMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  anchor: AnchorRect | null;
  setAnchor: (rect: AnchorRect | null) => void;
  subOpen: boolean;
  setSubOpen: (open: boolean) => void;
  subContentRef: React.RefObject<HTMLDivElement | null>;
  subTriggerRef: React.RefObject<HTMLDivElement | null>;
  subAnchor: AnchorRect | null;
  setSubAnchor: (rect: AnchorRect | null) => void;
}

// Serializable approximation of a DOMRect, captured in the event handler that
// opens a menu. Menu coordinates are state (not ref reads), so they are safe
// to use during render and survive the ref-during-render rules.
interface AnchorRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

function toAnchor(rect: DOMRect): AnchorRect {
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within DropdownMenu");
  }
  return context;
}

export interface DropdownMenuProps {
  children: ReactNode;
}

// Menus render through a Portal (document.body); absolute positioning would
// resolve against the body, so menus are placed with fixed pixel coordinates
// computed from the trigger's bounding rect at open time.
function computeMenuPosition(
  rect: AnchorRect | null,
  side: "top" | "right" | "bottom" | "left",
  align: "start" | "center" | "end",
  sideOffset: number
): CSSProperties {
  const style: CSSProperties = { position: "fixed", zIndex: 50 };
  if (!rect) return style;

  if (side === "top") style.top = rect.top - sideOffset;
  else if (side === "left") style.left = rect.left - sideOffset;
  else if (side === "right") style.left = rect.right + sideOffset;
  else style.top = rect.bottom + sideOffset;

  if (side === "top" || side === "bottom") {
    if (align === "end") style.right = window.innerWidth - rect.right;
    else if (align === "center") style.left = rect.left + rect.width / 2;
    else style.left = rect.left;
  } else {
    if (align === "end") style.bottom = window.innerHeight - rect.bottom;
    else if (align === "center") style.top = rect.top + rect.height / 2;
    else style.top = rect.top;
  }
  return style;
}

const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([data-disabled="true"])';

const DropdownMenuRoot = ({ children }: DropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const [subAnchor, setSubAnchor] = useState<AnchorRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const subTriggerRef = useRef<HTMLDivElement>(null);
  const subContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSubOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <DropdownMenuContext.Provider
      value={{
        open,
        setOpen,
        triggerRef,
        contentRef,
        anchor,
        setAnchor,
        subOpen,
        setSubOpen,
        subContentRef,
        subTriggerRef,
        subAnchor,
        setSubAnchor,
      }}
    >
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

export interface DropdownMenuTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild = false, className, children, ...props }, ref) => {
    const { open, setOpen, setSubOpen, setAnchor, triggerRef } = useDropdownMenuContext();

    const openFrom = (el: Element) => {
      setAnchor(toAnchor(el.getBoundingClientRect()));
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (open) setSubOpen(false);
      openFrom(e.currentTarget);
      setOpen(!open);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openFrom(e.currentTarget);
        setOpen(true);
      }
    };

    const Comp = asChild ? "span" : "button";

    return (
      <Comp
        ref={(el) => {
          triggerRef.current = el as HTMLButtonElement;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el as HTMLButtonElement;
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn("inline-flex items-center justify-center", className)}
        aria-haspopup="menu"
        aria-expanded={open}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, children, align = "start", side = "bottom", sideOffset = 4, ...props }, ref) => {
    const { open, setOpen, setSubOpen, contentRef, triggerRef, anchor } = useDropdownMenuContext();

    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(e.target as Node) &&
          !triggerRef.current?.contains(e.target as Node)
        ) {
          setOpen(false);
          setSubOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      // Move focus into the menu for keyboard users.
      const first = contentRef.current?.querySelector<HTMLElement>(MENU_ITEM_SELECTOR);
      first?.focus();
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, setOpen, setSubOpen, contentRef, triggerRef]);

    if (!open) return null;

    const position = computeMenuPosition(anchor, side, align, sideOffset);

    // Arrow / Home / End keys move focus between menu items (WAI-ARIA menu).
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const items = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)
      );
      if (items.length === 0) return;
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(currentIndex + 1) % items.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    };

    return (
      <Portal>
        <div
          ref={(el) => {
            contentRef.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          style={position}
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
          )}
          role="menu"
          data-state={open ? "open" : "closed"}
          data-side={side}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </div>
      </Portal>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

export interface DropdownMenuItemProps extends HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  inset?: boolean;
  onSelect?: () => void;
}

const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, disabled, inset, children, onClick, onSelect, ...props }, ref) => {
    const { setOpen, setSubOpen } = useDropdownMenuContext();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      setOpen(false);
      setSubOpen(false);
      onSelect?.();
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === "Enter" || e.key === " ") && !disabled) {
        e.preventDefault();
        setOpen(false);
        setSubOpen(false);
        onSelect?.();
        onClick?.(undefined as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };

    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        data-disabled={disabled || undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
          "transition-colors focus:bg-accent focus:text-accent-foreground",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          inset && "pl-8",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export interface DropdownMenuLabelProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

const DropdownMenuLabel = forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
      {...props}
    />
  )
);
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export type DropdownMenuSeparatorProps = HTMLAttributes<HTMLDivElement>;

const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export type DropdownMenuShortcutProps = HTMLAttributes<HTMLSpanElement>;

const DropdownMenuShortcut = forwardRef<HTMLSpanElement, DropdownMenuShortcutProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export type DropdownMenuGroupProps = HTMLAttributes<HTMLDivElement>;

const DropdownMenuGroup = forwardRef<HTMLDivElement, DropdownMenuGroupProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  )
);
DropdownMenuGroup.displayName = "DropdownMenuGroup";

export interface DropdownMenuSubProps {
  children: ReactNode;
}

const DropdownMenuSub = ({ children }: DropdownMenuSubProps) => {
  return <div>{children}</div>;
};
DropdownMenuSub.displayName = "DropdownMenuSub";

export interface DropdownMenuSubTriggerProps extends HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  inset?: boolean;
}

const DropdownMenuSubTrigger = forwardRef<HTMLDivElement, DropdownMenuSubTriggerProps>(
  ({ className, disabled, inset, children, ...props }, ref) => {
    const { subOpen, setSubOpen, setSubAnchor, subTriggerRef } = useDropdownMenuContext();

    const handleOpen = (e: React.MouseEvent | React.KeyboardEvent) => {
      if (disabled) return;
      setSubAnchor(toAnchor(e.currentTarget.getBoundingClientRect()));
      setSubOpen(true);
    };

    return (
      <div
        ref={(el) => {
          subTriggerRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        data-disabled={disabled || undefined}
        aria-haspopup="menu"
        aria-expanded={subOpen}
        onMouseEnter={handleOpen}
        onMouseLeave={() => setSubOpen(false)}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " " || e.key === "ArrowRight") && !disabled) {
            e.preventDefault();
            setSubAnchor(toAnchor(e.currentTarget.getBoundingClientRect()));
            setSubOpen(true);
          }
          if (e.key === "ArrowLeft") {
            setSubOpen(false);
          }
        }}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
          "transition-colors focus:bg-accent focus:text-accent-foreground",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          inset && "pl-8",
          className
        )}
        {...props}
      >
        {children}
        <ChevronRight className="ml-auto h-4 w-4" />
      </div>
    );
  }
);
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

export interface DropdownMenuSubContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

const DropdownMenuSubContent = forwardRef<HTMLDivElement, DropdownMenuSubContentProps>(
  ({ className, children, align = "end", side = "right", sideOffset = 4, ...props }, ref) => {
    const { subOpen, setSubOpen, subContentRef, subTriggerRef, subAnchor } = useDropdownMenuContext();

    useEffect(() => {
      if (!subOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (
          subContentRef.current &&
          !subContentRef.current.contains(e.target as Node) &&
          !subTriggerRef.current?.contains(e.target as Node)
        ) {
          setSubOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [subOpen, setSubOpen, subContentRef, subTriggerRef]);

    if (!subOpen) return null;

    const position = computeMenuPosition(subAnchor, side, align, sideOffset);

    return (
      <Portal>
        <div
          ref={(el) => {
            subContentRef.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          style={position}
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
          )}
          role="menu"
          data-state={subOpen ? "open" : "closed"}
          data-side={side}
          {...props}
        >
          {children}
        </div>
      </Portal>
    );
  }
);
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export {
  DropdownMenuRoot as DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};