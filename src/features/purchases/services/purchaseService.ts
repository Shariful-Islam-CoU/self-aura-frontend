// Purchase service - all purchase-related API calls live here.
// Endpoints (all require authentication):
//   GET  /purchases          - paginated list (search / supplier / status / date range)
//   POST /purchases          - create (owner/manager)
//   GET  /purchases/:id      - single purchase
//   PATCH /purchases/:id     - update draft (owner/manager)
//   POST /purchases/:id/receive - receive draft -> backend adjusts inventory
//   POST /purchases/:id/cancel  - cancel draft (owner/manager)
//   GET  /reports/purchases  - backend-computed purchase totals (owner/manager)
//
// Inventory effects from receiving are handled entirely by the backend - this
// service never touches the inventory API.

import { apiClient } from "@/lib/api";
import type {
  CreatePurchaseInput,
  Purchase,
  PurchaseListData,
  PurchaseListParams,
  PurchaseStatsData,
  UpdatePurchaseInput,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class PurchaseService {
  private readonly basePath = "/purchases";

  async listPurchases(params: PurchaseListParams = {}): Promise<PurchaseListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      supplier: params.supplier || undefined,
      status: params.status || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      sortBy: params.sortBy ?? "createdAt",
      sortOrder: params.sortOrder ?? "desc",
    };
    const response = await apiClient.get<ApiEnvelope<PurchaseListData>>(this.basePath, {
      params: query,
    });
    return response.data;
  }

  async getPurchase(id: string): Promise<Purchase> {
    const response = await apiClient.get<ApiEnvelope<{ purchase: Purchase }>>(
      `${this.basePath}/${id}`
    );
    return response.data.purchase;
  }

  /** Creates the purchase. The backend assigns the purchase number and totals. */
  async createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
    const response = await apiClient.post<ApiEnvelope<{ purchase: Purchase }>>(
      this.basePath,
      input
    );
    return response.data.purchase;
  }

  /** Updates a draft purchase only (backend rejects non-drafts with 409). */
  async updatePurchase(id: string, input: UpdatePurchaseInput): Promise<Purchase> {
    const response = await apiClient.patch<ApiEnvelope<{ purchase: Purchase }>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.purchase;
  }

  /**
   * Receives a draft purchase. The backend marks it received and increases
   * inventory for each item. The frontend never updates stock itself.
   */
  async receivePurchase(id: string): Promise<Purchase> {
    const response = await apiClient.post<ApiEnvelope<{ purchase: Purchase }>>(
      `${this.basePath}/${id}/receive`,
      null
    );
    return response.data.purchase;
  }

  /** Cancels a draft purchase (no stock effect - drafts never touched stock). */
  async cancelPurchase(id: string): Promise<Purchase> {
    const response = await apiClient.post<ApiEnvelope<{ purchase: Purchase }>>(
      `${this.basePath}/${id}/cancel`,
      null
    );
    return response.data.purchase;
  }

  /** Backend-computed purchase totals (GET /reports/purchases). */
  async getPurchaseStats(params: {
    supplierId?: string;
    from?: string;
    to?: string;
  } = {}): Promise<PurchaseStatsData> {
    const response = await apiClient.get<ApiEnvelope<PurchaseStatsData>>(
      "/reports/purchases",
      {
        params: {
          supplierId: params.supplierId || undefined,
          from: params.from || undefined,
          to: params.to || undefined,
        },
      }
    );
    return response.data;
  }
}

export const purchaseService = new PurchaseService();
export { PurchaseService };