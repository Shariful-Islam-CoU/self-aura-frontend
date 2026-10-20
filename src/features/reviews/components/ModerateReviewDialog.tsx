"use client";

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
import { Textarea } from "@/components/ui/Textarea";
import type { ModerateReviewInput, ReviewRecord } from "../types";

export type ModerateAction = "approved" | "rejected";

interface ModerateReviewDialogProps {
  open: boolean;
  action: ModerateAction | null;
  review: ReviewRecord | null;
  isSubmitting: boolean;
  onConfirm: (review: ReviewRecord, input: ModerateReviewInput) => void;
  onOpenChange: (open: boolean) => void;
}

const ACTION_META: Record<
  ModerateAction,
  { title: string; description: string; confirmLabel: string; destructive: boolean }
> = {
  approved: {
    title: "Approve review",
    description:
      "The review becomes publicly visible on the product page immediately. The note is internal-only and is never shown to customers.",
    confirmLabel: "Approve review",
    destructive: false,
  },
  rejected: {
    title: "Reject review",
    description:
      "The review stays hidden from the product page. The note is internal-only - add one so the decision is auditable.",
    confirmLabel: "Reject review",
    destructive: true,
  },
};

export function ModerateReviewDialog({
  open,
  action,
  review,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: ModerateReviewDialogProps) {
  const [note, setNote] = useState("");

  if (!action || !review) return null;
  const meta = ACTION_META[action];

  const handleConfirm = () => {
    onConfirm(review, {
      status: action,
      moderationNote: note.trim() || undefined,
    });
    setNote("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setNote("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <blockquote className="rounded-md border border-border bg-muted/40 p-3 text-sm">
            <p className="font-medium">
              {review.rating}/5 · {review.product.name ?? "Product"}
            </p>
            {review.title && <p className="mt-1 font-medium">{review.title}</p>}
            <p className="mt-1 text-muted-foreground">{review.comment}</p>
          </blockquote>

          <Textarea
            label="Moderation note (internal)"
            placeholder="Reason for this decision..."
            value={note}
            onChange={(event) => setNote(event.target.value)}
            helperText="Never shown to customers. Recorded in the audit log."
          />
        </div>

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
            variant={meta.destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {meta.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
