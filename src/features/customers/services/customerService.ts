// Customer service - all customer-related API calls live here.
// Endpoints (all require authentication):
//   GET    /customers          - paginated list (search / isActive / sort)
//   GET    /customers/:id      - single customer
//   POST   /customers          - create (any authenticated role)
//   PATCH  /customers/:id      - update (any authenticated role)
//   DELETE /customers/:id      - soft deactivate (owner/manager only)
//   GET    /reports/customers  - backend-computed customer totals

import { apiClient } from "@/lib/api";
import type {
  CreateCustomerInput,
  Customer,
  CustomerListData,
  CustomerListParams,
  CustomerStatsData,
  UpdateCustomerInput,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class CustomerService {
  private readonly basePath = "/customers";

  async listCustomers(params: CustomerListParams = {}): Promise<CustomerListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      isActive: params.isActive,
      sortBy: params.sortBy ?? "createdAt",
      sortOrder: params.sortOrder ?? "desc",
    };
    const response = await apiClient.get<ApiEnvelope<CustomerListData>>(this.basePath, {
      params: query,
    });
    return response.data;
  }

  async getCustomer(id: string): Promise<Customer> {
    const response = await apiClient.get<ApiEnvelope<{ customer: Customer }>>(
      `${this.basePath}/${id}`
    );
    return response.data.customer;
  }

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const response = await apiClient.post<ApiEnvelope<{ customer: Customer }>>(
      this.basePath,
      input
    );
    return response.data.customer;
  }

  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const response = await apiClient.patch<ApiEnvelope<{ customer: Customer }>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.customer;
  }

  /** Soft delete - the backend deactivates the customer (isActive = false). */
  async deactivateCustomer(id: string): Promise<Customer> {
    const response = await apiClient.delete<ApiEnvelope<{ customer: Customer }>>(
      `${this.basePath}/${id}`
    );
    return response.data.customer;
  }

  /** Backend-computed customer statistics (GET /reports/customers). */
  async getCustomerStats(): Promise<CustomerStatsData> {
    const response = await apiClient.get<ApiEnvelope<CustomerStatsData>>(
      "/reports/customers"
    );
    return response.data;
  }
}

export const customerService = new CustomerService();
export { CustomerService };