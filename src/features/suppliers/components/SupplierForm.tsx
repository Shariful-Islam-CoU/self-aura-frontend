"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ApiError } from "@/lib/api";
import type { Supplier } from "../types";

export interface SupplierFormValues {
  name: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  notes: string;
}

interface SupplierFormErrors {
  name?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface SupplierFormProps {
  mode: "create" | "edit";
  supplier: Supplier | null;
  isSubmitting: boolean;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
  onCancel: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SupplierForm({
  mode,
  supplier,
  isSubmitting,
  onSubmit,
  onCancel,
}: SupplierFormProps) {
  const [values, setValues] = useState<SupplierFormValues>(() => ({
    name: supplier?.name ?? "",
    phone: supplier?.phone ?? "",
    alternatePhone: supplier?.alternatePhone ?? "",
    email: supplier?.email ?? "",
    address: supplier?.address ?? "",
    notes: supplier?.notes ?? "",
  }));
  const [errors, setErrors] = useState<SupplierFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = <K extends keyof SupplierFormValues>(
    field: K,
    value: string
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  // Mirrors the backend zod schema (name/phone required, optionals cleared by
  // the backend on create; address/notes can be cleared on update).
  const validate = (): boolean => {
    const next: SupplierFormErrors = {};

    if (!values.name.trim()) {
      next.name = "Name is required";
    } else if (values.name.trim().length > 100) {
      next.name = "Name must be at most 100 characters";
    }

    if (!values.phone.trim()) {
      next.phone = "Phone is required";
    } else if (values.phone.trim().length > 32) {
      next.phone = "Phone must be at most 32 characters";
    }

    if (values.alternatePhone.trim().length > 32) {
      next.alternatePhone = "Alternate phone must be at most 32 characters";
    }

    const email = values.email.trim();
    if (email && email.length > 200) {
      next.email = "Email must be at most 200 characters";
    } else if (email && !EMAIL_PATTERN.test(email)) {
      next.email = "Email must be a valid email address";
    }

    if (values.address.trim().length > 500) {
      next.address = "Address must be at most 500 characters";
    }

    if (values.notes.trim().length > 2000) {
      next.notes = "Notes must be at most 2000 characters";
    }

    setErrors(next);
    return Object.values(next).every((value) => value === undefined);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    try {
      await onSubmit({
        name: values.name.trim(),
        phone: values.phone.trim(),
        alternatePhone: values.alternatePhone.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        notes: values.notes.trim(),
      });
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const serverErrors = err.errors;
        setErrors({
          name: serverErrors.name?.[0],
          phone: serverErrors.phone?.[0],
          alternatePhone: serverErrors.alternatePhone?.[0],
          email: serverErrors.email?.[0],
          address: serverErrors.address?.[0],
          notes: serverErrors.notes?.[0],
        });
        return;
      }
      setFormError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            id="supplier-name"
            label="Name"
            required
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            error={errors.name}
            placeholder="Supplier name"
          />
        </div>
        <Input
          id="supplier-phone"
          label="Phone"
          required
          type="tel"
          value={values.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          error={errors.phone}
          placeholder="Primary phone"
        />
        <Input
          id="supplier-alternate-phone"
          label="Alternate phone"
          type="tel"
          value={values.alternatePhone}
          onChange={(event) => updateField("alternatePhone", event.target.value)}
          error={errors.alternatePhone}
          placeholder="Optional"
        />
        <div className="sm:col-span-2">
          <Input
            id="supplier-email"
            label="Email"
            type="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            error={errors.email}
            placeholder="supplier@example.com"
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            id="supplier-address"
            label="Address"
            value={values.address}
            onChange={(event) => updateField("address", event.target.value)}
            error={errors.address}
            rows={2}
            placeholder="Optional street/office address"
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            id="supplier-notes"
            label="Notes"
            value={values.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            error={errors.notes}
            rows={3}
            placeholder="Optional internal notes"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === "create" ? "Create supplier" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}