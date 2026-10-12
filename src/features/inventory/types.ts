// Inventory types matching the backend API
// Backend: routes/inventory.routes.ts, validators/inventoryValidators.ts,
// types/inventory.ts, types/report.ts, constants/inventory.ts

import type {
  Product,
  ProductListData,
  ProductListParams,
  ProductSortBy,
  ProductSortOrder,
} from "@/features/products/types";

export type StockTransactionType =
  | "stock_in"
  | "stock_out"
  | "adjustment"
  | "return_in"
  | "return_out";

export type InventoryReason =
  | "initial_stock"
  | "restock"
  | "removal"
  | "manual_adjustment"
  | "damaged"
  | "lost"
  | "returned"
  | "correction"
  | "purchase";

export type InventoryReferenceType = "purchase" | "order" | "return";

export interface InventoryCreatedByRef {
  id: string;
  username?: string;
  role?: string;
}

export interface StockMovement {
  id: string;
  product: { id: string };
  type: StockTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceType?: InventoryReferenceType;
  referenceId?: string;
  note?: string;
  createdBy: InventoryCreatedByRef;
  createdAt: string;
  updatedAt: string;
}

export interface MovementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StockMovementListData {
  items: StockMovement[];
  pagination: MovementPagination;
}

export interface StockChangeResult {
  product: Product;
  transaction: StockMovement;
}

export interface AddStockInput {
  quantity: number;
  note?: string;
}

export interface RemoveStockInput {
  quantity: number;
  note?: string;
}

export interface AdjustStockInput {
  newStock: number;
  reason: string;
  note?: string;
}

// Inventory totals provided by GET /reports/inventory (report types / InventoryTotals)
export interface InventoryTotals {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockUnits: number;
  costValue: number;
  sellingValue: number;
}

// Inventory list view modes. The backend products list supports active/inactive
// filtering via `isActive`; the low-stock view uses GET /inventory/low-stock.
export type InventoryListStatusFilter = "all" | "active" | "inactive" | "low_stock";

// Re-export the products feature types used by the inventory list.
export type {
  Product,
  ProductListData,
  ProductListParams,
  ProductSortBy,
  ProductSortOrder,
};

// Stock status labels derived from the backend-documented low-stock rule
// (see reportRepository.getInventoryTotals): a product is low stock when
// stock <= lowStockThreshold and out of stock when stock === 0.
export type InventoryStockStatus = "in_stock" | "low_stock" | "out_of_stock";