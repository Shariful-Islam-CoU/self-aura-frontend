"use client";

import { forwardRef, useState, InputHTMLAttributes, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  labelPosition?: "right" | "left";
  showLabels?: boolean;
}

const sizeStyles = {
  sm: {
    track: "h-5 w-10",
    thumb: "h-4 w-4",
    translate: "data-[state=checked]:translate-x-5",
    label: "text-[10px]",
  },
  md: {
    track: "h-6 w-12",
    thumb: "h-5 w-5",
    translate: "data-[state=checked]:translate-x-6",
    label: "text-xs",
  },
  lg: {
    track: "h-7 w-14",
    thumb: "h-6 w-6",
    translate: "data-[state=checked]:translate-x-7",
    label: "text-sm",
  },
};

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      label,
      description,
      size = "md",
      labelPosition = "right",
      showLabels = true,
      id,
      disabled,
      required,
      checked,
      defaultChecked = false,
      onChange,
      ...props
    },
    ref
  ) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const isControlled = checked !== undefined;
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
    const isChecked = isControlled ? checked : uncontrolledChecked;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setUncontrolledChecked(e.target.checked);
      onChange?.(e);
    };

    const sizes = sizeStyles[size];

    return (
      <div
        className={cn(
          "flex items-center gap-3",
          labelPosition === "left" && "flex-row-reverse"
        )}
      >
        {/* The entire switch area is a clickable label that wraps the input */}
        <label
          htmlFor={switchId}
          className={cn(
            "relative inline-flex flex-shrink-0 cursor-pointer select-none",
            disabled && "opacity-40 cursor-not-allowed"
          )}
          aria-disabled={disabled}
        >
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={switchId}
            disabled={disabled}
            required={required}
            checked={isControlled ? checked : undefined}
            defaultChecked={!isControlled ? defaultChecked : undefined}
            onChange={handleChange}
            data-state={isChecked ? "checked" : "unchecked"}
            className="peer appearance-none absolute inset-0 opacity-0 cursor-pointer"
            {...props}
          />
          
          {/* Track with ON/OFF labels - this is the visual switch */}
          <div
            className={cn(
              "relative flex items-center rounded-full border-2 transition-all duration-300 ease-out",
              "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-40",
              sizes.track,
              isChecked
                ? "bg-primary border-primary"
                : "bg-muted border-border"
            )}
            aria-hidden="true"
          >
            {/* ON label (shown when checked) */}
            {showLabels && (
              <span
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 px-1.5 font-medium transition-all duration-200",
                  "peer-data-[state=checked]:opacity-100 peer-data-[state=checked]:translate-x-0",
                  "opacity-0 -translate-x-1 pointer-events-none",
                  sizes.label,
                  "text-white"
                )}
              >
                ON
              </span>
            )}

            {/* OFF label (shown when unchecked) */}
            {showLabels && (
              <span
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 px-1.5 font-medium transition-all duration-200",
                  "peer-data-[state=unchecked]:opacity-100 peer-data-[state=unchecked]:translate-x-0",
                  "opacity-0 translate-x-1 pointer-events-none",
                  sizes.label,
                  "text-muted-foreground"
                )}
              >
                OFF
              </span>
            )}

            {/* Thumb */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 left-0.5 bg-white rounded-full shadow-lg transition-all duration-300 ease-out",
                "peer-data-[state=checked]:translate-x-full",
                sizes.thumb,
                "after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-inherit"
              )}
              aria-hidden="true"
            />
          </div>
        </label>

        {(label || description) && (
          <label
            htmlFor={switchId}
            className={cn(
              "font-medium text-foreground cursor-pointer select-none",
              "transition-colors duration-200",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label && <span className="block text-sm">{label}</span>}
            {description && (
              <span className="block text-xs text-muted-foreground mt-0.5 font-normal">
                {description}
              </span>
            )}
            {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          </label>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };