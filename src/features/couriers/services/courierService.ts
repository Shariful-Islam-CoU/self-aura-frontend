import { apiClient } from "@/lib/api";
import type {
  Courier,
  CourierListData,
  CourierListParams,
  CreateCourierData,
  UpdateCourierData,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface CourierData {
  courier: Courier;
}

// All calls hit the real backend Courier API (routes/courier.routes.ts).
// DELETE is a deactivation, not a hard delete - the backend rejects
// deactivation while the courier still has active shipments.
class CourierClient {
  private readonly basePath = "/couriers";

  async listCouriers(params: CourierListParams = {}): Promise<CourierListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.search && { search: params.search }),
      ...(params.isActive !== undefined && {
        isActive: params.isActive ? "true" : "false",
      }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    };
    const response = await apiClient.get<ApiEnvelope<CourierListData>>(
      this.basePath,
      { params: query }
    );
    return response.data;
  }

  async getCourier(id: string): Promise<Courier> {
    const response = await apiClient.get<ApiEnvelope<CourierData>>(
      `${this.basePath}/${id}`
    );
    return response.data.courier;
  }

  async createCourier(input: CreateCourierData): Promise<Courier> {
    const response = await apiClient.post<ApiEnvelope<CourierData>>(
      this.basePath,
      input
    );
    return response.data.courier;
  }

  async updateCourier(id: string, input: UpdateCourierData): Promise<Courier> {
    const response = await apiClient.patch<ApiEnvelope<CourierData>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.courier;
  }

  /** Deactivates the courier (DELETE /couriers/:id). Returns the courier. */
  async deactivateCourier(id: string): Promise<Courier> {
    const response = await apiClient.delete<ApiEnvelope<CourierData>>(
      `${this.basePath}/${id}`
    );
    return response.data.courier;
  }
}

export const courierClient = new CourierClient();