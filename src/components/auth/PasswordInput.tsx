/**
 * PasswordInput Component
 *
 * Password input with show/hide toggle
 */

import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  error?: string;
  label?: string;
}

/**
 * Password input with visibility toggle
 */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(
  (
    { className, error, label = "Mật khẩu", id = "password", ...props },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
        <div className="relative">
          <Input
            ref={ref}
            type={showPassword ? "text" : "password"}
            id={id}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            aria-label={label}
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            data-testid="login-password-input"
            className={cn(
              "h-12 px-4 pr-12 text-base",
              "border-gray-300 focus:border-brand-500 focus:ring-brand-500/20",
              error &&
                "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={toggleVisibility}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "text-gray-500 hover:text-gray-700",
              "focus:outline-none focus:ring-2 focus:ring-brand-500/20 rounded",
            )}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            data-testid="login-password-toggle"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {error && (
          <p
            id={`${id}-error`}
            className="text-sm text-red-600"
            role="alert"
            data-testid="login-password-error"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
