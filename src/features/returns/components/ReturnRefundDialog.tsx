import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { Return } from "../types";
import { formatAmount } from "../utils";

export interface ReturnRefundDialogProps {
  open: boolean;
  returnRecord: Return | null;
  isSubmitting: boolean;
  onConfirm: (id: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

// Retries the backend refund (`/returns/:id/refund-retry`) for a received
// return whose refund failed. The refund amount is the return's stored value;
// the backend creates the refund payment and ledger record. The frontend never
// computes or records refunds itself.
export function ReturnRefundDialog({
  open,
  returnRecord,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: ReturnRefundDialogProps) {
  const [actionError, setActionError] = useState<string | null>(null);

  if (!returnRecord) return null;

  const handleConfirm = async () => {
    setActionError(null);
    try {
      await onConfirm(returnRecord.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to retry refund.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retry refund for {returnRecord.returnNumber}</DialogTitle>
          <DialogDescription>
            This return was received but its refund did not complete. Retrying
            asks the backend to create the refund again from the stored amount.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Order:</span>{" "}
            <span className="font-medium">
              {returnRecord.order.orderNumber ?? returnRecord.order.id}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Refund status:</span>{" "}
            <span className="font-medium">{returnRecord.refundStatus}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Refund amount (server):</span>{" "}
            <span className="font-medium tabular-nums">
              {formatAmount(returnRecord.refundAmount)}
            </span>
          </p>
        </div>

        {actionError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {actionError}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Close
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Retrying..." : "Retry refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}