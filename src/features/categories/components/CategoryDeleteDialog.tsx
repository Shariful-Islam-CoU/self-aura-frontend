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
import type { Category } from "../types";

interface CategoryDeleteDialogProps {
  open: boolean;
  category?: Category | null;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function CategoryDeleteDialog({
  open,
  category,
  isDeleting,
  onConfirm,
  onOpenChange,
}: CategoryDeleteDialogProps) {
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
          <DialogTitle>Deactivate category?</DialogTitle>
          <DialogDescription>
            This will deactivate &quot;{category?.name}&quot;. It will no longer
            appear in category lists or be usable for new products. This action
            can be reversed by reactivating the category.
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Deactivate category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}