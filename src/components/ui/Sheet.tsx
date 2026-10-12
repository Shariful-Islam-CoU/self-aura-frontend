"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useCallback,
  ReactNode,
  forwardRef,
  HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { Portal } from "./Portal";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface SheetContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  titleId: string;
  descriptionId: string;
}

const SheetContext = createContext<SheetContextType | null>(null);

function useSheetContext() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within Sheet");
  }
  return context;
}

export interface SheetProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SheetRoot = ({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: SheetProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      if (isControlled) {
        onOpenChange?.(typeof value === "function" ? value(open) : value);
      } else {
        setUncontrolledOpen(value);
      }
    },
    [isControlled, onOpenChange, open, setUncontrolledOpen]
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      // Trap Tab navigation inside the sheet while it is open.
      if (e.key !== "Tab") return;
      const content = contentRef.current;
      if (!content) return;
      const focusables = Array.from(
        content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusables.length === 0) {
        e.preventDefault();
        content.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    // Move initial focus into the sheet (first focusable, else the panel).
    const content = contentRef.current;
    if (content) {
      const first = content.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? content).focus();
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, setOpen, triggerRef, contentRef]);

  return (
    <SheetContext.Provider value={{ open, setOpen, triggerRef, contentRef, titleId, descriptionId }}>
      {children}
    </SheetContext.Provider>
  );
};

export type SheetTriggerProps = HTMLAttributes<HTMLButtonElement> & { asChild?: boolean };

const SheetTrigger = forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ asChild = false, className, children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useSheetContext();

    const handleClick = () => setOpen(!open);

    const Comp = asChild ? "span" : "button";

    return (
      <Comp
        ref={(el) => {
          triggerRef.current = el as HTMLButtonElement;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el as HTMLButtonElement;
        }}
        onClick={handleClick}
        className={cn(className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
SheetTrigger.displayName = "SheetTrigger";

export type SheetContentProps = HTMLAttributes<HTMLDivElement> & {
  side?: "top" | "right" | "bottom" | "left";
  size?: "sm" | "md" | "lg" | "xl" | "full";
};

const SheetContent = forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, children, side = "right", size = "md", ...props }, ref) => {
    const { open, setOpen, contentRef, triggerRef, titleId, descriptionId } = useSheetContext();

    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(e.target as Node) &&
          !triggerRef.current?.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, setOpen, contentRef, triggerRef]);

    // Reference the description only when one is actually rendered.
    useEffect(() => {
      const el = contentRef.current;
      if (!el) return;
      const description = document.getElementById(descriptionId);
      if (description) {
        el.setAttribute("aria-describedby", descriptionId);
      } else {
        el.removeAttribute("aria-describedby");
      }
    }, [open, descriptionId, contentRef]);

    const sizes = {
      sm: side === "top" || side === "bottom" ? "h-[250px]" : "w-64",
      md: side === "top" || side === "bottom" ? "h-[350px]" : "w-80",
      lg: side === "top" || side === "bottom" ? "h-[500px]" : "w-[400px]",
      xl: side === "top" || side === "bottom" ? "h-[600px]" : "w-[500px]",
      full: side === "top" || side === "bottom" ? "h-[90vh]" : "w-[90vw]",
    };

    const sideStyles = {
      top: "top-0 left-0 right-0",
      right: "right-0 top-0 bottom-0",
      bottom: "bottom-0 left-0 right-0",
      left: "left-0 top-0 bottom-0",
    };

    const animations = {
      top: "data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
      right: "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
      bottom: "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
      left: "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
    };

    if (!open) return null;

    return (
      <Portal>
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            data-state={open ? "open" : "closed"}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={(el) => {
              contentRef.current = el;
              if (typeof ref === "function") ref(el);
              else if (ref) ref.current = el;
            }}
            className={cn(
              "fixed z-50 flex flex-col border border-border bg-elevated shadow-2xl outline-none",
              sideStyles[side],
              sizes[size],
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
              animations[side],
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-state={open ? "open" : "closed"}
            data-side={side}
            tabIndex={-1}
            {...props}
          >
            {children}
          </div>
        </div>
      </Portal>
    );
  }
);
SheetContent.displayName = "SheetContent";

export type SheetHeaderProps = HTMLAttributes<HTMLDivElement>;

const SheetHeader = forwardRef<HTMLDivElement, SheetHeaderProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-2 p-4", className)} {...props} />
));
SheetHeader.displayName = "SheetHeader";

export type SheetTitleProps = HTMLAttributes<HTMLHeadingElement>;

const SheetTitle = forwardRef<HTMLHeadingElement, SheetTitleProps>(({ className, ...props }, ref) => {
  const { titleId } = useSheetContext();
  return <h2 ref={ref} id={titleId} className={cn("text-lg font-semibold", className)} {...props} />;
});
SheetTitle.displayName = "SheetTitle";

export type SheetDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

const SheetDescription = forwardRef<HTMLParagraphElement, SheetDescriptionProps>(({ className, ...props }, ref) => {
  const { descriptionId } = useSheetContext();
  return <p ref={ref} id={descriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />;
});
SheetDescription.displayName = "SheetDescription";

export type SheetFooterProps = HTMLAttributes<HTMLDivElement>;

const SheetFooter = forwardRef<HTMLDivElement, SheetFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t border-border p-4", className)} {...props} />
  )
);
SheetFooter.displayName = "SheetFooter";

export type SheetCloseProps = HTMLAttributes<HTMLButtonElement> & { asChild?: boolean };

const SheetClose = forwardRef<HTMLButtonElement, SheetCloseProps>(
  ({ asChild = false, className, children, ...props }, ref) => {
    const { setOpen } = useSheetContext();

    const Comp = asChild ? "span" : "button";

    return (
      <Comp
        ref={ref}
        onClick={() => setOpen(false)}
        className={cn(className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
SheetClose.displayName = "SheetClose";

export {
  SheetRoot as Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
};