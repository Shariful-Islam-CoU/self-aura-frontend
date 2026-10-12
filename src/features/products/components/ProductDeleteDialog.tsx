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
import { LoaderCircle } from "lucide-react";
import type { Product } from "../types";

interface ProductDeleteDialogProps {
  open: boolean;
  product?: Product | null;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function ProductDeleteDialog({
  open,
  product,
  isDeleting,
  onConfirm,
  onOpenChange,
}: ProductDeleteDialogProps) {
  const [error, setError] = useState<string | null>(null);

  // Reset any previous error whenever the dialog is (re)opened.
  // This adjusts state during render (the React-recommended alternative to
  // setState-in-effect) so a stale error never shows on the next open.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setError(null);
  }

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
          <DialogTitle>
            {product?.isActive ? "Deactivate product?" : "Reactivate product?"}
          </DialogTitle>
          <DialogDescription>
            {product?.isActive
              ? `This will deactivate "${product?.name}". It will no longer be
                available for new orders. This action can be reversed by
                reactivating the product.`
              : `This will reactivate "${product?.name}" and make it available for
                new orders again.`}
          </DialogDescription>
        </DialogHeader>

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
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant={product?.isActive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {product?.isActive ? "Deactivate product" : "Reactivate product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}