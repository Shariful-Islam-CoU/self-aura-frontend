"use client";

// Review moderation.
//
// The backend is the source of truth: writes are confirmed by the API, and the
// list is re-read afterwards - there is no optimistic row. Every action button
// is gated by the matching permission (UX-only); a stale snapshot surfaces as a
// 403 from the backend, never a silent failure.
//
// Endpoints (routes/review.routes.ts):
//   GET    /management/reviews                    (reviews.view)
//   PATCH  /management/reviews/:id/moderate       (reviews.approve OR reviews.reject)
//   POST   /management/reviews/:id/replies        (reviews.reply)
//   PATCH  /management/reviews/:id/replies/:rid   (reviews.reply)
//   DELETE /management/reviews/:id/replies/:rid   (reviews.reply)
//   DELETE /management/reviews/:id                (reviews.delete)

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/providers/AuthProvider";
import { RequirePermission } from "@/components/layout";
import {
  ReviewsTable,
  ModerateReviewDialog,
  ReplyDialog,
  DeleteReviewDialog,
  reviewAdminService,
} from "@/features/reviews";
import type {
  ModerateReviewInput,
  ReviewRecord,
  ReviewReply,
  ReviewSortField,
  ReviewStatus,
} from "@/features/reviews";
import {
  REVIEW_RATING_OPTIONS,
  REVIEW_SORT_OPTIONS,
  REVIEW_STATUS_OPTIONS,
} from "@/features/reviews/types";
import { Star, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

type ModerateTarget = { review: ReviewRecord; action: "approved" | "rejected" };
type ReplyTarget = { review: ReviewRecord; reply: ReviewReply | null };

export default function ReviewsPage() {
  const { canAccess } = useAuth();

  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "">("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [sortBy, setSortBy] = useState<ReviewSortField>("recent");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [moderateTarget, setModerateTarget] = useState<ModerateTarget | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewRecord | null>(null);

  const can = useMemo(
    () => ({
      canApprove: canAccess("reviews.approve"),
      canReject: canAccess("reviews.reject"),
      canReply: canAccess("reviews.reply"),
      canDelete: canAccess("reviews.delete"),
    }),
    [canAccess]
  );

  const loadReviews = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setIsLoading(true);
      setError(null);
      try {
        const data = await reviewAdminService.listReviews({
          page,
          limit: pageSize,
          status: statusFilter || undefined,
          rating: ratingFilter ? Number(ratingFilter) : undefined,
          productId: productFilter.trim() || undefined,
          sortBy,
        });
        setReviews(data.items);
        setTotal(data.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load reviews.");
      } finally {
        setIsLoading(false);
      }
    },
    [page, pageSize, statusFilter, ratingFilter, productFilter, sortBy]
  );

  // Load once on mount (filters reload through loadReviews).
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await reviewAdminService.listReviews({
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
          sortBy: "recent",
        });
        if (!cancelled) {
          setReviews(data.items);
          setTotal(data.pagination.total);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load reviews.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced filter reload.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (page !== 1) setPage(1);
      void loadReviews({ silent: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [statusFilter, ratingFilter, productFilter, sortBy, pageSize, page, loadReviews]);

  const refresh = useCallback(() => void loadReviews({ silent: true }), [loadReviews]);

  const handleModerate = async (review: ReviewRecord, input: ModerateReviewInput) => {
    setIsSubmitting(true);
    try {
      await reviewAdminService.moderateReview(review.id, input);
      setSuccessMessage(
        input.status === "approved" ? "Review approved." : "Review rejected."
      );
      setModerateTarget(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to moderate review.");
      setModerateTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (review: ReviewRecord, text: string, replyId?: string) => {
    setIsSubmitting(true);
    try {
      if (replyId) {
        await reviewAdminService.updateReply(review.id, replyId, { text });
        setSuccessMessage("Reply updated.");
      } else {
        await reviewAdminService.addReply(review.id, { text });
        setSuccessMessage("Reply posted.");
      }
      setReplyTarget(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save reply.");
      setReplyTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async (review: ReviewRecord, reply: ReviewReply) => {
    setIsSubmitting(true);
    try {
      await reviewAdminService.deleteReply(review.id, reply.id);
      setSuccessMessage("Reply deleted.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (review: ReviewRecord) => {
    setIsSubmitting(true);
    try {
      await reviewAdminService.deleteReview(review.id);
      setSuccessMessage("Review deleted.");
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete review.");
      setDeleteTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <RequirePermission permission="reviews.view">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
            <p className="text-muted-foreground mt-1">
              Moderate customer reviews: approve, reject, reply and delete.
            </p>
          </div>
        </div>

        {successMessage && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success-foreground"
          >
            <span>{successMessage}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="sm:w-44">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | "")}
              options={REVIEW_STATUS_OPTIONS}
              aria-label="Filter by status"
            />
          </div>
          <div className="sm:w-36">
            <Select
              label="Rating"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              options={REVIEW_RATING_OPTIONS}
              aria-label="Filter by rating"
            />
          </div>
          <div className="sm:w-56">
            <Input
              label="Product ID"
              type="search"
              placeholder="Filter by product id..."
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              aria-label="Filter by product id"
            />
          </div>
          <div className="sm:w-44">
            <Select
              label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ReviewSortField)}
              options={REVIEW_SORT_OPTIONS}
              aria-label="Sort reviews"
            />
          </div>
        </div>

        <Card>
          {isLoading ? (
            <LoadingState text="Loading reviews..." />
          ) : error ? (
            <ErrorState
              title="Unable to load reviews."
              description={error}
              onRetry={() => void loadReviews()}
              retryLabel="Try again"
            />
          ) : reviews.length === 0 ? (
            <EmptyState
              title="No reviews found."
              description="No reviews match your filters."
              icon={<Star className="h-12 w-12" aria-hidden="true" />}
            />
          ) : (
            <div className="p-4">
              <ReviewsTable
                reviews={reviews}
                isSubmitting={isSubmitting}
                actions={{
                  canApprove: can.canApprove,
                  canReject: can.canReject,
                  canReply: can.canReply,
                  canDelete: can.canDelete,
                }}
                onApprove={(review) => {
                  setSuccessMessage(null);
                  setModerateTarget({ review, action: "approved" });
                }}
                onReject={(review) => {
                  setSuccessMessage(null);
                  setModerateTarget({ review, action: "rejected" });
                }}
                onAddReply={(review) => {
                  setSuccessMessage(null);
                  setReplyTarget({ review, reply: null });
                }}
                onEditReply={(review, reply) => {
                  setSuccessMessage(null);
                  setReplyTarget({ review, reply });
                }}
                onDeleteReply={(review, reply) => void handleDeleteReply(review, reply)}
                onDelete={(review) => {
                  setSuccessMessage(null);
                  setDeleteTarget(review);
                }}
              />
              <div className="mt-4">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={total}
                  pageSize={pageSize}
                  pageSizeOptions={[10, 20, 50]}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </Card>

        <ModerateReviewDialog
          open={moderateTarget !== null}
          action={moderateTarget?.action ?? null}
          review={moderateTarget?.review ?? null}
          isSubmitting={isSubmitting}
          onConfirm={handleModerate}
          onOpenChange={(open) => {
            if (!open) setModerateTarget(null);
          }}
        />

        <ReplyDialog
          open={replyTarget !== null}
          review={replyTarget?.review ?? null}
          reply={replyTarget?.reply ?? null}
          isSubmitting={isSubmitting}
          onConfirm={handleReply}
          onOpenChange={(open) => {
            if (!open) setReplyTarget(null);
          }}
        />

        <DeleteReviewDialog
          open={deleteTarget !== null}
          review={deleteTarget}
          isSubmitting={isSubmitting}
          onConfirm={handleDelete}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        />
      </div>
    </RequirePermission>
  );
}
