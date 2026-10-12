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
import { formatAmount, formatDate } from "../utils";

export interface ReturnApproveDialogProps {
  open: boolean;
  returnRecord: Return | null;
  isSubmitting: boolean;
  onConfirm: (id: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

// Approving a Requested return is owner/manager only (backend-enforced).
// The backend sets approvedBy/approvedAt; the UI never changes status itself.
export function ReturnApproveDialog({
  open,
  returnRecord,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: ReturnApproveDialogProps) {
  const [actionError, setActionError] = useState<string | null>(null);

  if (!returnRecord) return null;

  const handleConfirm = async () => {
    setActionError(null);
    try {
      await onConfirm(returnRecord.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to approve return.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve return {returnRecord.returnNumber}</DialogTitle>
          <DialogDescription>
            Approving moves the return from Requested to Approved and records
            who approved it. Stock is not touched until the return is received.
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
            <span className="text-muted-foreground">Customer:</span>{" "}
            {returnRecord.customer.name ?? returnRecord.customer.id}
          </p>
          <p>
            <span className="text-muted-foreground">Items:</span>{" "}
            {returnRecord.items.length} line item(s)
          </p>
          <p>
            <span className="text-muted-foreground">Refund amount (server):</span>{" "}
            <span className="font-medium tabular-nums">
              {formatAmount(returnRecord.refundAmount)}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Return date:</span>{" "}
            {formatDate(returnRecord.returnDate)}
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
            Keep request
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Approving..." : "Approve return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}