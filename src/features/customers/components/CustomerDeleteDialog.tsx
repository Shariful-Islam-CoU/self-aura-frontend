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
import { UserX } from "lucide-react";
import type { Customer } from "../types";

interface CustomerDeleteDialogProps {
  open: boolean;
  customer: Customer | null;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDeleteDialog({
  open,
  customer,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: CustomerDeleteDialogProps) {
  const [error, setError] = useState<string | null>(null);

  // Reset the error message whenever the dialog is (re)opened (render-phase
  // state adjustment - the lint-safe alternative to setState-in-effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setError(null);
  }

  if (!customer) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Deactivate customer</DialogTitle>
          <DialogDescription>
            Deactivate <span className="font-medium text-foreground">{customer.name}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The customer record and their order history are kept, but the
            customer will be marked as inactive and will no longer be usable as
            an active customer.
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
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={isSubmitting}
              onClick={() => void handleConfirm()}
            >
              <UserX className="mr-1 h-4 w-4" aria-hidden="true" />
              Deactivate
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}