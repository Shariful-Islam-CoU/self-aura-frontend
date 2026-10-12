// Payment constants — mirror the backend `constants/payment.ts` values.

export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "mobile_banking",
  "cash_on_delivery",
  "bkash",
  "nagad",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_TYPES = ["payment", "refund"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_STATUSES = [
  "submitted",
  "completed",
  "pending",
  "failed",
  "cancelled",
  "rejected",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_NUMBER_PREFIX = "PAY";

/** bKash/Nagad payments whose records await management verification. */
export const MANUAL_PAYMENT_METHODS = ["bkash", "nagad"] as const;
export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

export const isManualPaymentMethod = (method: PaymentMethod): boolean =>
  (MANUAL_PAYMENT_METHODS as readonly string[]).includes(method);
