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
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import type { UserRecord } from "../types";

interface ChangeRoleDialogProps {
  open: boolean;
  user: UserRecord | null;
  roleOptions: { value: string; label: string }[];
  isSubmitting: boolean;
  /** Self role changes are rejected by the backend - never allow selecting the current role for self. */
  currentUserId: string;
  onConfirm: (user: UserRecord, role: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function ChangeRoleDialog({
  open,
  user,
  roleOptions,
  isSubmitting,
  currentUserId,
  onConfirm,
  onOpenChange,
}: ChangeRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            {user?.id === currentUserId
              ? "You cannot change your own role from this screen."
              : `Assign a new role to @${user?.username ?? ""}. Permissions take effect on their next request.`}
          </DialogDescription>
        </DialogHeader>

        {open && user && (
          <ChangeRoleForm
            key={`change-role-${user.id}`}
            user={user}
            roleOptions={roleOptions}
            isSubmitting={isSubmitting}
            currentUserId={currentUserId}
            onConfirm={onConfirm}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ChangeRoleFormProps {
  user: UserRecord;
  roleOptions: { value: string; label: string }[];
  isSubmitting: boolean;
  currentUserId: string;
  onConfirm: (user: UserRecord, role: string) => void;
  onCancel: () => void;
}

// Mounted via a `key` from ChangeRoleDialog so the selected role always
// initializes from the current user (lint-safe alternative to setState-in-effect).
function ChangeRoleForm({
  user,
  roleOptions,
  isSubmitting,
  currentUserId,
  onConfirm,
  onCancel,
}: ChangeRoleFormProps) {
  const [role, setRole] = useState(user.role);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!role.trim()) {
      setFormError("Please choose a role.");
      return;
    }
    try {
      await onConfirm(user, role.trim().toLowerCase());
    } catch (err) {
      if (err instanceof ApiError && err.errors?.role?.length) {
        setFormError(err.errors.role[0]);
        return;
      }
      setFormError(err instanceof Error ? err.message : "Unable to change role.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          <span>{formError}</span>
        </div>
      )}

      <Select
        label="New role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        options={roleOptions}
        disabled={isSubmitting || user.id === currentUserId}
        required
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting || user.id === currentUserId}
        >
          Change role
        </Button>
      </DialogFooter>
    </form>
  );
}