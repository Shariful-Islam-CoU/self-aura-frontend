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
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Portal } from "./Portal";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  titleId: string;
  descriptionId: string;
}

const DialogContext = createContext<DialogContextType | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within Dialog");
  }
  return context;
}

export interface DialogProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DialogRoot = ({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: DialogProps) => {
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
      // Trap Tab navigation inside the dialog while it is open.
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
    // Move initial focus into the dialog (first focusable, else the panel).
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
    <DialogContext.Provider value={{ open, setOpen, triggerRef, contentRef, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  );
};

export type DialogTriggerProps = HTMLAttributes<HTMLButtonElement> & { asChild?: boolean };

const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild = false, className, children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useDialogContext();

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
DialogTrigger.displayName = "DialogTrigger";

export type DialogContentProps = HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg" | "xl" | "full";
};

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, size = "md", ...props }, ref) => {
    const { open, setOpen, contentRef, triggerRef, titleId, descriptionId } = useDialogContext();

    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        // Portaled floating UI (combobox dropdowns, menus) lives outside the
        // dialog's DOM node by design, so a plain containment check would
        // treat a click on an option as a click on the backdrop and dismiss
        // the dialog mid-selection. Elements mark themselves with
        // data-dialog-portal to opt out.
        const inPortaledPopup =
          target instanceof Element &&
          target.closest("[data-dialog-portal]") !== null;
        if (inPortaledPopup) return;
        if (
          contentRef.current &&
          !contentRef.current.contains(target) &&
          !triggerRef.current?.contains(target)
        ) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, setOpen, contentRef, triggerRef]);

    // Reference the description only when one is actually rendered (all
    // current dialogs render DialogDescription, but a dangling
    // aria-describedby would otherwise point at a non-existent element).
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
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      full: "max-w-[90vw]",
    };

    if (!open) return null;

    return (
      <Portal>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
              "relative z-50 w-full max-h-[calc(100vh-4rem)] overflow-y-auto rounded-xl border border-border bg-elevated p-6 shadow-2xl outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
              sizes[size],
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-state={open ? "open" : "closed"}
            tabIndex={-1}
            {...props}
          >
            {children}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
      </Portal>
    );
  }
);
DialogContent.displayName = "DialogContent";

export type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;

const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
));
DialogHeader.displayName = "DialogHeader";

export type DialogTitleProps = HTMLAttributes<HTMLHeadingElement>;

const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(({ className, ...props }, ref) => {
  const { titleId } = useDialogContext();
  return <h2 ref={ref} id={titleId} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
});
DialogTitle.displayName = "DialogTitle";

export type DialogDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(({ className, ...props }, ref) => {
  const { descriptionId } = useDialogContext();
  return <p ref={ref} id={descriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />;
});
DialogDescription.displayName = "DialogDescription";

export type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}
      {...props}
    />
  )
);
DialogFooter.displayName = "DialogFooter";

export type DialogCloseProps = HTMLAttributes<HTMLButtonElement> & { asChild?: boolean };

const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ asChild = false, className, children, ...props }, ref) => {
    const { setOpen } = useDialogContext();

    const Comp = asChild ? "span" : "button";

    return (
      <Comp
        ref={ref}
        onClick={() => setOpen(false)}
        className={cn("mt-2 sm:mt-0", className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
DialogClose.displayName = "DialogClose";

export {
  DialogRoot as Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
};