// Return constants - mirror the backend `constants/return.ts` exactly.
// The backend remains the source of truth for every value and rule.

export const RETURN_REASONS = [
  "damaged",
  "wrong_product",
  "wrong_size",
  "defective",
  "customer_changed_mind",
  "other",
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export const RETURN_CONDITIONS = [
  "resellable",
  "damaged",
  "defective",
  "opened",
  "other",
] as const;
export type ReturnCondition = (typeof RETURN_CONDITIONS)[number];

export const RETURN_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "received",
  "completed",
  "cancelled",
] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const REFUND_STATUSES = [
  "not_started",
  "pending",
  "refunded",
  "failed",
] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const RETURN_NUMBER_PREFIX = "RET";

// Only delivered orders can be returned (backend RETURNABLE_ORDER_STATUSES).
export const RETURNABLE_ORDER_STATUS = "delivered" as const;

// Backend RETURN_STATUS_TRANSITIONS - drives which actions the UI offers.
export const RETURN_STATUS_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ["approved", "rejected", "cancelled"],
  approved: ["received", "cancelled"],
  rejected: [],
  received: ["completed"],
  completed: [],
  cancelled: [],
};

// Backend CANCELLABLE_RETURN_STATUSES. Note: staff cancelling an approved
// return is rejected by the backend (403), so the UI hides it for staff.
export const CANCELLABLE_RETURN_STATUSES: ReturnStatus[] = [
  "requested",
  "approved",
];