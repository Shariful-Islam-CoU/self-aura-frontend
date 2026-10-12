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
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import type { PermissionRecord, CreatePermissionInput, UpdatePermissionInput } from "../types";

interface FieldErrors {
  key?: string;
  module?: string;
  label?: string;
  description?: string;
}

interface PermissionFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  permission: PermissionRecord | null;
  isSubmitting: boolean;
  onSubmit: (values: CreatePermissionInput | UpdatePermissionInput) => void;
  onOpenChange: (open: boolean) => void;
}

const KEY_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)?$/;

export function PermissionFormDialog({
  open,
  mode,
  permission,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: PermissionFormDialogProps) {
  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Create permission" : `Edit ${permission?.key ?? "permission"}`}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "New permission keys become grantable via role permission sets. System permissions are seeded and controlled by the backend."
              : "Custom permissions can be renamed, re-described or deactivated. System permission keys are fixed."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <PermissionForm
            key={isCreate ? "create" : `edit-${permission?.id ?? "none"}`}
            mode={mode}
            permission={isCreate ? null : permission}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface PermissionFormProps {
  mode: "create" | "edit";
  permission: PermissionRecord | null;
  isSubmitting: boolean;
  onSubmit: (values: CreatePermissionInput | UpdatePermissionInput) => void;
  onCancel: () => void;
}

// Mounted via a `key` from PermissionFormDialog so its state always initializes
// from the current target (lint-safe alternative to setState-in-effect).
function PermissionForm({ mode, permission, isSubmitting, onSubmit, onCancel }: PermissionFormProps) {
  const isCreate = mode === "create";
  const [key, setKey] = useState(permission?.key ?? "");
  const [module, setModule] = useState(permission?.module ?? "");
  const [label, setLabel] = useState(permission?.label ?? "");
  const [description, setDescription] = useState(permission?.description ?? "");
  const [isActive, setIsActive] = useState(permission?.isActive ?? true);

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // The key is fixed once created; module is derived from the key.
  const keyReadOnly = !isCreate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors: FieldErrors = {};
    if (isCreate) {
      if (!key.trim()) errors.key = "Key is required";
      else if (!KEY_PATTERN.test(key.trim()))
        errors.key = "Use lowercase letters, numbers and a single dot (module.action)";
      if (!module.trim()) errors.module = "Module is required";
      else if (!/^[a-z][a-z0-9]*$/.test(module.trim()))
        errors.module = "Use lowercase letters and numbers";
      if (!label.trim()) errors.label = "Label is required";
    } else {
      if (!label.trim()) errors.label = "Label is required";
    }
    if (description.length > 300) errors.description = "Description must be at most 300 characters";
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    try {
      if (isCreate) {
        await onSubmit({
          key: key.trim().toLowerCase(),
          module: module.trim().toLowerCase(),
          label: label.trim(),
          description: description.trim() || undefined,
        } satisfies CreatePermissionInput);
      } else {
        await onSubmit({
          label: label.trim(),
          description: description.trim() || undefined,
          isActive,
        } satisfies UpdatePermissionInput);
      }
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const next: FieldErrors = {};
        if (err.errors.key?.length) next.key = err.errors.key[0];
        if (err.errors.module?.length) next.module = err.errors.module[0];
        if (err.errors.label?.length) next.label = err.errors.label[0];
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
        label="Key"
        type="text"
        value={key}
        onChange={(e) => {
          setKey(e.target.value);
          setFieldErrors((prev) => ({ ...prev, key: undefined }));
        }}
        error={fieldErrors.key}
        helperText="Format: module.action, for example products.create"
        disabled={isSubmitting || keyReadOnly}
        required
      />

      <Input
        label="Module"
        type="text"
        value={module}
        onChange={(e) => {
          setModule(e.target.value);
          setFieldErrors((prev) => ({ ...prev, module: undefined }));
        }}
        error={fieldErrors.module}
        helperText="The feature area this permission belongs to (e.g. products)"
        disabled={isSubmitting || keyReadOnly}
        className="lowercase"
        required
      />

      <Input
        label="Label"
        type="text"
        value={label}
        onChange={(e) => {
          setLabel(e.target.value);
          setFieldErrors((prev) => ({ ...prev, label: undefined }));
        }}
        error={fieldErrors.label}
        placeholder="View products"
        disabled={isSubmitting}
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
        placeholder="What does this permission allow?"
        disabled={isSubmitting}
      />

      {!isCreate && (
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">
              Inactive permissions are no longer grantable and are stripped from roles.
            </p>
          </div>
          <Switch
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={isSubmitting}
          />
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {isCreate ? "Create permission" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}