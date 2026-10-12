// Purchase types matching the backend API.
// Backend: routes/purchase.routes.ts, validators/purchaseValidators.ts,
// types/purchase.ts, constants/purchase.ts, types/report.ts (purchase totals).
//
// Purchase numbers (PUR-######) and totals are assigned by the backend. The
// frontend never generates numbers and never recalculates authoritative totals.
// Create/update/receive/cancel are owner/manager only; listing and viewing are
// available to all authenticated roles. Only draft purchases can be edited,
// received or cancelled.

export const PURCHASE_STATUSES = ["draft", "received", "cancelled"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export interface PurchaseItem {
  id: string;
  product: { id: string };
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseSupplierRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface PurchaseCreatedByRef {
  id: string;
  username?: string;
  role?: string;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplier: PurchaseSupplierRef;
  items: PurchaseItem[];
  subtotal: number;
  additionalCost: number;
  total: number;
  purchaseDate: string;
  status: PurchaseStatus;
  note?: string;
  createdBy: PurchaseCreatedByRef;
  createdAt: string;
  updatedAt: string;
}

export interface PurchasePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PurchaseListData {
  purchases: Purchase[];
  pagination: PurchasePagination;
}

export interface PurchaseListParams {
  page?: number;
  limit?: number;
  /** Backend searches by purchase number only. */
  search?: string;
  supplier?: string;
  status?: PurchaseStatus;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "purchaseDate" | "total" | "purchaseNumber";
  sortOrder?: "asc" | "desc";
}

export type PurchaseSortBy = NonNullable<PurchaseListParams["sortBy"]>;
export type PurchaseSortOrder = NonNullable<PurchaseListParams["sortOrder"]>;

export interface PurchaseItemInput {
  product: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseInput {
  supplier: string;
  items: PurchaseItemInput[];
  additionalCost?: number;
  purchaseDate: string;
  note?: string;
}

export interface UpdatePurchaseInput {
  supplier?: string;
  items?: PurchaseItemInput[];
  additionalCost?: number;
  purchaseDate?: string;
  note?: string;
}

// Form-only draft line item. Prices come from the user's cost inputs; the
// backend stores the authoritative unit cost and computes subtotals/totals.
export interface DraftPurchaseItem {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  unitCost: string;
  quantity: string;
}

// Authoritative, backend-computed purchase totals. The purchases form shows
// an estimate while drafting, but the authoritative totals always come from
// the backend response (create/update/receive return them).
export interface PurchaseStatsTotals {
  purchaseCount: number;
  receivedCount: number;
  draftCount: number;
  cancelledCount: number;
  totalSpent: number;
  supplierCount: number;
}

export interface PurchaseStatsData {
  fromDate: string;
  toDate: string;
  totals: PurchaseStatsTotals;
}
