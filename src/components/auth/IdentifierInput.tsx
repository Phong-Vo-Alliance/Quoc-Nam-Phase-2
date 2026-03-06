/**
 * IdentifierInput Component
 *
 * Username/Account input component with flexible design for future changes
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IDENTIFIER_LABELS, IDENTIFIER_TYPE } from "@/types/auth";
import { cn } from "@/lib/utils";

interface IdentifierInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  error?: string;
}

const labels = IDENTIFIER_LABELS[IDENTIFIER_TYPE];

/**
 * Identifier input - currently configured for username (text input)
 * Can be changed to email or phone by updating IDENTIFIER_TYPE
 */
export const IdentifierInput = React.forwardRef<
  HTMLInputElement,
  IdentifierInputProps
>(({ className, error, id = "identifier", ...props }, ref) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {labels.label}
      </Label>
      <Input
        ref={ref}
        type="text"
        id={id}
        placeholder={labels.placeholder}
        autoComplete="username"
        aria-label={labels.label}
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        data-testid="login-identifier-input"
        className={cn(
          "h-12 px-4 text-base",
          "border-gray-300 focus:border-brand-500 focus:ring-brand-500/20",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className,
        )}
        {...props}
      />
      {error && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-600"
          role="alert"
          data-testid="login-identifier-error"
        >
          {error}
        </p>
      )}
    </div>
  );
});

IdentifierInput.displayName = "IdentifierInput";

export default IdentifierInput;
