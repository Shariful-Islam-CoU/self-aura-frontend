"use client";

import { forwardRef, useRef, useState, useEffect, HTMLAttributes, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Portal } from "./Portal";

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delay?: number;
  skipDelayDuration?: number;
}

// The tooltip renders through a Portal (document.body), so absolute
// positioning against the trigger wrapper would resolve against the body.
// Fixed coordinates computed from the trigger's bounding rect keep the
// tooltip attached to its trigger regardless of portal placement.
function computePosition(
  rect: DOMRect | undefined,
  side: NonNullable<TooltipProps["side"]>,
  align: NonNullable<TooltipProps["align"]>
): CSSProperties {
  const style: CSSProperties = { position: "fixed", zIndex: 50 };
  if (!rect) return style;
  const gap = 8;

  if (side === "top") style.top = rect.top - gap;
  else if (side === "bottom") style.top = rect.bottom + gap;
  else if (side === "left") style.left = rect.left - gap;
  else style.left = rect.right + gap;

  if (side === "top" || side === "bottom") {
    if (align === "start") {
      style.left = rect.left;
      style.transform = side === "top" ? "translateY(-100%)" : undefined;
    } else if (align === "end") {
      style.right = window.innerWidth - rect.right;
      style.transform = side === "top" ? "translateY(-100%)" : undefined;
    } else {
      style.left = rect.left + rect.width / 2;
      style.transform = side === "top" ? "translate(-50%, -100%)" : "translateX(-50%)";
    }
  } else {
    if (align === "start") {
      style.top = rect.top;
      style.transform = side === "left" ? "translateX(-100%)" : undefined;
    } else if (align === "end") {
      style.bottom = window.innerHeight - rect.bottom;
      style.transform = side === "left" ? "translateX(-100%)" : undefined;
    } else {
      style.top = rect.top + rect.height / 2;
      style.transform = side === "left" ? "translate(-100%, -50%)" : "translateY(-50%)";
    }
  }
  return style;
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, content, side = "top", align = "center", delay = 200, skipDelayDuration = 300, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastClosedAtRef = useRef(0);

    const open = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (delay > 0) {
        const reopensInstantly =
          Date.now() - lastClosedAtRef.current < skipDelayDuration;
        timeoutRef.current = setTimeout(() => setIsOpen(true), reopensInstantly ? 0 : delay);
      } else {
        setIsOpen(true);
      }
    };

    const close = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      lastClosedAtRef.current = Date.now();
      setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const attachRef = (el: HTMLDivElement | null) => {
      wrapperRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    };

    return (
      <div ref={attachRef} className="inline-block" {...props}>
        <div
          onMouseEnter={open}
          onMouseLeave={close}
          onFocus={open}
          onBlur={close}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {children}
        </div>

        {isOpen && (
          <Portal>
            <div
              ref={contentRef}
              style={computePosition(wrapperRef.current?.getBoundingClientRect(), side, align)}
              className={cn(
                "z-50 min-w-max max-w-xs px-2 py-1.5 text-xs font-medium text-popover-foreground bg-popover border border-border rounded-md shadow-lg",
                "animate-in fade-in-0 duration-200",
                className
              )}
              role="tooltip"
              data-state={isOpen ? "open" : "closed"}
            >
              {content}
            </div>
          </Portal>
        )}
      </div>
    );
  }
);

Tooltip.displayName = "Tooltip";

export { Tooltip };