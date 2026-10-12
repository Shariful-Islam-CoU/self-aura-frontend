"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { Purchase } from "../types";

interface PurchaseCancelDialogProps {
  open: boolean;
  purchase: Purchase | null;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseCancelDialog({
  open,
  purchase,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: PurchaseCancelDialogProps) {
  const [error, setError] = useState<string | null>(null);

  if (!purchase) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel the purchase. Please try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Cancel purchase {purchase.purchaseNumber}?</DialogTitle>
          <DialogDescription>
            The purchase must be a draft to be cancelled. Only owners and
            managers can cancel purchases. Cancelling cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Supplier</span>
            <span className="font-medium">
              {purchase.supplier.name ?? purchase.supplier.id}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Items</span>
            <span className="font-medium">{purchase.items.length} line(s)</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t pt-3">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatCurrency(purchase.total)}</span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Keep purchase
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cancelling..." : "Cancel purchase"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
