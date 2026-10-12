"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { ExpenseForm } from "./ExpenseForm";
import type { ExpenseFormValues } from "./ExpenseForm";
import type { Expense, ExpenseCategory } from "../types";

interface ExpenseDialogProps {
  open: boolean;
  mode: "create" | "edit";
  expense: Expense | null;
  /** Active categories used by the form's picker. */
  categories: ExpenseCategory[];
  isSubmitting: boolean;
  onSubmit: (values: ExpenseFormValues) => Promise<Expense>;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseDialog({
  open,
  mode,
  expense,
  categories,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: ExpenseDialogProps) {
  const handleSubmit = async (values: ExpenseFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create expense" : "Edit expense"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Record a business expense. The expense number is assigned by the server."
              : `Update details for ${expense?.expenseNumber ?? "this expense"}.`}
          </DialogDescription>
        </DialogHeader>
        <ExpenseForm
          key={mode === "edit" ? `edit-${expense?.id ?? "none"}` : "create"}
          mode={mode}
          expense={mode === "edit" ? expense : null}
          categories={categories}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}