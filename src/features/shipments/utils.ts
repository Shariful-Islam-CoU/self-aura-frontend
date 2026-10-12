import { formatAmount, formatDate, toDateInputValue } from "@/features/payments/utils";
import type { DeliveryFailureReason, ShipmentStatus } from "./constants";

export const getShipmentStatusLabel = (status: ShipmentStatus): string => {
  const labels: Record<ShipmentStatus, string> = {
    pending: "Pending",
    ready_to_ship: "Ready to ship",
    shipped: "Shipped",
    in_transit: "In transit",
    delivered: "Delivered",
    delivery_failed: "Delivery failed",
    returned_to_seller: "Returned to seller",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
};

export const getDeliveryFailureReasonLabel = (reason: DeliveryFailureReason): string => {
  const labels: Record<DeliveryFailureReason, string> = {
    customer_unavailable: "Customer unavailable",
    wrong_address: "Wrong address",
    customer_refused: "Customer refused",
    phone_unreachable: "Phone unreachable",
    courier_issue: "Courier issue",
    other: "Other",
  };
  return labels[reason] ?? reason;
};

export const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export { formatAmount, formatDate, toDateInputValue };