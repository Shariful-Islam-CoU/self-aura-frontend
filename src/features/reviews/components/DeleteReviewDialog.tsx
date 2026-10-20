"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { ReviewRecord } from "../types";

interface DeleteReviewDialogProps {
  open: boolean;
  review: ReviewRecord | null;
  isSubmitting: boolean;
  onConfirm: (review: ReviewRecord) => void;
  onOpenChange: (open: boolean) => void;
}

/** Destructive confirmation for permanently deleting a review. */
export function DeleteReviewDialog({
  open,
  review,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: DeleteReviewDialogProps) {
  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete review</DialogTitle>
          <DialogDescription>
            This permanently removes the review and its replies. It cannot be undone -
            to merely hide a review, reject it instead.
          </DialogDescription>
        </DialogHeader>
        <blockquote className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          {review.comment}
        </blockquote>
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
            onClick={() => onConfirm(review)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Delete review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
