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

export interface ReturnReceiveDialogProps {
  open: boolean;
  returnRecord: Return | null;
  isSubmitting: boolean;
  onConfirm: (id: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

// Receiving is owner/manager only (backend-enforced). The backend restocks
// resellable items itself, then creates the refund payment server-side and
// completes the return - the frontend performs no inventory or payment work.
export function ReturnReceiveDialog({
  open,
  returnRecord,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: ReturnReceiveDialogProps) {
  const [actionError, setActionError] = useState<string | null>(null);

  if (!returnRecord) return null;

  const handleConfirm = async () => {
    setActionError(null);
    try {
      await onConfirm(returnRecord.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to receive return.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive return {returnRecord.returnNumber}</DialogTitle>
          <DialogDescription>
            Receiving this approved return lets the backend restock resellable
            items, create the refund, and complete the return in one operation.
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

        <p className="text-sm text-muted-foreground">
          Resellable items are returned to stock by the server. No inventory
          values or payment records are changed from this screen.
        </p>

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
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Receiving..." : "Receive return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}