// Payment types — mirrors the backend Payment API contract exactly.
//  GET /payments            list (any staff)  -> { payments, pagination }
//  POST /payments           create (any staff)
//  GET /payments/:id        single
//  PATCH /payments/:id      update (owner/manager)
//  POST /payments/:id/cancel  cancel (owner/manager)
//  POST /payments/:id/refund  refund (owner/manager)
//  POST /payments/:id/verify  verify a manual bKash/Nagad transaction (payments.verify)
//  POST /payments/:id/reject  reject a manual bKash/Nagad transaction (payments.reject)
//  GET /payments/daily-summary  (owner/manager)
//  GET /payments/summary       (owner/manager)

import type {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from "@/features/payments/constants";

export type {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from "@/features/payments/constants";

export interface PaymentOrderRef {
  id: string;
  orderNumber?: string;
  total?: number;
}

export interface PaymentCustomerRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface PaymentParentRef {
  id: string;
  paymentNumber?: string;
  amount?: number;
}

export interface PaymentCreatedByRef {
  id: string;
  username?: string;
  role?: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  order: PaymentOrderRef;
  customer: PaymentCustomerRef;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  reference?: string;
  note?: string;
  parentPayment?: PaymentParentRef;
  cancelledAt?: string;
  cancelledBy?: { id: string };
  /** Set when a manual bKash/Nagad payment is verified (completed). */
  verifiedAt?: string;
  verifiedBy?: PaymentCreatedByRef;
  /** Set when a manual bKash/Nagad payment is rejected. */
  rejectedAt?: string;
  rejectedBy?: PaymentCreatedByRef;
  rejectionReason?: string;
  createdBy: PaymentCreatedByRef;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaymentListData {
  payments: Payment[];
  pagination: PaymentPagination;
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  search?: string;
  order?: string;
  customer?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentType?: PaymentType;
  fromDate?: string;
  toDate?: string;
  sortBy?: "paymentDate" | "createdAt" | "amount" | "paymentNumber";
  sortOrder?: "asc" | "desc";
}

export interface CreatePaymentInput {
  order: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference?: string;
  note?: string;
}

export interface UpdatePaymentInput {
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  reference?: string;
  note?: string;
}

export interface RefundPaymentInput {
  amount: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  reference?: string;
  note?: string;
}

/** POST /payments/:id/reject body (rejection reason is optional). */
export interface RejectPaymentInput {
  rejectionReason?: string;
}

export interface LedgerSummaryTotals {
  totalPayments: number;
  totalRefunds: number;
  netReceived: number;
  paymentCount: number;
  refundCount: number;
}

export interface PaymentSummaryData {
  fromDate?: string;
  toDate?: string;
  paymentMethod?: PaymentMethod;
  customer?: string;
  order?: string;
  paymentType?: PaymentType;
  paymentStatus?: PaymentStatus;
  summary: LedgerSummaryTotals;
}

export interface PaymentDailySummaryQuery {
  fromDate?: string;
  toDate?: string;
  paymentMethod?: PaymentMethod;
  customer?: string;
  order?: string;
}

// Query params for GET /payments/summary - the full summary filter set from
// the backend summary schema (paymentType/paymentStatus included).
export interface PaymentSummaryQuery {
  fromDate?: string;
  toDate?: string;
  paymentMethod?: PaymentMethod;
  customer?: string;
  order?: string;
  paymentType?: PaymentType;
  paymentStatus?: PaymentStatus;
}

export interface DailyPaymentRow {
  date: string;
  totalPayments: number;
  totalRefunds: number;
  netReceived: number;
  paymentCount: number;
  refundCount: number;
}

export interface PaymentDailySummaryData {
  fromDate?: string;
  toDate?: string;
  paymentMethod?: PaymentMethod;
  customer?: string;
  order?: string;
  summary: DailyPaymentRow[];
}
