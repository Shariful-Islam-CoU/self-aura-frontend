import { apiClient } from "@/lib/api";
import type {
  CreatePaymentInput,
  Payment,
  PaymentDailySummaryData,
  PaymentDailySummaryQuery,
  PaymentListData,
  PaymentListParams,
  PaymentSummaryData,
  PaymentSummaryQuery,
  RefundPaymentInput,
  RejectPaymentInput,
  UpdatePaymentInput,
} from "../types";

// Same envelope shape the backend wraps every response in (mirrors orderService).
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaymentData {
  payment: Payment;
}

// All calls hit the real backend Payment API:
//   GET    /payments                 - paginated list (any authenticated staff)
//   POST   /payments                 - record a payment (any authenticated staff)
//   GET    /payments/:id             - single payment
//   PATCH  /payments/:id             - update (owner/manager)
//   POST   /payments/:id/cancel      - cancel (owner/manager)
//   POST   /payments/:id/refund      - refund (owner/manager)
//   POST   /payments/:id/verify      - verify manual bKash/Nagad (payments.verify)
//   POST   /payments/:id/reject      - reject manual bKash/Nagad (payments.reject)
//   GET    /payments/summary         - backend totals (owner/manager)
//   GET    /payments/daily-summary   - backend daily totals (owner/manager)
// There is no DELETE route: payments are cancelled, never removed.
class PaymentClient {
  private readonly basePath = "/payments";

  async listPayments(params: PaymentListParams = {}): Promise<PaymentListData> {
    const query: Record<string, string | number | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.search && { search: params.search }),
      ...(params.order && { order: params.order }),
      ...(params.customer && { customer: params.customer }),
      ...(params.paymentMethod && { paymentMethod: params.paymentMethod }),
      ...(params.paymentStatus && { paymentStatus: params.paymentStatus }),
      ...(params.paymentType && { paymentType: params.paymentType }),
      ...(params.fromDate && { fromDate: params.fromDate }),
      ...(params.toDate && { toDate: params.toDate }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    };
    const response = await apiClient.get<ApiEnvelope<PaymentListData>>(
      this.basePath,
      { params: query }
    );
    return response.data;
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await apiClient.get<ApiEnvelope<PaymentData>>(
      `${this.basePath}/${id}`
    );
    return response.data.payment;
  }

  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const response = await apiClient.post<ApiEnvelope<PaymentData>>(
      this.basePath,
      input
    );
    return response.data.payment;
  }

  async updatePayment(id: string, input: UpdatePaymentInput): Promise<Payment> {
    const response = await apiClient.patch<ApiEnvelope<PaymentData>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.payment;
  }

  async cancelPayment(id: string): Promise<Payment> {
    const response = await apiClient.post<ApiEnvelope<PaymentData>>(
      `${this.basePath}/${id}/cancel`,
      {}
    );
    return response.data.payment;
  }

  async refundPayment(id: string, input: RefundPaymentInput): Promise<Payment> {
    const response = await apiClient.post<ApiEnvelope<PaymentData>>(
      `${this.basePath}/${id}/refund`,
      input
    );
    return response.data.payment;
  }

  /** Approve a submitted manual bKash/Nagad payment (payments.verify, owner-granted). */
  async verifyPayment(id: string): Promise<Payment> {
    const response = await apiClient.post<ApiEnvelope<PaymentData>>(
      `${this.basePath}/${id}/verify`,
      {}
    );
    return response.data.payment;
  }

  /** Reject a submitted manual bKash/Nagad payment (payments.reject, owner-granted). */
  async rejectPayment(id: string, input: RejectPaymentInput): Promise<Payment> {
    const response = await apiClient.post<ApiEnvelope<PaymentData>>(
      `${this.basePath}/${id}/reject`,
      input
    );
    return response.data.payment;
  }

  /** Backend-computed totals. Owner/manager only (backend returns 403 for staff). */
  async getPaymentSummary(
    params: PaymentSummaryQuery = {}
  ): Promise<PaymentSummaryData> {
    const query: Record<string, string | number | undefined> = {
      ...(params.fromDate && { fromDate: params.fromDate }),
      ...(params.toDate && { toDate: params.toDate }),
      ...(params.paymentMethod && { paymentMethod: params.paymentMethod }),
      ...(params.customer && { customer: params.customer }),
      ...(params.order && { order: params.order }),
      ...(params.paymentType && { paymentType: params.paymentType }),
      ...(params.paymentStatus && { paymentStatus: params.paymentStatus }),
    };
    const response = await apiClient.get<ApiEnvelope<PaymentSummaryData>>(
      `${this.basePath}/summary`,
      { params: query }
    );
    return response.data;
  }

  /** Backend-computed daily rows. Owner/manager only (backend returns 403 for staff). */
  async getPaymentDailySummary(
    params: PaymentDailySummaryQuery = {}
  ): Promise<PaymentDailySummaryData> {
    const query: Record<string, string | number | undefined> = {
      ...(params.fromDate && { fromDate: params.fromDate }),
      ...(params.toDate && { toDate: params.toDate }),
      ...(params.paymentMethod && { paymentMethod: params.paymentMethod }),
      ...(params.customer && { customer: params.customer }),
      ...(params.order && { order: params.order }),
    };
    const response = await apiClient.get<ApiEnvelope<PaymentDailySummaryData>>(
      `${this.basePath}/daily-summary`,
      { params: query }
    );
    return response.data;
  }
}

export const paymentClient = new PaymentClient();
