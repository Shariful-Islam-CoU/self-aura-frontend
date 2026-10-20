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
import type { ReviewRecord, ReviewReply } from "../types";

interface ReplyDialogProps {
  open: boolean;
  review: ReviewRecord | null;
  /** The reply being edited, or null when composing a new reply. */
  reply: ReviewReply | null;
  isSubmitting: boolean;
  onConfirm: (review: ReviewRecord, text: string, replyId?: string) => void;
  onOpenChange: (open: boolean) => void;
}

/** Compose or edit a management reply. Replies are visible to customers. */
export function ReplyDialog({
  open,
  review,
  reply,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: ReplyDialogProps) {
  if (!review) return null;
  const isEdit = reply !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit reply" : "Reply to review"}</DialogTitle>
          <DialogDescription>
            Replies are public and appear under the review on the product page.
          </DialogDescription>
        </DialogHeader>

        {open && (
          // Keyed so the field resets whenever the dialog opens (lint-safe
          // alternative to setState-in-effect).
          <ReplyForm
            key={`reply-${review.id}-${reply?.id ?? "new"}`}
            review={review}
            reply={reply}
            isSubmitting={isSubmitting}
            onConfirm={onConfirm}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ReplyFormProps {
  review: ReviewRecord;
  reply: ReviewReply | null;
  isSubmitting: boolean;
  onConfirm: (review: ReviewRecord, text: string, replyId?: string) => void;
  onCancel: () => void;
}

function ReplyForm({ review, reply, isSubmitting, onConfirm, onCancel }: ReplyFormProps) {
  const [text, setText] = useState(reply?.text ?? "");
  const isEdit = reply !== null;

  return (
    <>
      <div className="mt-4 space-y-3">
        <blockquote className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          {review.comment}
        </blockquote>
        <Textarea
          label="Reply"
          placeholder="Thank the customer or follow up..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          autoFocus
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => onConfirm(review, text.trim(), reply?.id)}
          isLoading={isSubmitting}
          disabled={isSubmitting || text.trim().length === 0}
        >
          {isEdit ? "Save reply" : "Post reply"}
        </Button>
      </DialogFooter>
    </>
  );
}
