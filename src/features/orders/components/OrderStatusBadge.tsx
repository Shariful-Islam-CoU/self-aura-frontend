"use client";

import { Badge } from "@/components/ui/Badge";
import type {
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../types";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary"
  | "outline";

const ORDER_STATUS_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  ready_to_ship: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "destructive",
  returned: "secondary",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready_to_ship: "Ready to ship",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const PAYMENT_STATUS_VARIANTS: Record<PaymentStatus, BadgeVariant> = {
  unpaid: "warning",
  partially_paid: "info",
  paid: "success",
  refunded: "secondary",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially paid",
  paid: "Paid",
  refunded: "Refunded",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash_on_delivery: "Cash on delivery",
  cash: "Cash",
  bank_transfer: "Bank transfer",
  other: "Other",
};

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  facebook: "Facebook",
  website: "Website",
  manual: "Manual",
  other: "Other",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge variant={ORDER_STATUS_VARIANTS[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <Badge variant={PAYMENT_STATUS_VARIANTS[status]}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}