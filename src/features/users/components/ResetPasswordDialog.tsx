"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import type { UserRecord } from "../types";

const MIN_PASSWORD_LENGTH = 6;

interface FieldErrors {
  newPassword?: string;
  confirmPassword?: string;
}

interface ResetPasswordDialogProps {
  open: boolean;
  user: UserRecord | null;
  isSubmitting: boolean;
  onConfirm: (user: UserRecord, newPassword: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({
  open,
  user,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: ResetPasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for @{user?.username ?? ""}. The user must use this
            password on their next sign-in.
          </DialogDescription>
        </DialogHeader>

        {open && user && (
          <ResetPasswordForm
            key={`reset-${user.id}`}
            user={user}
            isSubmitting={isSubmitting}
            onConfirm={onConfirm}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ResetPasswordFormProps {
  user: UserRecord;
  isSubmitting: boolean;
  onConfirm: (user: UserRecord, newPassword: string) => void;
  onCancel: () => void;
}

// Mounted via a `key` from ResetPasswordDialog so the fields always start
// empty (lint-safe alternative to setState-in-effect).
function ResetPasswordForm({ user, isSubmitting, onConfirm, onCancel }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors: FieldErrors = {};
    if (!newPassword) errors.newPassword = "Password is required";
    else if (newPassword.length < MIN_PASSWORD_LENGTH)
      errors.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    if (!confirmPassword) errors.confirmPassword = "Please confirm the password";
    else if (confirmPassword !== newPassword) errors.confirmPassword = "Passwords do not match";

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    try {
      await onConfirm(user, newPassword);
    } catch (err) {
      if (err instanceof ApiError && err.errors?.newPassword?.length) {
        setFieldErrors({ newPassword: err.errors.newPassword[0] });
        return;
      }
      setFormError(err instanceof Error ? err.message : "Unable to reset the password.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          <span>{formError}</span>
        </div>
      )}

      <Input
        label="New password"
        type="password"
        value={newPassword}
        onChange={(e) => {
          setNewPassword(e.target.value);
          setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
        }}
        error={fieldErrors.newPassword}
        disabled={isSubmitting}
        autoComplete="new-password"
        required
      />

      <Input
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
        }}
        error={fieldErrors.confirmPassword}
        disabled={isSubmitting}
        autoComplete="new-password"
        required
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          Reset password
        </Button>
      </DialogFooter>
    </form>
  );
}