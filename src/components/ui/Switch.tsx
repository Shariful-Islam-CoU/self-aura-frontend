"use client";

import { forwardRef, useState, InputHTMLAttributes, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, disabled, required, checked, defaultChecked = false, onChange, ...props }, ref) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const isControlled = checked !== undefined;
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
    const isChecked = isControlled ? checked : uncontrolledChecked;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setUncontrolledChecked(e.target.checked);
      onChange?.(e);
    };

    return (
      <div className="flex items-center gap-3">
        <div className="relative inline-flex items-center">
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
            className={cn(
              "peer h-6 w-11 shrink-0 rounded-full border border-input",
              "bg-secondary",
              "after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-background after:shadow-sm after:transition-transform",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
              "data-[state=checked]:after:translate-x-full",
              className
            )}
            {...props}
          />
        </div>
        {label && (
          <label
            htmlFor={switchId}
            className={cn(
              "text-sm font-label text-foreground cursor-pointer select-none",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          </label>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };