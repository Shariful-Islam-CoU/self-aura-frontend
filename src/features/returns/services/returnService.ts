import { apiClient } from "@/lib/api";
import type {
  CreateReturnData,
  Return,
  ReturnListData,
  ReturnListParams,
  RejectReturnData,
  UpdateReturnData,
} from "../types";

// Same envelope shape the backend wraps every response in (mirrors the
// payments/orders services).
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ReturnData {
  return: Return;
}

// All calls hit the real backend Return API (routes/return.routes.ts).
// Receiving/refund operations let the backend perform inventory restocking and
// refund payment creation - this service never touches stock or payments
// directly.
class ReturnClient {
  private readonly basePath = "/returns";

  async listReturns(params: ReturnListParams = {}): Promise<ReturnListData> {
    const query: Record<string, string | number | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.search && { search: params.search }),
      ...(params.customer && { customer: params.customer }),
      ...(params.status && { status: params.status }),
      ...(params.refundStatus && { refundStatus: params.refundStatus }),
      ...(params.fromDate && { fromDate: params.fromDate }),
      ...(params.toDate && { toDate: params.toDate }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    };
    const response = await apiClient.get<ApiEnvelope<ReturnListData>>(
      this.basePath,
      { params: query }
    );
    return response.data;
  }

  async getReturn(id: string): Promise<Return> {
    const response = await apiClient.get<ApiEnvelope<ReturnData>>(
      `${this.basePath}/${id}`
    );
    return response.data.return;
  }

  async createReturn(input: CreateReturnData): Promise<Return> {
    const response = await apiClient.post<ApiEnvelope<ReturnData>>(
      this.basePath,
      input
    );
    return response.data.return;
  }

  async updateReturn(id: string, input: UpdateReturnData): Promise<Return> {
    const response = await apiClient.patch<ApiEnvelope<ReturnData>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.return;
  }

  async approveReturn(id: string): Promise<Return> {
    const response = await apiClient.post<ApiEnvelope<ReturnData>>(
      `${this.basePath}/${id}/approve`,
      null
    );
    return response.data.return;
  }

  async rejectReturn(id: string, input: RejectReturnData): Promise<Return> {
    const response = await apiClient.post<ApiEnvelope<ReturnData>>(
      `${this.basePath}/${id}/reject`,
      input
    );
    return response.data.return;
  }

  /** Receiving restocks resellable items and triggers the backend refund. */
  async receiveReturn(id: string): Promise<Return> {
    const response = await apiClient.post<ApiEnvelope<ReturnData>>(
      `${this.basePath}/${id}/receive`,
      null
    );
    return response.data.return;
  }

  /** Retries the backend refund for a received return whose refund failed. */
  async retryReturnRefund(id: string): Promise<Return> {
    const response = await apiClient.post<ApiEnvelope<ReturnData>>(
      `${this.basePath}/${id}/refund-retry`,
      null
    );
    return response.data.return;
  }

  async cancelReturn(id: string): Promise<Return> {
    const response = await apiClient.post<ApiEnvelope<ReturnData>>(
      `${this.basePath}/${id}/cancel`,
      null
    );
    return response.data.return;
  }
}

export const returnClient = new ReturnClient();