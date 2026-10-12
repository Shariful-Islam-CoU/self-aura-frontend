"use client";

// Settings save bar: dirty-state detection, save/cancel actions, saving state,
// and success/error feedback. Settings are never persisted optimistically - the
// parent only calls onSave when the user acts and updates state from the
// backend response.

import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface SettingsSaveBarProps {
  /** Whether the current draft differs from the last server state. */
  dirty: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  onSave: () => void;
  onReset: () => void;
  saveLabel?: string;
}

export function SettingsSaveBar({
  dirty,
  saving,
  error,
  success,
  onSave,
  onReset,
  saveLabel = "Save changes",
}: SettingsSaveBarProps) {
  const canSave = dirty && !saving;

  return (
    <div className="space-y-3">
      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success"
        >
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onSave} disabled={!canSave} isLoading={saving}>
          {saving ? "Saving..." : saveLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onReset} disabled={!dirty || saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}