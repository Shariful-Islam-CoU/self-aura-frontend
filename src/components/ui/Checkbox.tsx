"use client";

import { forwardRef, useState, InputHTMLAttributes, ChangeEvent } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, disabled, required, checked, defaultChecked = false, onChange, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const isControlled = checked !== undefined;
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
    const isChecked = isControlled ? checked : uncontrolledChecked;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setUncontrolledChecked(e.target.checked);
      onChange?.(e);
    };

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            required={required}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={handleChange}
            data-state={isChecked ? "checked" : "unchecked"}
            className={cn(
              "peer h-4 w-4 shrink-0 rounded-sm border border-input",
              "bg-elevated text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors",
              "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
              className
            )}
            {...props}
          />
          <Check
            className={cn(
              "absolute h-3.5 w-3.5 text-primary-foreground",
              "opacity-0 scale-50 peer-data-[state=checked]:opacity-100 peer-data-[state=checked]:scale-100",
              "transition-all"
            )}
            aria-hidden="true"
          />
        </div>
        {label && (
          <label
            htmlFor={checkboxId}
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

Checkbox.displayName = "Checkbox";

export { Checkbox };