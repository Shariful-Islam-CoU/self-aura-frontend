// Permission management service - Owner-only endpoints (backend enforces).

import { apiClient } from "@/lib/api";
import type {
  PermissionRecord,
  PermissionListQuery,
  PermissionListResponse,
  CreatePermissionInput,
  UpdatePermissionInput,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class PermissionAdminService {
  private readonly basePath = "/permissions";

  async listPermissions(query: PermissionListQuery = {}): Promise<PermissionListResponse> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: query.page,
      limit: query.limit,
      search: query.search?.trim() || undefined,
      module: query.module,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
    const response = await apiClient.get<ApiEnvelope<PermissionListResponse>>(
      this.basePath,
      { params }
    );
    return response.data;
  }

  /** Every (active) permission - used by the role permission picker. */
  async listAllPermissions(): Promise<PermissionRecord[]> {
    const response = await apiClient.get<ApiEnvelope<PermissionListResponse>>(this.basePath, {
      params: { limit: 100 },
    });
    return response.data.items.filter((permission) => permission.isActive);
  }

  async getPermission(id: string): Promise<PermissionRecord> {
    const response = await apiClient.get<ApiEnvelope<{ permission: PermissionRecord }>>(
      `${this.basePath}/${id}`
    );
    return response.data.permission;
  }

  async createPermission(input: CreatePermissionInput): Promise<PermissionRecord> {
    const response = await apiClient.post<ApiEnvelope<{ permission: PermissionRecord }>>(
      this.basePath,
      input
    );
    return response.data.permission;
  }

  async updatePermission(id: string, input: UpdatePermissionInput): Promise<PermissionRecord> {
    const response = await apiClient.patch<ApiEnvelope<{ permission: PermissionRecord }>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.permission;
  }

  async deletePermission(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<{ permission: PermissionRecord }>>(
      `${this.basePath}/${id}`
    );
  }
}

export const permissionAdminService = new PermissionAdminService();
export { PermissionAdminService };