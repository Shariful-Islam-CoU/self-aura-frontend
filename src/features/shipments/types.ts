// Shipment + shipment-event types mirroring the backend contracts exactly
// (types/shipment.ts, validators/shipmentValidators.ts, utils/shipmentMappers.ts).
// Nothing is invented - the backend is the single source of truth and
// re-validates every request.

import type { DeliveryFailureReason, ShipmentStatus } from "./constants";

export type { DeliveryFailureReason, ShipmentStatus } from "./constants";

export interface ShipmentOrderRef {
  id: string;
  orderNumber?: string;
  total?: number;
  orderStatus?: string;
}

export interface ShipmentCustomerRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface ShipmentCourierRef {
  id: string;
  name?: string;
  phone?: string;
}

export interface ShipmentActorRef {
  id: string;
  username?: string;
  role?: string;
}

// The address is a server-side snapshot of the linked order's shipping
// address at creation time; it is never edited from the shipment UI.
export interface ShippingAddressResponse {
  recipientName: string;
  phone: string;
  addressLine: string;
  area: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  order: ShipmentOrderRef;
  customer: ShipmentCustomerRef;
  courier: ShipmentCourierRef;
  trackingNumber?: string;
  deliveryCharge: number;
  shippingAddress: ShippingAddressResponse;
  status: ShipmentStatus;
  shippedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  returnedAt?: string;
  failureReason?: DeliveryFailureReason;
  note?: string;
  createdBy: ShipmentActorRef;
  createdAt: string;
  updatedAt: string;
}

/** Response alias matching the backend ShipmentResponse name. */
export type ShipmentResponse = Shipment;

export interface ShipmentEvent {
  id: string;
  shipment: string;
  fromStatus: ShipmentStatus;
  toStatus: ShipmentStatus;
  note?: string;
  createdBy: ShipmentActorRef;
  createdAt: string;
}

/** Response alias matching the backend ShipmentEventResponse name. */
export type ShipmentEventResponse = ShipmentEvent;

export interface ShipmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ShipmentListData {
  shipments: Shipment[];
  pagination: ShipmentPagination;
}

// Server-side list query (shipmentListQuerySchema). All filters are applied by
// the backend - the frontend never pages or filters client-side.
export interface ShipmentListParams {
  page?: number;
  limit?: number;
  search?: string;
  courier?: string;
  customer?: string;
  status?: ShipmentStatus;
  fromDate?: string;
  toDate?: string;
  shippedFrom?: string;
  shippedTo?: string;
  deliveredFrom?: string;
  deliveredTo?: string;
  sortBy?: "createdAt" | "shipmentNumber" | "shippedAt" | "deliveredAt" | "deliveryCharge";
  sortOrder?: "asc" | "desc";
}

// POST /shipments (createShipmentSchema). The tracking number is optional and
// user-provided only - the backend never auto-generates one, and neither do we.
export interface CreateShipmentData {
  order: string;
  courier: string;
  trackingNumber?: string;
  deliveryCharge?: number;
  note?: string;
}

// PATCH /shipments/:id (updateShipmentSchema, partial with >= 1 field).
// The linked order is never editable via the shipment.
export interface UpdateShipmentData {
  courier?: string;
  trackingNumber?: string;
  deliveryCharge?: number;
  note?: string;
}

// PATCH /shipments/:id/status (updateShipmentStatusSchema). failureReason is
// required by the backend whenever status === "delivery_failed".
export interface UpdateShipmentStatusData {
  status: ShipmentStatus;
  failureReason?: DeliveryFailureReason;
  note?: string;
}

// GET /shipments/performance-summary (owner/manager only; backend-computed).
export interface DeliveryPerformanceParams {
  fromDate?: string;
  toDate?: string;
}

export interface DeliveryPerformanceSummaryData {
  filters: {
    fromDate?: string;
    toDate?: string;
  };
  totalShipments: number;
  deliveredCount: number;
  failedCount: number;
  returnedCount: number;
  inTransitCount: number;
  cancelledCount: number;
  deliverySuccessCount: number;
  /** Percentage (0-100) computed by the backend. */
  deliveryFailureRate: number;
}

// GET /shipments/courier-summary (owner/manager only; backend-computed).
export interface CourierDeliverySummaryParams {
  courier?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CourierDeliverySummaryUnit {
  courier: ShipmentCourierRef;
  total: number;
  delivered: number;
  inTransit: number;
  failed: number;
  returned: number;
  cancelled: number;
}

export interface CourierDeliverySummaryData {
  filters: {
    courier?: string;
    fromDate?: string;
    toDate?: string;
  };
  totals: {
    total: number;
    delivered: number;
    inTransit: number;
    failed: number;
    returned: number;
    cancelled: number;
  };
  couriers: CourierDeliverySummaryUnit[];
}