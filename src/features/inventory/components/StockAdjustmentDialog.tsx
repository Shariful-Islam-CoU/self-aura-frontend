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
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { ApiError } from "@/lib/api";
import { PackagePlus, PackageMinus, SlidersHorizontal } from "lucide-react";
import type { Product } from "@/features/products/types";
import type {
  AddStockInput,
  AdjustStockInput,
  RemoveStockInput,
} from "../types";

export type StockAdjustmentMode = "add" | "remove" | "adjust";

const MODE_CONFIG: Record<
  StockAdjustmentMode,
  { title: string; description: string; submitLabel: string; icon: React.ReactNode }
> = {
  add: {
    title: "Add stock",
    description: "Increase the stock level for this product.",
    submitLabel: "Add stock",
    icon: <PackagePlus className="h-4 w-4" aria-hidden="true" />,
  },
  remove: {
    title: "Remove stock",
    description: "Decrease the stock level for this product.",
    submitLabel: "Remove stock",
    icon: <PackageMinus className="h-4 w-4" aria-hidden="true" />,
  },
  adjust: {
    title: "Adjust stock",
    description: "Set an exact stock level for this product.",
    submitLabel: "Adjust stock",
    icon: <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />,
  },
};

const ADJUST_REASONS = [
  { value: "manual_adjustment", label: "Manual adjustment" },
  { value: "damaged", label: "Damaged" },
  { value: "lost", label: "Lost" },
  { value: "returned", label: "Returned" },
  { value: "correction", label: "Correction" },
  { value: "removal", label: "Removal" },
];

type AdjustmentPayload = AddStockInput | RemoveStockInput | AdjustStockInput;

interface FieldErrors {
  quantity?: string;
  newStock?: string;
  reason?: string;
  note?: string;
}

interface StockAdjustmentDialogProps {
  open: boolean;
  mode: StockAdjustmentMode;
  product: Product | null;
  isSubmitting: boolean;
  onSubmit: (values: AdjustmentPayload) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function StockAdjustmentDialog({
  open,
  mode,
  product,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: StockAdjustmentDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Reset the form whenever the dialog is (re)opened (render-phase state
  // adjustment - the lint-safe alternative to setState-in-effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuantity("");
      setNewStock("");
      setReason("");
      setNote("");
      setConfirmRemoval(false);
      setFieldErrors({});
      setFormError(null);
    }
  }

  if (!product) return null;

  const config = MODE_CONFIG[mode];
  const parsePositiveInt = (raw: string): number | null => {
    if (raw.trim() === "") return null;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1) return null;
    return value;
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (mode === "adjust") {
      const stock = Number(newStock);
      if (newStock.trim() === "" || !Number.isInteger(stock) || stock < 0) {
        errors.newStock = "New stock must be a whole number of 0 or more";
      }
      if (!reason.trim()) {
        errors.reason = "Please select a reason";
      }
    } else {
      const qty = parsePositiveInt(quantity);
      if (qty === null) {
        errors.quantity = "Quantity must be a whole number of at least 1";
      } else if (mode === "remove" && qty > product.stock) {
        errors.quantity = `Cannot remove more than the current stock (${product.stock} units)`;
      }
    }
    if (note.length > 500) {
      errors.note = "Note must be at most 500 characters";
    }
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const errors = validate();
    if (errors.quantity || errors.newStock || errors.reason || errors.note) {
      setFieldErrors(errors);
      return;
    }

    if (mode === "remove" && !confirmRemoval) {
      setFieldErrors({});
      setFormError("Please confirm that you want to remove stock from this product.");
      return;
    }

    const payload: AdjustmentPayload =
      mode === "adjust"
        ? {
            newStock: Number(newStock),
            reason: reason.trim(),
            note: note.trim() || undefined,
          }
        : {
            quantity: Number(quantity),
            note: note.trim() || undefined,
          };

    try {
      await onSubmit(payload);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const nextErrors: FieldErrors = {};
        if (err.errors.quantity) nextErrors.quantity = err.errors.quantity[0];
        if (err.errors.newStock) nextErrors.newStock = err.errors.newStock[0];
        if (err.errors.reason) nextErrors.reason = err.errors.reason[0];
        if (err.errors.note) nextErrors.note = err.errors.note[0];
        setFieldErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;
      }
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      if (message.toLowerCase().includes("insufficient stock")) {
        setFieldErrors((prev) => ({ ...prev, quantity: message }));
      } else if (message.toLowerCase().includes("different from the current stock")) {
        setFieldErrors((prev) => ({ ...prev, newStock: message }));
      } else {
        setFormError(message);
      }
    }
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {config.description} Current stock for{" "}
            <span className="font-medium text-foreground">{product.name}</span> is{" "}
            <span className="font-medium text-foreground">{product.stock} units</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          {mode === "adjust" ? (
            <>
              <Input
                id="adjust-new-stock"
                label="New stock level"
                required
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={newStock}
                onChange={(event) => {
                  setNewStock(event.target.value);
                  clearFieldError("newStock");
                }}
                error={fieldErrors.newStock}
                placeholder="e.g. 25"
                helperText="Must be different from the current stock level"
                autoFocus
              />
              <Select
                id="adjust-reason"
                label="Reason"
                required
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  clearFieldError("reason");
                }}
                error={fieldErrors.reason}
                options={[
                  { value: "", label: "Select a reason" },
                  ...ADJUST_REASONS,
                ]}
              />
            </>
          ) : (
            <Input
              id={mode === "add" ? "add-quantity" : "remove-quantity"}
              label={mode === "add" ? "Quantity to add" : "Quantity to remove"}
              required
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                clearFieldError("quantity");
              }}
              error={fieldErrors.quantity}
              placeholder="e.g. 10"
              autoFocus
            />
          )}

          {mode === "remove" && (
            <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2">
              <Checkbox
                id="confirm-removal"
                label="I confirm that I want to remove stock from this product."
                checked={confirmRemoval}
                onChange={(event) => setConfirmRemoval(event.target.checked)}
              />
            </div>
          )}

          <Textarea
            id="adjust-note"
            label="Note"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              clearFieldError("note");
            }}
            error={fieldErrors.note}
            placeholder="Optional note (max 500 characters)"
            rows={2}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={mode === "remove" ? "destructive" : "default"}
              isLoading={isSubmitting}
            >
              {config.icon}
              {config.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}