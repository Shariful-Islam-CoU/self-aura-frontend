// Report constants mirroring the backend contract.
// Backend source of truth: self_aura_backend/src/constants/report.ts plus the
// enum values accepted by the report validators (validators/reportValidators.ts).
// These values must not drift from the backend.

import { ORDER_SOURCES } from "@/features/orders/types";
import { PURCHASE_STATUSES } from "@/features/purchases/types";
import { PAYMENT_METHODS, PAYMENT_TYPES } from "@/features/payments/constants";
import { RETURN_STATUSES, REFUND_STATUSES } from "@/features/returns/constants";

// Date grouping - backend constants/report.ts REPORT_DATE_GROUPINGS.
export const REPORT_DATE_GROUPINGS = ["day", "week", "month"] as const;
export type ReportDateGrouping = (typeof REPORT_DATE_GROUPINGS)[number];

// Non-date groupings accepted by specific report endpoints.
export const PURCHASE_GROUPINGS = ["day", "week", "month", "supplier"] as const;
export const PAYMENT_GROUPINGS = ["day", "week", "month", "paymentMethod"] as const;
export const EXPENSE_GROUPINGS = ["day", "week", "month", "category", "paymentMethod"] as const;
export const RETURN_GROUPINGS = ["day", "week", "month", "status"] as const;
export const MOVEMENT_GROUPINGS = ["day", "week", "month", "type"] as const;

export const REPORT_GROUPING_LABELS: Record<string, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  supplier: "Supplier",
  paymentMethod: "Payment method",
  category: "Category",
  status: "Status",
  type: "Transaction type",
};

// Expense payment methods - backend constants/expense.ts EXPENSE_PAYMENT_METHODS.
export const EXPENSE_PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "mobile_banking",
  "other",
] as const;
export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];

// Inventory transaction types - backend constants/inventory.ts
// INVENTORY_TRANSACTION_TYPES.
export const INVENTORY_TRANSACTION_TYPES = [
  "stock_in",
  "stock_out",
  "adjustment",
  "return_in",
  "return_out",
] as const;
export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPES)[number];

// ---------------------------------------------------------------------------
// Human-readable label maps (labels only - the enum values above stay the
// backend-owned values that are actually sent to the API).
// ---------------------------------------------------------------------------

export const ORDER_SOURCE_LABELS: Record<string, string> = {
  facebook: "Facebook",
  website: "Website",
  manual: "Manual",
  other: "Other",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  mobile_banking: "Mobile banking",
  cash_on_delivery: "Cash on delivery",
  other: "Other",
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  payment: "Payment",
  refund: "Refund",
};

export const EXPENSE_PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  mobile_banking: "Mobile banking",
  other: "Other",
};

export const PURCHASE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  received: "Received",
  cancelled: "Cancelled",
};

export const RETURN_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  received: "Received",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const REFUND_STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Failed",
};

export const INVENTORY_TRANSACTION_TYPE_LABELS: Record<string, string> = {
  stock_in: "Stock in",
  stock_out: "Stock out",
  adjustment: "Adjustment",
  return_in: "Return in",
  return_out: "Return out",
};

export interface ReportOption {
  value: string;
  label: string;
}

// Option builders used by the report filter selects.
function toOptions(
  values: readonly string[],
  labels: Record<string, string>
): ReportOption[] {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

function groupingOptions(groupings: readonly string[]): ReportOption[] {
  return groupings.map((value) => ({
    value,
    label: REPORT_GROUPING_LABELS[value] ?? value,
  }));
}

export const SALES_GROUP_BY_OPTIONS = groupingOptions(REPORT_DATE_GROUPINGS);
export const PURCHASES_GROUP_BY_OPTIONS = groupingOptions(PURCHASE_GROUPINGS);
export const PAYMENTS_GROUP_BY_OPTIONS = groupingOptions(PAYMENT_GROUPINGS);
export const EXPENSES_GROUP_BY_OPTIONS = groupingOptions(EXPENSE_GROUPINGS);
export const RETURNS_GROUP_BY_OPTIONS = groupingOptions(RETURN_GROUPINGS);
export const MOVEMENTS_GROUP_BY_OPTIONS = groupingOptions(MOVEMENT_GROUPINGS);
export const CUSTOMERS_GROUP_BY_OPTIONS = groupingOptions(REPORT_DATE_GROUPINGS);
export const DELIVERY_GROUP_BY_OPTIONS = groupingOptions(REPORT_DATE_GROUPINGS);

export const ORDER_SOURCE_OPTIONS = toOptions(ORDER_SOURCES, ORDER_SOURCE_LABELS);
export const PAYMENT_METHOD_OPTIONS = toOptions(PAYMENT_METHODS, PAYMENT_METHOD_LABELS);
export const PAYMENT_TYPE_OPTIONS = toOptions(PAYMENT_TYPES, PAYMENT_TYPE_LABELS);
export const EXPENSE_PAYMENT_METHOD_OPTIONS = toOptions(
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PAYMENT_METHOD_LABELS
);
export const PURCHASE_STATUS_OPTIONS = toOptions(PURCHASE_STATUSES, PURCHASE_STATUS_LABELS);
export const RETURN_STATUS_OPTIONS = toOptions(RETURN_STATUSES, RETURN_STATUS_LABELS);
export const REFUND_STATUS_OPTIONS = toOptions(REFUND_STATUSES, REFUND_STATUS_LABELS);
export const INVENTORY_TRANSACTION_TYPE_OPTIONS = toOptions(
  INVENTORY_TRANSACTION_TYPES,
  INVENTORY_TRANSACTION_TYPE_LABELS
);

// Date-range presets (frontend conveniences that generate dates only).
export const REPORT_PRESETS: ReportOption[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 days" },
  { value: "last30days", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "previousMonth", label: "Last month" },
  { value: "thisYear", label: "This year" },
  { value: "custom", label: "Custom range" },
];