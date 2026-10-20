import { Badge } from "@/components/ui/Badge";
import type { ReviewStatus } from "../types";

const STATUS_VARIANTS: Record<ReviewStatus, "warning" | "success" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/** Coloured status pill for a review, matching the moderation list/detail. */
export function reviewStatusBadge(status: ReviewStatus) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}

/** Five-star row; filled stars use the warning (gold) tone. */
export function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < rating ? "text-warning" : "text-muted-foreground/40"}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}
