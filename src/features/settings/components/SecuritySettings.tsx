"use client";

// Security settings - change password. Uses the official backend endpoint
// POST /auth/change-password (all authenticated roles). Validation mirrors the
// backend passwordSchema (8-72 characters). Passwords are never logged, never
// stored locally, and only leave the browser in this request body.

import { useState } from "react";
import { SettingsSection } from "./SettingsSection";
import { settingsClient } from "../services/settingsService";
import { settingsErrorMessage } from "../utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): boolean => {
    const nextErrors: typeof errors = {};
    if (!currentPassword) nextErrors.currentPassword = "Current password is required.";
    if (!newPassword) {
      nextErrors.newPassword = "New password is required.";
    } else if (
      newPassword.length < MIN_PASSWORD_LENGTH ||
      newPassword.length > MAX_PASSWORD_LENGTH
    ) {
      nextErrors.newPassword = `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters.`;
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (newPassword && confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setSuccess(null);
    if (!validate() || saving) return;

    setSaving(true);
    try {
      await settingsClient.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      setSuccess("Your password has been changed.");
    } catch (err) {
      setSubmitError(settingsErrorMessage(err, "Unable to change the password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection title="Security" description="Change the password for your account.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={errors.currentPassword}
          disabled={saving}
          required
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={errors.newPassword}
          helperText={`Use ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters.`}
          disabled={saving}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
          disabled={saving}
          required
        />

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success"
          >
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}
        {submitError && (
          <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            disabled={saving || (!currentPassword && !newPassword && !confirmPassword)}
            isLoading={saving}
          >
            {saving ? "Changing..." : "Change password"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving || (!currentPassword && !newPassword && !confirmPassword)}
            onClick={() => {
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setErrors({});
              setSubmitError(null);
              setSuccess(null);
            }}
          >
            Clear
          </Button>
          <p className="text-xs text-muted-foreground">
            Your password is sent only to the official backend API and is never stored by the app.
          </p>
        </div>
      </form>
    </SettingsSection>
  );
}