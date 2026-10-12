// Supplier service - all supplier-related API calls live here.
// Endpoints (all require authentication):
//   GET    /suppliers       - paginated list (search / isActive / sort)
//   POST   /suppliers       - create (owner/manager)
//   GET    /suppliers/:id   - single supplier
//   PATCH  /suppliers/:id   - update (owner/manager)
//   DELETE /suppliers/:id   - deactivate (owner/manager)

import { apiClient } from "@/lib/api";
import type {
  CreateSupplierInput,
  Supplier,
  SupplierListData,
  SupplierListParams,
  UpdateSupplierInput,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class SupplierService {
  private readonly basePath = "/suppliers";

  async listSuppliers(params: SupplierListParams = {}): Promise<SupplierListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      isActive: params.isActive,
      sortBy: params.sortBy ?? "createdAt",
      sortOrder: params.sortOrder ?? "desc",
    };
    const response = await apiClient.get<ApiEnvelope<SupplierListData>>(this.basePath, {
      params: query,
    });
    return response.data;
  }

  async getSupplier(id: string): Promise<Supplier> {
    const response = await apiClient.get<ApiEnvelope<{ supplier: Supplier }>>(
      `${this.basePath}/${id}`
    );
    return response.data.supplier;
  }

  async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
    const response = await apiClient.post<ApiEnvelope<{ supplier: Supplier }>>(
      this.basePath,
      input
    );
    return response.data.supplier;
  }

  async updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
    const response = await apiClient.patch<ApiEnvelope<{ supplier: Supplier }>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.supplier;
  }

  /** Deactivates the supplier (soft delete - isActive = false). */
  async deactivateSupplier(id: string): Promise<Supplier> {
    const response = await apiClient.delete<ApiEnvelope<{ supplier: Supplier }>>(
      `${this.basePath}/${id}`
    );
    return response.data.supplier;
  }
}

export const supplierService = new SupplierService();
export { SupplierService };