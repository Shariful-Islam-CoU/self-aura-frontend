// Application constants

// Route constants
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  PRODUCTS: "/products",
  CATEGORIES: "/categories",
  INVENTORY: "/inventory",
  CUSTOMERS: "/customers",
  ORDERS: "/orders",
  SUPPLIERS: "/suppliers",
  PURCHASES: "/purchases",
  EXPENSES: "/expenses",
  PAYMENTS: "/payments",
  RETURNS: "/returns",
  COURIERS: "/couriers",
  SHIPMENTS: "/shipments",
  REPORTS: "/reports",
  SETTINGS: "/settings",
} as const;

// Role constants (backend UserRole contract)
export const ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Status labels
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const PURCHASE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ordered: "Ordered",
  partial: "Partial",
  received: "Received",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed: "Failed",
  returned: "Returned",
};

export const RETURN_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  received: "Received",
  processed: "Processed",
  rejected: "Rejected",
  completed: "Completed",
};

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
};

export const INVENTORY_MOVEMENT_LABELS: Record<string, string> = {
  in: "Stock In",
  out: "Stock Out",
  adjustment: "Adjustment",
  transfer: "Transfer",
  return: "Return",
};

// UI constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

export const DATE_FORMATS = {
  SHORT: "MMM d, yyyy",
  LONG: "MMMM d, yyyy",
  WITH_TIME: "MMM d, yyyy h:mm a",
  ISO: "yyyy-MM-dd",
} as const;

export const CURRENCY = {
  DEFAULT: "USD",
  LOCALE: "en-US",
} as const;

// API constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/auth/me",
    CHANGE_PASSWORD: "/auth/change-password",
  },
  USERS: "/users",
  PRODUCTS: "/products",
  CATEGORIES: "/categories",
  CUSTOMERS: "/customers",
  ORDERS: "/orders",
  SUPPLIERS: "/suppliers",
  PURCHASES: "/purchases",
  INVENTORY: "/inventory",
  EXPENSES: "/expenses",
  PAYMENTS: "/payments",
  RETURNS: "/returns",
  COURIERS: "/couriers",
  SHIPMENTS: "/shipments",
  REPORTS: "/reports",
  SETTINGS: "/settings",
} as const;