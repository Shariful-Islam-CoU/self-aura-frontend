import { formatCurrency } from "@/lib/currency";
import { formatDate, toDateInputValue } from "@/features/payments/utils";
import type {
  RefundStatus,
  ReturnCondition,
  ReturnReason,
  ReturnStatus,
} from "./types";

// Display-only formatting; every authoritative figure comes from the backend.
export const formatAmount = (amount: number): string => formatCurrency(amount);

export const getReturnStatusLabel = (status: ReturnStatus): string => {
  const labels: Record<ReturnStatus, string> = {
    requested: "Requested",
    approved: "Approved",
    rejected: "Rejected",
    received: "Received",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
};

export const getRefundStatusLabel = (status: RefundStatus): string => {
  const labels: Record<RefundStatus, string> = {
    not_started: "Not started",
    pending: "Pending",
    refunded: "Refunded",
    failed: "Failed",
  };
  return labels[status] ?? status;
};

export const getReturnReasonLabel = (reason: ReturnReason): string => {
  const labels: Record<ReturnReason, string> = {
    damaged: "Damaged",
    wrong_product: "Wrong product",
    wrong_size: "Wrong size",
    defective: "Defective",
    customer_changed_mind: "Customer changed mind",
    other: "Other",
  };
  return labels[reason] ?? reason;
};

export const getReturnConditionLabel = (condition: ReturnCondition): string => {
  const labels: Record<ReturnCondition, string> = {
    resellable: "Resellable",
    damaged: "Damaged",
    defective: "Defective",
    opened: "Opened",
    other: "Other",
  };
  return labels[condition] ?? condition;
};

export { formatDate, toDateInputValue };