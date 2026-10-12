"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { ApiError } from "@/lib/api";
import { Package } from "lucide-react";
import type { Category } from "@/features/categories/types";
import type { CreateProductInput, Product } from "../types";

const SKU_PATTERN = /^[a-zA-Z0-9-]+$/;

interface ProductFormValues {
  name: string;
  sku: string;
  category: string;
  description: string;
  costPrice: string;
  sellingPrice: string;
  isActive: boolean;
}

interface FieldErrors {
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
  costPrice?: string;
  sellingPrice?: string;
  images?: string;
}

interface ProductFormProps {
  initialValues?: Product | null;
  categories: Category[];
  isSubmitting: boolean;
  onSubmit: (values: CreateProductInput) => Promise<Product>;
  onCancel: () => void;
  /** Rendered after the scalar fields. Used for the product image manager. */
  children?: React.ReactNode;
}

export function ProductForm({
  initialValues,
  categories,
  isSubmitting,
  onSubmit,
  onCancel,
  children,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: initialValues?.name ?? "",
    sku: initialValues?.sku ?? "",
    category: initialValues?.category.id ?? "",
    description: initialValues?.description ?? "",
    costPrice: initialValues ? String(initialValues.costPrice) : "",
    sellingPrice: initialValues ? String(initialValues.sellingPrice) : "",
    isActive: initialValues?.isActive ?? true,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const activeCategories = categories.filter((category) => category.isActive);

  const updateField = <K extends keyof ProductFormValues>(
    field: K,
    value: ProductFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const parsePrice = (raw: string): number | null => {
    if (raw.trim() === "") return null;
    const value = Number(raw);
    if (!Number.isFinite(value)) return null;
    return value;
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const name = values.name.trim();
    const sku = values.sku.trim();

    if (!name) {
      errors.name = "Product name is required";
    } else if (name.length > 200) {
      errors.name = "Product name must be at most 200 characters";
    }

    if (!sku) {
      errors.sku = "SKU is required";
    } else if (sku.length > 50) {
      errors.sku = "SKU must be at most 50 characters";
    } else if (!SKU_PATTERN.test(sku)) {
      errors.sku = "SKU may only contain letters, numbers and hyphens";
    }

    if (!values.category) {
      errors.category = "Please select a category";
    }

    if (values.description.trim().length > 2000) {
      errors.description = "Description must be at most 2000 characters";
    }

    const costPrice = parsePrice(values.costPrice);
    if (values.costPrice.trim() === "" || costPrice === null) {
      errors.costPrice = "Cost price must be a valid number";
    } else if (costPrice < 0) {
      errors.costPrice = "Cost price cannot be negative";
    }

    const sellingPrice = parsePrice(values.sellingPrice);
    if (values.sellingPrice.trim() === "" || sellingPrice === null) {
      errors.sellingPrice = "Selling price must be a valid number";
    } else if (sellingPrice < 0) {
      errors.sellingPrice = "Selling price cannot be negative";
    }

    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const errors = validate();
    if (
      errors.name ||
      errors.sku ||
      errors.category ||
      errors.description ||
      errors.costPrice ||
      errors.sellingPrice
    ) {
      setFieldErrors(errors);
      return;
    }

    // Images are deliberately NOT part of this payload. They are uploaded
    // through the media endpoints (which validate the actual bytes) and saved
    // independently, so a failed image upload can never roll back - or be
    // hidden by - a successful product save.
    const payload: CreateProductInput = {
      name: values.name.trim(),
      sku: values.sku.trim(),
      category: values.category,
      description: values.description.trim() || undefined,
      costPrice: parsePrice(values.costPrice) as number,
      sellingPrice: parsePrice(values.sellingPrice) as number,
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
        if (err.errors.sku) nextErrors.sku = err.errors.sku[0];
        if (err.errors.category) nextErrors.category = err.errors.category[0];
        if (err.errors.images) nextErrors.images = err.errors.images[0];
        setFieldErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;
      }
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      if (message.toLowerCase().includes("sku")) {
        setFieldErrors((prev) => ({ ...prev, sku: message }));
      } else if (message.toLowerCase().includes("category")) {
        setFieldErrors((prev) => ({ ...prev, category: message }));
      } else {
        setFormError(message);
      }
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
        id="product-name"
        label="Product name"
        required
        value={values.name}
        onChange={(event) => updateField("name", event.target.value)}
        error={fieldErrors.name}
        placeholder="e.g. Banarasi Silk Saree"
        autoFocus
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="product-sku"
          label="SKU"
          required
          value={values.sku}
          onChange={(event) => updateField("sku", event.target.value)}
          error={fieldErrors.sku}
          placeholder="e.g. BAN-SILK-001"
          helperText="Letters, numbers and hyphens only"
        />
        <Select
          id="product-category"
          label="Category"
          required
          value={values.category}
          onChange={(event) => updateField("category", event.target.value)}
          error={fieldErrors.category}
          options={
            activeCategories.length > 0
              ? [
                  { value: "", label: "Select a category" },
                  ...activeCategories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
                ]
              : []
          }
          placeholder={activeCategories.length > 0 ? "Select a category" : undefined}
          disabled={activeCategories.length === 0}
        />
      </div>

      {activeCategories.length === 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground"
        >
          <Package className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          <span>
            No active categories available. Create an active category before adding
            products.
          </span>
        </div>
      )}

      <Textarea
        id="product-description"
        label="Description"
        value={values.description}
        onChange={(event) => updateField("description", event.target.value)}
        error={fieldErrors.description}
        placeholder="Optional product description"
        rows={3}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="product-cost-price"
          label="Cost price (BDT)"
          required
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={values.costPrice}
          onChange={(event) => updateField("costPrice", event.target.value)}
          error={fieldErrors.costPrice}
          placeholder="0.00"
        />
        <Input
          id="product-selling-price"
          label="Selling price (BDT)"
          required
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={values.sellingPrice}
          onChange={(event) => updateField("sellingPrice", event.target.value)}
          error={fieldErrors.sellingPrice}
          placeholder="0.00"
        />
      </div>

      {/*
        Image management is injected here rather than hard-coded so the form
        stays focused on the product record. In edit mode the slot holds the
        image manager bound to this product; in create mode the dialog shows it
        once the product has an id (see ProductDialog).
      */}
      {children}

      {initialValues && (
        <Select
          id="product-status"
          label="Status"
          value={values.isActive ? "true" : "false"}
          onChange={(event) => updateField("isActive", event.target.value === "true")}
          options={[
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
      )}

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
          {initialValues ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}