/**
 * ChangePasswordForm Component
 *
 * Used for first-login / reset-required flows. Takes an access token (issued
 * by /auth/login when `requiresPasswordChange=true`) and submits the new
 * password via /auth/change-password-first.
 */

import * as React from "react";
import { Eye, EyeOff, Loader2, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useChangePasswordFirst,
  getChangePasswordErrorMessage,
} from "@/hooks/mutations/useChangePasswordFirst";
import {
  checkPasswordPolicy,
  isPasswordPolicyValid,
} from "@/lib/validation/auth";
import type { ChangePasswordFirstResponse } from "@/types/auth";

interface ChangePasswordFormProps {
  accessToken: string;
  onSuccess?: (data: ChangePasswordFirstResponse) => void;
  className?: string;
}

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  errors?: string[];
  autoComplete?: string;
  testId?: string;
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  disabled,
  errors,
  autoComplete = "new-password",
  testId,
}: PasswordFieldProps) {
  const [show, setShow] = React.useState(false);
  const hasError = !!errors && errors.length > 0;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        <span className="text-red-500">*</span> {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-label={label}
          aria-required="true"
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          data-testid={testId}
          className={cn(
            "h-12 px-4 pr-20 text-base",
            "border-gray-300 focus:border-brand-500 focus:ring-brand-500/20",
            hasError &&
              "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className={cn(
              "text-gray-500 hover:text-gray-700",
              "focus:outline-none focus:ring-2 focus:ring-brand-500/20 rounded",
            )}
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            tabIndex={-1}
          >
            {show ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
          {hasError && (
            <XCircle
              className="h-5 w-5 text-red-500"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      {hasError && (
        <div id={`${id}-error`} role="alert" className="space-y-0.5">
          {errors!.map((msg, i) => (
            <p key={i} className="text-sm text-red-600">
              {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChangePasswordForm({
  accessToken,
  onSuccess,
  className,
}: ChangePasswordFormProps) {
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [touchedNew, setTouchedNew] = React.useState(false);
  const [touchedConfirm, setTouchedConfirm] = React.useState(false);

  const checks = React.useMemo(
    () => checkPasswordPolicy(newPassword),
    [newPassword],
  );
  const policyValid = isPasswordPolicyValid(newPassword);
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const { mutate: changePassword, isPending } = useChangePasswordFirst({
    accessToken,
    onSuccess: (data) => {
      setApiError(null);
      toast.success(data.message || "Đổi mật khẩu thành công");
      onSuccess?.(data);
    },
    onError: (error) => {
      const msg = getChangePasswordErrorMessage(error);
      setApiError(msg);
      toast.error(msg);
    },
  });

  const newPasswordErrors = React.useMemo(() => {
    if (!touchedNew) return [];
    if (newPassword.length === 0) return ["Mật khẩu là bắt buộc"];
    const msgs: string[] = [];
    if (!checks.minLength) msgs.push("Mật khẩu phải có ít nhất 8 ký tự");
    if (!checks.hasLowercase || !checks.hasDigit || !checks.hasSpecial) {
      msgs.push("Mật khẩu phải chứa chữ thường, số và ký tự đặc biệt");
    }
    return msgs;
  }, [touchedNew, newPassword, checks]);

  const confirmPasswordErrors = React.useMemo(() => {
    if (!touchedConfirm) return [];
    if (confirmPassword.length === 0) return ["Mật khẩu là bắt buộc"];
    if (newPassword !== confirmPassword) return ["Mật khẩu không khớp"];
    return [];
  }, [touchedConfirm, confirmPassword, newPassword]);

  const isDisabled =
    isPending ||
    !newPassword ||
    !confirmPassword ||
    !policyValid ||
    !passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedNew(true);
    setTouchedConfirm(true);
    if (isDisabled) return;
    setApiError(null);
    changePassword({ newPassword, confirmPassword });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-5", className)}
      data-testid="change-password-form"
      noValidate
    >
      <PasswordField
        id="new-password"
        label="Mật khẩu mới"
        placeholder="Nhập mật khẩu mới"
        value={newPassword}
        onChange={(v) => {
          setNewPassword(v);
          if (!touchedNew) setTouchedNew(true);
        }}
        onBlur={() => setTouchedNew(true)}
        disabled={isPending}
        autoComplete="new-password"
        errors={newPasswordErrors}
        testId="change-password-new-input"
      />

      <PasswordField
        id="confirm-password"
        label="Xác nhận mật khẩu"
        placeholder="Xác nhận mật khẩu mới"
        value={confirmPassword}
        onChange={(v) => {
          setConfirmPassword(v);
          if (!touchedConfirm) setTouchedConfirm(true);
        }}
        onBlur={() => setTouchedConfirm(true)}
        disabled={isPending}
        autoComplete="new-password"
        errors={confirmPasswordErrors}
        testId="change-password-confirm-input"
      />

      {apiError && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-md p-3",
            "bg-red-50 border border-red-200 text-red-700",
          )}
          role="alert"
          data-testid="change-password-error"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{apiError}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isDisabled}
        className={cn(
          "w-full h-12 text-base font-semibold",
          "bg-brand-600 hover:bg-brand-700",
          "disabled:bg-brand-300 disabled:cursor-not-allowed",
        )}
        data-testid="change-password-submit-button"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          "Đặt mật khẩu"
        )}
      </Button>
    </form>
  );
}

export default ChangePasswordForm;
