// Review moderation feature types - mirror the backend management contracts.
//
// Backend source of truth:
//   - routes/review.routes.ts   (managementReviewRouter, mounted at /management/reviews)
//   - utils/managementReviewMappers.ts  (toManagementReviewResponse)
//   - validators/reviewValidators.ts
//
// Everything here is the MANAGEMENT shape: reviewer identity, internal status and
// the internal moderationNote. It must never be used for a customer-facing read -
// the public catalogue read uses a separate, allow-listed serializer.

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export type ReviewAuthorType = "customer" | "admin";

export interface ReviewImage {
  url: string;
  publicId: string;
  sortOrder: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface ReviewProductRef {
  id: string;
  name?: string;
  slug?: string;
}

export interface ReviewCustomerRef {
  id: string;
  name?: string;
}

export interface ReviewOrderRef {
  id: string;
}

export interface ReviewReply {
  id: string;
  authorType: ReviewAuthorType;
  /** Privacy-safe label; admin replies read "Self Aura Team". */
  authorName: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
}

/** GET /management/reviews and GET /management/reviews/:id row. */
export interface ReviewRecord {
  id: string;
  product: ReviewProductRef;
  customer: ReviewCustomerRef;
  order: ReviewOrderRef;
  orderItem: string;
  rating: number;
  title?: string;
  comment: string;
  images: ReviewImage[];
  replies: ReviewReply[];
  status: ReviewStatus;
  /** Internal-only. Present solely on the authenticated management surface. */
  moderationNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListQuery {
  page?: number;
  limit?: number;
  status?: ReviewStatus;
  rating?: number;
  productId?: string;
  customerId?: string;
  sortBy?: ReviewSortField;
  sortOrder?: "asc" | "desc";
}

export type ReviewSortField = "recent" | "oldest" | "highest" | "lowest";

export interface ReviewListResponse {
  items: ReviewRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** PATCH /management/reviews/:id/moderate body. */
export interface ModerateReviewInput {
  status: Extract<ReviewStatus, "approved" | "rejected">;
  moderationNote?: string;
}

/** POST|PATCH /management/reviews/:id/replies body. */
export interface ReplyInput {
  text: string;
}

export const REVIEW_STATUS_OPTIONS: { value: ReviewStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const REVIEW_RATING_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All ratings" },
  { value: "5", label: "5 stars" },
  { value: "4", label: "4 stars" },
  { value: "3", label: "3 stars" },
  { value: "2", label: "2 stars" },
  { value: "1", label: "1 star" },
];

export const REVIEW_SORT_OPTIONS: { value: ReviewSortField; label: string }[] = [
  { value: "recent", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];
