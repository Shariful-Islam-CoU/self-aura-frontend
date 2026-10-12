"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { Purchase } from "../types";

interface PurchaseReceiveDialogProps {
  open: boolean;
  purchase: Purchase | null;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

// Receiving is a backend workflow: POST /purchases/:id/receive marks the draft
// as receivedches, updates inventory (product stock levels), and returns the
// authoritative received purchase (with server-computed totals and the
// backend-assigned receive timestamp). The frontend never touches the stock
// endpoints; it only confirms here and renders the server's response.
export function PurchaseReceiveDialog({
  open,
  purchase,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: PurchaseReceiveDialogProps) {
  const [error, setError] = useState<string | null>(null);

  // Reset the error whenever the dialog is (re)opened (render-phase state
  // adjustment - avoid setState-in-effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setError(null);
  }

  if (!purchase) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to receive the purchase. Please try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Receive purchase {purchase.purchaseNumber}?</DialogTitle>
          <DialogDescription>
            Only draft purchases can be received. Receiving marks the purchase
            as received and the backend updates inventory and records the actual
            received totals.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-card p-4 text-sm">
          <dl className="space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Supplier</dt>
              <dd className="font-medium">{purchase.supplier.name ?? purchase.supplier.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Line items</dt>
              <dd className="font-medium">{purchase.items.length}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t pt-2">
              <dt className="text-muted-foreground">Estimated total</dt>
              <dd className="font-semibold">{formatCurrency(purchase.total)}</dd>
            </div>
          </dl>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Receiving..." : "Receive purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
