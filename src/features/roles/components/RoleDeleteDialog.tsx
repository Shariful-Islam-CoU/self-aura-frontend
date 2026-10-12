"use client";

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
import { useState } from "react";
import type { RoleRecord } from "../types";

interface RoleDeleteDialogProps {
  open: boolean;
  role: RoleRecord | null;
  isSubmitting: boolean;
  onConfirm: (role: RoleRecord) => void;
  onOpenChange: (open: boolean) => void;
}

export function RoleDeleteDialog({
  open,
  role,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: RoleDeleteDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setFormError(null);
    if (!role) return;
    try {
      await onConfirm(role);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to delete the role.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete role</DialogTitle>
          <DialogDescription>
            Delete the custom role <span className="font-medium text-foreground">{role?.name ?? ""}</span>?
            Roles assigned to users or roles whose permissions are in use cannot
            be deleted. This cannot be undone.
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
            Delete role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}