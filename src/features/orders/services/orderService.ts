// Order service - all order-related API calls live here.
// Endpoints (all require authentication):
//   GET    /orders                 - paginated list (search / status / payment / date range)
//   POST   /orders                 - create (any authenticated role)
//   GET    /orders/:id             - single order
//   PATCH  /orders/:id/status      - advance status (any authenticated role)
//   POST   /orders/:id/cancel      - cancel (owner/manager only)
//   PATCH  /orders/:id/delivery-charge - manual delivery fee (owner/manager only)
//   GET    /reports/sales          - backend-computed sales/order totals
//
// Stock effects (deduction on create, restoration on cancel) are handled
// entirely by the backend - this service never touches the inventory API.

import { apiClient } from "@/lib/api";
import type {
  CreateOrderInput,
  Order,
  OrderDeliveryChargeOverrideInput,
  OrderListData,
  OrderListParams,
  OrderStatus,
  SalesStatsData,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class OrderService {
  private readonly basePath = "/orders";

  async listOrders(params: OrderListParams = {}): Promise<OrderListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      customer: params.customer || undefined,
      status: params.status || undefined,
      paymentStatus: params.paymentStatus || undefined,
      paymentMethod: params.paymentMethod || undefined,
      source: params.source || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      sortBy: params.sortBy ?? "createdAt",
      sortOrder: params.sortOrder ?? "desc",
    };
    const response = await apiClient.get<ApiEnvelope<OrderListData>>(this.basePath, {
      params: query,
    });
    return response.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get<ApiEnvelope<{ order: Order }>>(
      `${this.basePath}/${id}`
    );
    return response.data.order;
  }

  /** Creates the order. The backend assigns the order number and computes totals. */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await apiClient.post<ApiEnvelope<{ order: Order }>>(
      this.basePath,
      input
    );
    return response.data.order;
  }

  /** Advances the order status through the backend-defined transitions. */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await apiClient.patch<ApiEnvelope<{ order: Order }>>(
      `${this.basePath}/${id}/status`,
      { status }
    );
    return response.data.order;
  }

  /** Cancels the order. The backend restores stock automatically. */
  async cancelOrder(id: string): Promise<Order> {
    const response = await apiClient.post<ApiEnvelope<{ order: Order }>>(
      `${this.basePath}/${id}/cancel`,
      {}
    );
    return response.data.order;
  }

  /**
   * Manually overrides the delivery charge (management only). Only the fee is
   * sent - the backend recomputes the order total from its own stored numbers.
   */
  async overrideDeliveryCharge(
    id: string,
    input: OrderDeliveryChargeOverrideInput
  ): Promise<Order> {
    const response = await apiClient.patch<ApiEnvelope<{ order: Order }>>(
      `${this.basePath}/${id}/delivery-charge`,
      input
    );
    return response.data.order;
  }

  /** Backend-computed sales/order totals (GET /reports/sales). */
  async getSalesStats(): Promise<SalesStatsData> {
    const response = await apiClient.get<ApiEnvelope<SalesStatsData>>("/reports/sales");
    return response.data;
  }
}

export const orderService = new OrderService();
export { OrderService };