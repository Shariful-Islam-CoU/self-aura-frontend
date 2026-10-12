// Return types mirroring the backend Return API contract exactly
// (types/return.ts + utils/returnMappers.ts). Field names and values are the
// backend's; nothing is invented.
//
// Backend surface (routes/return.routes.ts):
//   GET    /returns             list (any authenticated staff)
//   POST   /returns             create (any authenticated staff)
//   GET    /returns/:id         single return
//   PATCH  /returns/:id         update (owner/manager, status 'requested' only)
//   POST   /returns/:id/approve (owner/manager, from 'requested')
//   POST   /returns/:id/reject  (owner/manager, from 'requested')
//   POST   /returns/:id/receive (owner/manager, from 'approved'; backend
//                               restocks resellable items and auto-creates the
//                               refund, completing the return)
//   POST   /returns/:id/refund-retry (owner/manager, 'received' + not refunded)
//   POST   /returns/:id/cancel  (any staff; 'requested'/'approved' only)
// There is no return summary endpoint - pagination.total is the only backend
// aggregate, so no summary metrics are invented.

import type {
  RefundStatus,
  ReturnCondition,
  ReturnReason,
  ReturnStatus,
} from "./constants";

export type {
  RefundStatus,
  ReturnCondition,
  ReturnReason,
  ReturnStatus,
} from "./constants";

export interface ReturnOrderRef {
  id: string;
  orderNumber?: string;
  total?: number;
  orderStatus?: string;
}

export interface ReturnCustomerRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface ReturnProductRef {
  id: string;
  name?: string;
  sku?: string;
}

export interface ReturnItem {
  id: string;
  product: ReturnProductRef;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  reason: ReturnReason;
  condition: ReturnCondition;
}

export interface ReturnActorRef {
  id: string;
  username?: string;
  role?: string;
}

// The backend maps `IReturn` to this shape (returnMappers.ts).
export interface Return {
  id: string;
  returnNumber: string;
  order: ReturnOrderRef;
  customer: ReturnCustomerRef;
  items: ReturnItem[];
  subtotal: number;
  refundAmount: number;
  reason: ReturnReason;
  note?: string;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  returnDate: string;
  approvedBy?: ReturnActorRef;
  approvedAt?: string;
  completedAt?: string;
  createdBy: ReturnActorRef;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReturnListData {
  returns: Return[];
  pagination: ReturnPagination;
}

// Server-side list query (returnListQuerySchema).
export interface ReturnListParams {
  page?: number;
  limit?: number;
  search?: string;
  customer?: string;
  status?: ReturnStatus;
  refundStatus?: RefundStatus;
  fromDate?: string;
  toDate?: string;
  sortBy?: "returnDate" | "createdAt" | "refundAmount" | "returnNumber";
  sortOrder?: "asc" | "desc";
}

// Per-item create payload (createReturnSchema). Client sends product +
// quantity; reason/condition are optional (backend defaults). Refund amounts
// and quantities already returned are computed/validated by the backend.
export interface ReturnItemInput {
  product: string;
  quantity: number;
  reason?: ReturnReason;
  condition?: ReturnCondition;
}

export interface CreateReturnData {
  order: string;
  items: ReturnItemInput[];
  reason: ReturnReason;
  note?: string;
  returnDate?: string;
}

export interface UpdateReturnData {
  reason?: ReturnReason;
  note?: string;
  returnDate?: string;
  items?: ReturnItemInput[];
}

export interface RejectReturnData {
  note?: string;
}

// Form-only draft line used by ReturnItemsEditor (parallel to the orders
// feature's DraftOrderItem). Ordered quantity and unit price come from the
// loaded order record and are display/bounds hints only - the backend derives
// authoritative refund amounts and enforces remaining returnable quantities.
export interface ReturnItemDraft {
  product: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  unitPrice: number;
  quantity: number;
  reason: ReturnReason;
  condition: ReturnCondition;
  included: boolean;
}