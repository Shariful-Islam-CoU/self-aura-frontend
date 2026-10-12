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
import { Ban } from "lucide-react";
import type { Order } from "../types";

interface OrderCancelDialogProps {
  open: boolean;
  order: Order | null;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function OrderCancelDialog({
  open,
  order,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: OrderCancelDialogProps) {
  const [error, setError] = useState<string | null>(null);

  // Reset the error message whenever the dialog is (re)opened (render-phase
  // state adjustment - the lint-safe alternative to setState-in-effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setError(null);
  }

  if (!order) return null;

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
          <DialogTitle>Cancel order</DialogTitle>
          <DialogDescription>
            Cancel order{" "}
            <span className="font-medium text-foreground">{order.orderNumber}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The order will be marked as cancelled and cannot continue through
            fulfillment. Stock for this order is restored automatically by the
            server. This action cannot be undone.
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
              Keep order
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={isSubmitting}
              onClick={() => void handleConfirm()}
            >
              <Ban className="mr-1 h-4 w-4" aria-hidden="true" />
              Cancel order
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}