"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Simple switch implementation without @radix-ui/react-switch
const Switch = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, checked = false, onCheckedChange, ...props }, ref) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={cn(
      "peer switch",
      className
    )}
    data-state={checked ? "checked" : "unchecked"}
    onClick={() => onCheckedChange?.(!checked)}
    {...props}
    ref={ref}
  >
    <div
      className={cn(
        "switch-thumb"
      )}
    />
  </button>
));
Switch.displayName = "Switch";

export { Switch }; 