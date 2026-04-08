/**
 * LoginForm Component
 *
 * Main login form with validation and API integration
 */

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IdentifierInput } from "./IdentifierInput";
import { PasswordInput } from "./PasswordInput";
import { loginSchema, type LoginFormData } from "@/lib/validation/auth";
import { useLogin, getLoginErrorMessage } from "@/hooks/mutations/useLogin";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

/**
 * Login form with validation and API integration
 */
export function LoginForm({ onSuccess, className }: LoginFormProps) {
  const [apiError, setApiError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: import.meta.env.DEV
      ? {
          password: "Password123!",
        }
      : undefined,
  });

  const { mutate: login, isPending } = useLogin({
    onSuccess: () => {
      setApiError(null);
      onSuccess?.();
    },
    onError: (error) => {
      const errorMessage = getLoginErrorMessage(error);
      setApiError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setApiError(null);
    login({
      identifier: data.identifier,
      password: data.password,
    });
  };

  const isLoading = isPending || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-6", className)}
      data-testid="login-form"
      noValidate
    >
      {/* Identifier (Email) Input */}
      <IdentifierInput
        {...register("identifier")}
        error={errors.identifier?.message}
        disabled={isLoading}
      />

      {/* Password Input */}
      <PasswordInput
        {...register("password")}
        error={errors.password?.message}
        disabled={isLoading}
      />

      {/* API Error Message */}
      {apiError && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-md p-3",
            "bg-red-50 border border-red-200 text-red-700",
          )}
          role="alert"
          data-testid="login-error-message"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{apiError}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className={cn(
          "w-full h-12 text-base font-semibold",
          "bg-brand-600 hover:bg-brand-700",
          "disabled:bg-brand-300 disabled:cursor-not-allowed",
        )}
        data-testid="login-submit-button"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Đang đăng nhập...
          </>
        ) : (
          "Đăng nhập"
        )}
      </Button>

      {/* Links (disabled for v1.0) */}
      {/* <div className="text-center space-y-2 text-sm">
        <button
          type="button"
          disabled
          className="text-gray-400 cursor-not-allowed"
          data-testid="login-forgot-password-link"
        >
          Quên mật khẩu?
        </button>
        <p className="text-gray-400">
          Chưa có tài khoản?{" "}
          <button
            type="button"
            disabled
            className="text-gray-400 cursor-not-allowed"
            data-testid="login-register-link"
          >
            Đăng ký
          </button>
        </p>
      </div> */}
    </form>
  );
}

export default LoginForm;
