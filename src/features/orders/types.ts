// Order types matching the backend API.
// Backend: routes/order.routes.ts, validators/orderValidators.ts,
// types/order.ts, constants/order.ts, types/report.ts (sales totals).
//
// These enums mirror the backend contract so the UI can display labels and
// valid status transitions. The backend remains the source of truth and
// re-validates everything on every request.

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready_to_ship",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "unpaid",
  "partially_paid",
  "paid",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  "cash_on_delivery",
  "cash",
  "bank_transfer",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ORDER_SOURCES = ["facebook", "website", "manual", "other"] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

// Linear status flow enforced by the backend (constants/order.ts).
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed"],
  confirmed: ["processing"],
  processing: ["ready_to_ship"],
  ready_to_ship: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  returned: [],
};

export const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "ready_to_ship",
  "shipped",
];

export interface OrderItem {
  id: string;
  product: { id: string };
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
}

export interface OrderShippingAddress {
  recipientName?: string;
  phone?: string;
  addressLine: string;
  area?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Immutable delivery snapshot stored on the order at creation time.
 *
 * Read back as stored, never re-resolved against today's zones, so an order
 * always shows the fee that was actually charged even after the zone is edited
 * or removed. Absent on orders created before delivery zones existed.
 *
 * Step 19A: `calculatedCharge` is the pricing-rule fee frozen at creation;
 * `finalCharge` is the amount actually billed. A manual override (management
 * only) changes `finalCharge` + `total` and records `isOverridden` + history,
 * but NEVER touches `calculatedCharge` - historical orders stay truthful even
 * after the underlying rules are edited. Fields marked optional are absent on
 * orders created before the override feature landed (backward compatible).
 */
export interface OrderDeliveryOverrideEntry {
  previousCharge: number;
  newCharge: number;
  reason?: string;
  by: string;
  at: string;
}

export interface OrderDeliverySnapshot {
  id: string;
  code: string;
  name: string;
  baseCharge: number;
  charge: number;
  freeDeliveryApplied: boolean;
  freeDeliveryThreshold: number | null;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  matchedBy: string;
  district: string;
  area: string;
  postalCode: string;
  /** Fee the pricing rules produced at creation time (never mutated). */
  calculatedCharge?: number;
  /** Fee the customer is actually billed (may be overridden by management). */
  finalCharge?: number;
  isOverridden?: boolean;
  overrideReason?: string;
  overriddenBy?: string;
  overriddenAt?: string;
  /** Most recent overrides first (backend keeps the last 10). */
  overrideHistory?: OrderDeliveryOverrideEntry[];
}

export interface OrderCouponSnapshot {
  id: string;
  code: string;
  type: string;
  value: number;
  discountAmount: number;
}

export interface OrderCustomerRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface OrderCreatedByRef {
  id: string;
  username?: string;
  role?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: OrderCustomerRef;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress: OrderShippingAddress;
  /** Absent for orders created before delivery zones were resolved. */
  delivery?: OrderDeliverySnapshot;
  coupon?: OrderCouponSnapshot;
  note?: string;
  transactionId?: string;
  senderPhone?: string;
  source: OrderSource;
  createdBy: OrderCreatedByRef;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderListData {
  orders: Order[];
  pagination: OrderPagination;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  /** Backend searches by order number only. */
  search?: string;
  customer?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  source?: OrderSource;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "orderNumber" | "total";
  sortOrder?: "asc" | "desc";
}

export type OrderSortBy = NonNullable<OrderListParams["sortBy"]>;
export type OrderSortOrder = NonNullable<OrderListParams["sortOrder"]>;

// Client sends only product + quantity; the backend derives unit prices from
// the product records and computes authoritative totals (createOrderSchema).
export interface OrderItemInput {
  product: string;
  quantity: number;
}

export interface OrderShippingAddressInput {
  recipientName?: string;
  phone?: string;
  addressLine: string;
  area?: string;
  /** Matched against delivery zones by the backend; required. */
  district: string;
  /** Optional descriptive text - the district alone identifies the location. */
  city?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Order creation body.
 *
 * There are intentionally no `discount` or `deliveryCharge` fields: the
 * backend derives the subtotal, discount, delivery zone, delivery fee and
 * total itself. A discount is only granted through a validated coupon code.
 */
export interface CreateOrderInput {
  customer: string;
  items: OrderItemInput[];
  paymentMethod?: PaymentMethod;
  shippingAddress: OrderShippingAddressInput;
  /** Validated server-side; the only way to discount an order. */
  couponCode?: string;
  note?: string;
  source?: OrderSource;
}

// Form-only draft line item used by the order creation form. Prices and stock
// come from loaded product records and are display hints only - the backend
// derives authoritative prices and totals.
export interface DraftOrderItem {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  stock: number;
  quantity: string;
}

// GET /reports/sales totals (scoped to the report date range; the backend
// defaults to the current month). All values are backend-computed.
export interface SalesStatsTotals {
  orderCount: number;
  completedCount: number;
  cancelledCount: number;
  returnedCount: number;
  grossSales: number;
  discount: number;
  deliveryCharges: number;
  netSales: number;
  averageOrderValue: number;
}

export interface SalesStatsData {
  fromDate: string;
  toDate: string;
  totals: SalesStatsTotals;
}

/**
 * PATCH /orders/:id/delivery-charge body (management only).
 * Mirrors overrideDeliveryChargeSchema in the backend validators: `finalCharge`
 * is a finite number >= 0; `reason` is optional and capped at 500 chars.
 * The backend recomputes `total` from its own stored numbers - the client
 * never sends totals.
 */
export interface OrderDeliveryChargeOverrideInput {
  finalCharge: number;
  reason?: string;
}