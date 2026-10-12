"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { ApiError } from "@/lib/api";
import { toDateInputValue } from "@/lib/dateInput";
import { EXPENSE_PAYMENT_METHOD_LABELS, EXPENSE_PAYMENT_METHODS } from "../types";
import type { Expense, ExpenseCategory, ExpensePaymentMethod } from "../types";

export interface ExpenseFormValues {
  category: string;
  title: string;
  description: string;
  amount: string;
  paymentMethod: ExpensePaymentMethod;
  expenseDate: string;
  reference: string;
  note: string;
}

interface ExpenseFormErrors {
  category?: string;
  title?: string;
  description?: string;
  amount?: string;
  paymentMethod?: string;
  expenseDate?: string;
  reference?: string;
  note?: string;
}

interface ExpenseFormProps {
  mode: "create" | "edit";
  expense: Expense | null;
  /** Only active categories (the backend rejects inactive ones for creation). */
  categories: ExpenseCategory[];
  isSubmitting: boolean;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  onCancel: () => void;
}

const MAX_AMOUNT = 100000000000;

export function ExpenseForm({
  mode,
  expense,
  categories,
  isSubmitting,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>(() => ({
    category: expense?.category.id ?? "",
    title: expense?.title ?? "",
    description: expense?.description ?? "",
    amount: expense ? String(expense.amount) : "",
    paymentMethod: expense?.paymentMethod ?? "cash",
    expenseDate: expense ? toDateInputValue(expense.expenseDate) : "",
    reference: expense?.reference ?? "",
    note: expense?.note ?? "",
  }));
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = <K extends keyof ExpenseFormValues>(
    field: K,
    value: ExpenseFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  // Mirrors the backend zod schema (category/title/amount/paymentMethod/
  // expenseDate required; optionals length-capped).
  const validate = (): boolean => {
    const next: ExpenseFormErrors = {};

    if (!values.category) {
      next.category = "Category is required";
    }

    if (!values.title.trim()) {
      next.title = "Title is required";
    } else if (values.title.trim().length > 200) {
      next.title = "Title must be at most 200 characters";
    }

    const amount = Number(values.amount);
    if (!values.amount.trim()) {
      next.amount = "Amount is required";
    } else if (Number.isNaN(amount)) {
      next.amount = "Amount must be a number";
    } else if (amount <= 0) {
      next.amount = "Amount must be greater than zero";
    } else if (amount > MAX_AMOUNT) {
      next.amount = "Amount is too large";
    }

    if (!values.paymentMethod) {
      next.paymentMethod = "Payment method is required";
    }

    if (!values.expenseDate) {
      next.expenseDate = "Expense date is required";
    } else if (Number.isNaN(new Date(values.expenseDate).getTime())) {
      next.expenseDate = "Expense date must be a valid date";
    }

    if (values.description.trim().length > 2000) {
      next.description = "Description must be at most 2000 characters";
    }
    if (values.reference.trim().length > 200) {
      next.reference = "Reference must be at most 200 characters";
    }
    if (values.note.trim().length > 2000) {
      next.note = "Note must be at most 2000 characters";
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
        category: values.category,
        title: values.title.trim(),
        description: values.description.trim(),
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        expenseDate: values.expenseDate,
        reference: values.reference.trim(),
        note: values.note.trim(),
      });
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const serverErrors = err.errors;
        setErrors({
          category: serverErrors.category?.[0],
          title: serverErrors.title?.[0],
          description: serverErrors.description?.[0],
          amount: serverErrors.amount?.[0],
          paymentMethod: serverErrors.paymentMethod?.[0],
          expenseDate: serverErrors.expenseDate?.[0],
          reference: serverErrors.reference?.[0],
          note: serverErrors.note?.[0],
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
        <Select
          id="expense-category"
          label="Category"
          required
          value={values.category}
          onChange={(event) => updateField("category", event.target.value)}
          error={errors.category}
          options={categories.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          placeholder="Select a category"
        />
        <Input
          id="expense-title"
          label="Title"
          required
          value={values.title}
          onChange={(event) => updateField("title", event.target.value)}
          error={errors.title}
          placeholder="What was this expense for?"
        />
        <Input
          id="expense-amount"
          label="Amount"
          required
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={values.amount}
          onChange={(event) => updateField("amount", event.target.value)}
          error={errors.amount}
          placeholder="0.00"
        />
        <Select
          id="expense-payment-method"
          label="Payment method"
          required
          value={values.paymentMethod}
          onChange={(event) =>
            updateField("paymentMethod", event.target.value as ExpensePaymentMethod)
          }
          error={errors.paymentMethod}
          options={EXPENSE_PAYMENT_METHODS.map((value) => ({
            value,
            label: EXPENSE_PAYMENT_METHOD_LABELS[value],
          }))}
        />
        <Input
          id="expense-date"
          label="Expense date"
          required
          type="date"
          value={values.expenseDate}
          onChange={(event) => updateField("expenseDate", event.target.value)}
          error={errors.expenseDate}
        />
        <Input
          id="expense-reference"
          label="Reference"
          value={values.reference}
          onChange={(event) => updateField("reference", event.target.value)}
          error={errors.reference}
          placeholder="Optional receipt/invoice reference"
        />
        <div className="sm:col-span-2">
          <Textarea
            id="expense-description"
            label="Description"
            value={values.description}
            onChange={(event) => updateField("description", event.target.value)}
            error={errors.description}
            rows={2}
            placeholder="Optional description"
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            id="expense-note"
            label="Note"
            value={values.note}
            onChange={(event) => updateField("note", event.target.value)}
            error={errors.note}
            rows={3}
            placeholder="Optional internal note"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === "create" ? "Create expense" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}