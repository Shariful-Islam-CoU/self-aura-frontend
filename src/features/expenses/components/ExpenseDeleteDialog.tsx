"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import type { Expense } from "../types";

interface ExpenseDeleteDialogProps {
  open: boolean;
  expense: Expense | null;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseDeleteDialog({
  open,
  expense,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: ExpenseDeleteDialogProps) {
  const [error, setError] = useState<string | null>(null);

  // Reset the error message whenever the dialog is (re)opened (render-phase
  // state adjustment - the lint-safe alternative to setState-in-effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setError(null);
  }

  if (!expense) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Delete expense</DialogTitle>
          <DialogDescription>
            Delete{" "}
            <span className="font-medium text-foreground">
              {expense.expenseNumber} – {expense.title}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The expense will be permanently removed from expense lists and
            reports. This action cannot be undone from the management app.
          </p>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Keep expense
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={isSubmitting}
              onClick={() => void handleConfirm()}
            >
              <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}