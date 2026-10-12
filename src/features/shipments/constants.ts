// Shipment constants mirroring the backend exactly (constants/shipment.ts).
// The backend re-validates every request; these mirrors only drive labels,
// filters, and which actions the UI offers.
import type { OrderStatus } from "@/features/orders/types";

export const SHIPMENT_STATUSES = [
  "pending",
  "ready_to_ship",
  "shipped",
  "in_transit",
  "delivered",
  "delivery_failed",
  "returned_to_seller",
  "cancelled",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const DELIVERY_FAILURE_REASONS = [
  "customer_unavailable",
  "wrong_address",
  "customer_refused",
  "phone_unreachable",
  "courier_issue",
  "other",
] as const;
export type DeliveryFailureReason = (typeof DELIVERY_FAILURE_REASONS)[number];

export const SHIPMENT_NUMBER_PREFIX = "SHP";

export const DEFAULT_SHIPMENT_STATUS: ShipmentStatus = "pending";

// Status transitions enforced by the backend (PATCH /shipments/:id/status).
// The UI offers only these next steps; the server validates again on submit.
export const SHIPMENT_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ["ready_to_ship", "cancelled"],
  ready_to_ship: ["shipped", "cancelled"],
  shipped: ["in_transit", "delivery_failed"],
  in_transit: ["delivered", "delivery_failed"],
  delivery_failed: ["returned_to_seller"],
  delivered: [],
  returned_to_seller: [],
  cancelled: [],
};

// POST /shipments/:id/cancel only accepts these statuses (backend check).
export const CANCELLABLE_SHIPMENT_STATUSES: ShipmentStatus[] = [
  "pending",
  "ready_to_ship",
];

// PATCH /shipments/:id only accepts these statuses (backend check).
export const EDITABLE_SHIPMENT_STATUSES: ShipmentStatus[] = [
  "pending",
  "ready_to_ship",
  "shipped",
  "in_transit",
  "delivery_failed",
];

// Statuses the backend treats as an "active" shipment (guards courier
// deactivation and duplicate-shipment checks).
export const ACTIVE_SHIPMENT_STATUSES: ShipmentStatus[] = [
  "pending",
  "ready_to_ship",
  "shipped",
  "in_transit",
];

// The order statuses the backend allows to be shipped (create validation).
// Used only to narrow the order picker; the server remains authoritative.
export const SHIPPABLE_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "ready_to_ship",
];