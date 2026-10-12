"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { ApiError } from "@/lib/api";
import type { Category, CreateCategoryInput } from "../types";

interface CategoryFormValues {
  name: string;
  description: string;
  isActive: boolean;
}

interface CategoryFormProps {
  initialValues?: Category | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateCategoryInput & { isActive?: boolean }) => Promise<Category>;
  onCancel: () => void;
  /**
   * Slot for the thumbnail control, injected by `CategoryDialog` rather than
   * hard-coded here, so this form stays about the category record. In edit mode
   * the slot holds the manager bound to this category; in create mode the dialog
   * shows it once the category has an id (see CategoryDialog).
   */
  children?: ReactNode;
}

interface FieldErrors {
  name?: string;
  description?: string;
}

export function CategoryForm({
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
  children,
}: CategoryFormProps) {
  const [values, setValues] = useState<CategoryFormValues>({
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    isActive: initialValues?.isActive ?? true,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (
    field: keyof CategoryFormValues,
    value: string | boolean
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const name = values.name.trim();
    if (!name) {
      errors.name = "Category name is required";
    } else if (name.length > 100) {
      errors.name = "Category name must be at most 100 characters";
    }
    if (values.description.length > 500) {
      errors.description = "Description must be at most 500 characters";
    }
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const errors = validate();
    if (errors.name || errors.description) {
      setFieldErrors(errors);
      return;
    }

    const payload: CreateCategoryInput & { isActive?: boolean } = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
    };
    if (initialValues) {
      payload.isActive = values.isActive;
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const nextErrors: FieldErrors = {};
        if (err.errors.name) nextErrors.name = err.errors.name[0];
        if (err.errors.description) nextErrors.description = err.errors.description[0];
        setFieldErrors(nextErrors);
        if (err.errors.name || err.errors.description) return;
      }
      setFormError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <Input
        id="category-name"
        label="Category name"
        required
        value={values.name}
        onChange={(event) => handleChange("name", event.target.value)}
        error={fieldErrors.name}
        placeholder="e.g. Sarees"
        autoFocus
      />

      <Textarea
        id="category-description"
        label="Description"
        value={values.description}
        onChange={(event) => handleChange("description", event.target.value)}
        error={fieldErrors.description}
        placeholder="Optional short description of the category"
        rows={3}
      />

      {initialValues && (
        <Select
          id="category-status"
          label="Status"
          value={values.isActive ? "true" : "false"}
          onChange={(event) => handleChange("isActive", event.target.value === "true")}
          options={[
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
      )}

      {children}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initialValues ? "Save changes" : "Create category"}
        </Button>
      </div>
    </form>
  );
}