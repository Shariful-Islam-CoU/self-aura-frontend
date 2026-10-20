"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { reviewStatusBadge, RatingStars } from "./ReviewBadges";
import { ReviewReplies } from "./ReviewReplies";
import type { ReviewRecord, ReviewReply } from "../types";
import { Check, X, Trash2, MessageSquarePlus } from "lucide-react";

export interface ReviewActions {
  canApprove: boolean;
  canReject: boolean;
  canReply: boolean;
  canDelete: boolean;
}

interface ReviewsTableProps {
  reviews: ReviewRecord[];
  actions: ReviewActions;
  isSubmitting: boolean;
  onApprove: (review: ReviewRecord) => void;
  onReject: (review: ReviewRecord) => void;
  onAddReply: (review: ReviewRecord) => void;
  onEditReply: (review: ReviewRecord, reply: ReviewReply) => void;
  onDeleteReply: (review: ReviewRecord, reply: ReviewReply) => void;
  onDelete: (review: ReviewRecord) => void;
}

export function ReviewsTable({
  reviews,
  actions,
  isSubmitting,
  onApprove,
  onReject,
  onAddReply,
  onEditReply,
  onDeleteReply,
  onDelete,
}: ReviewsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Review</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.map((review) => {
          // Approve/reject are only meaningful for a pending review; the backend
          // enforces this too. Reply and delete are available regardless.
          const isPending = review.status === "pending";
          const noActions =
            !(isPending && (actions.canApprove || actions.canReject)) &&
            !actions.canReply &&
            !actions.canDelete;

          return (
            <TableRow key={review.id}>
              <TableCell className="align-top">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={review.rating} />
                    {review.title && <span className="font-medium">{review.title}</span>}
                  </div>
                  <p className="max-w-md text-sm text-muted-foreground whitespace-pre-line">
                    {review.comment}
                  </p>
                  {review.images.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {review.images.length} image{review.images.length === 1 ? "" : "s"}
                    </p>
                  )}
                  <ReviewReplies
                    replies={review.replies}
                    canReply={actions.canReply}
                    isSubmitting={isSubmitting}
                    onEdit={(reply) => onEditReply(review, reply)}
                    onDelete={(reply) => onDeleteReply(review, reply)}
                  />
                </div>
              </TableCell>
              <TableCell className="align-top">
                <span className="text-sm">{review.product.name ?? review.product.id}</span>
              </TableCell>
              <TableCell className="align-top">
                <span className="text-sm">
                  {review.customer.name ?? review.customer.id}
                </span>
              </TableCell>
              <TableCell className="align-top">
                <div className="flex flex-col gap-1">
                  {reviewStatusBadge(review.status)}
                  {review.moderationNote && (
                    <span className="text-xs text-muted-foreground">
                      Note: {review.moderationNote}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right align-top">
                {noActions ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {isPending && actions.canApprove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApprove(review)}
                        disabled={isSubmitting}
                        title="Approve review"
                        aria-label="Approve review"
                      >
                        <Check className="h-4 w-4 text-success" aria-hidden="true" />
                        Approve
                      </Button>
                    )}
                    {isPending && actions.canReject && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReject(review)}
                        disabled={isSubmitting}
                        title="Reject review"
                        aria-label="Reject review"
                      >
                        <X className="h-4 w-4 text-destructive" aria-hidden="true" />
                        Reject
                      </Button>
                    )}
                    {actions.canReply && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddReply(review)}
                        disabled={isSubmitting}
                        title="Reply to review"
                        aria-label="Reply to review"
                      >
                        <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                        Reply
                      </Button>
                    )}
                    {actions.canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(review)}
                        disabled={isSubmitting}
                        title="Delete review"
                        aria-label="Delete review"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
