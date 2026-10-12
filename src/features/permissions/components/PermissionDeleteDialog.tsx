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
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import type { PermissionRecord } from "../types";

interface PermissionDeleteDialogProps {
  open: boolean;
  permission: PermissionRecord | null;
  isSubmitting: boolean;
  onConfirm: (permission: PermissionRecord) => void;
  onOpenChange: (open: boolean) => void;
}

export function PermissionDeleteDialog({
  open,
  permission,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: PermissionDeleteDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setFormError(null);
    if (!permission) return;
    try {
      await onConfirm(permission);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to delete the permission.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete permission</DialogTitle>
          <DialogDescription>
            Delete the custom permission{" "}
            <span className="font-mono font-medium text-foreground">{permission?.key ?? ""}</span>?
            Permissions currently granted to a role cannot be deleted. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            <span>{formError}</span>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Delete permission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}