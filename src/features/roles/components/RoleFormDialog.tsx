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
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import type { RoleRecord, CreateRoleInput, UpdateRoleInput } from "../types";

interface FieldErrors {
  name?: string;
  description?: string;
}

interface RoleFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  role: RoleRecord | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateRoleInput | UpdateRoleInput) => void;
  onOpenChange: (open: boolean) => void;
}

export function RoleFormDialog({
  open,
  mode,
  role,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: RoleFormDialogProps) {
  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Create role" : `Edit ${role?.name ?? "role"}`}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Custom roles hold a permission key set. Permission sets are edited on the Permissions screen."
              : "System roles are shown for reference; only the description can change here, permission sets are managed separately."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <RoleForm
            key={isCreate ? "create" : `edit-${role?.id ?? "none"}`}
            mode={mode}
            role={isCreate ? null : role}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface RoleFormProps {
  mode: "create" | "edit";
  role: RoleRecord | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateRoleInput | UpdateRoleInput) => void;
  onCancel: () => void;
}

// Mounted via a `key` from RoleFormDialog so its state always initializes from
// the current target (lint-safe alternative to setState-in-effect).
function RoleForm({ mode, role, isSubmitting, onSubmit, onCancel }: RoleFormProps) {
  const isCreate = mode === "create";
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // System roles cannot be renamed - the name field is read-only in edit mode.
  const nameReadOnly = !isCreate && (role?.isSystem ?? false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors: FieldErrors = {};
    if (isCreate || !nameReadOnly) {
      const trimmed = name.trim();
      if (!trimmed) errors.name = "Role name is required";
      else if (!/^[a-z][a-z0-9_-]*$/.test(trimmed))
        errors.name = "Use lowercase letters, numbers, underscores and hyphens";
      else if (trimmed === "owner")
        errors.name = '"owner" is a reserved role name';
    }
    if (description.length > 300) errors.description = "Description must be at most 300 characters";
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    try {
      if (isCreate) {
        await onSubmit({
          name: name.trim().toLowerCase(),
          description: description.trim() || undefined,
        } satisfies CreateRoleInput);
      } else {
        await onSubmit({
          name: !nameReadOnly ? name.trim().toLowerCase() : undefined,
          description: description.trim() || undefined,
        } satisfies UpdateRoleInput);
      }
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const next: FieldErrors = {};
        if (err.errors.name?.length) next.name = err.errors.name[0];
        if (err.errors.description?.length) next.description = err.errors.description[0];
        setFieldErrors(next);
        if (Object.values(next).some(Boolean)) return;
      }
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
        label="Role name"
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setFieldErrors((prev) => ({ ...prev, name: undefined }));
        }}
        error={fieldErrors.name}
        helperText={nameReadOnly ? "System role names are fixed." : "Lowercase letters, numbers, underscores and hyphens."}
        disabled={isSubmitting || nameReadOnly}
        required
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          setFieldErrors((prev) => ({ ...prev, description: undefined }));
        }}
        error={fieldErrors.description}
        rows={3}
        maxLength={300}
        placeholder="What is this role responsible for?"
        disabled={isSubmitting}
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {isCreate ? "Create role" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}