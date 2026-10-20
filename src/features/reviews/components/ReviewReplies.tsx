"use client";

import { Button } from "@/components/ui/Button";
import { Pencil, Trash2 } from "lucide-react";
import type { ReviewReply } from "../types";

interface ReviewRepliesProps {
  replies: ReviewReply[];
  canReply: boolean;
  isSubmitting: boolean;
  onEdit: (reply: ReviewReply) => void;
  onDelete: (reply: ReviewReply) => void;
}

/**
 * Read-only list of a review's replies with inline edit/delete affordances.
 * Adding a reply is handled by the parent's ReplyDialog.
 */
export function ReviewReplies({
  replies,
  canReply,
  isSubmitting,
  onEdit,
  onDelete,
}: ReviewRepliesProps) {
  if (replies.length === 0) {
    return <p className="text-xs text-muted-foreground">No replies yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {replies.map((reply) => (
        <li
          key={reply.id}
          className="rounded-md border-l-2 border-border bg-muted/30 px-3 py-2 text-xs"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">
                {reply.authorName}
                {reply.authorType === "admin" && (
                  <span className="ml-1 text-muted-foreground">· Self Aura Team</span>
                )}
              </p>
              <p className="mt-0.5 whitespace-pre-line text-muted-foreground">{reply.text}</p>
            </div>
            {canReply && (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(reply)}
                  disabled={isSubmitting}
                  aria-label="Edit reply"
                  title="Edit reply"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(reply)}
                  disabled={isSubmitting}
                  aria-label="Delete reply"
                  title="Delete reply"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
