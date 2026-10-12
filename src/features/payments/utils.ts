import { formatCurrency } from "@/lib/currency";
import { PAYMENT_METHODS } from "./constants";
import type { PaymentMethod, PaymentStatus, PaymentType } from "./types";

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    cash: "Cash",
    bank_transfer: "Bank transfer",
    mobile_banking: "Mobile banking",
    cash_on_delivery: "Cash on delivery",
    bkash: "bKash",
    nagad: "Nagad",
    other: "Other",
  };
  return labels[method] ?? method;
};

export const getPaymentTypeLabel = (type: PaymentType): string => {
  const labels: Record<PaymentType, string> = {
    payment: "Payment",
    refund: "Refund",
  };
  return labels[type] ?? type;
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  const labels: Record<PaymentStatus, string> = {
    submitted: "Submitted",
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };
  return labels[status] ?? status;
};

// Display-only formatting; every authoritative total comes from the backend.
export const formatAmount = (amount: number): string => formatCurrency(amount);

export const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const toDateInputValue = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isPaymentMethod = (value: string): value is PaymentMethod =>
  (PAYMENT_METHODS as readonly string[]).includes(value);
