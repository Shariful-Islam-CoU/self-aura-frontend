// Role management service - Owner-only endpoints (backend enforces).

import { apiClient } from "@/lib/api";
import type {
  RoleRecord,
  RoleListQuery,
  RoleListResponse,
  CreateRoleInput,
  UpdateRoleInput,
  RolePermissionsInput,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class RoleAdminService {
  private readonly basePath = "/roles";

  async listRoles(query: RoleListQuery = {}): Promise<RoleListResponse> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: query.page,
      limit: query.limit,
      search: query.search?.trim() || undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
    const response = await apiClient.get<ApiEnvelope<RoleListResponse>>(this.basePath, {
      params,
    });
    return response.data;
  }

  /** Every role in the system (used by the user form's role picker). */
  async listAllRoles(): Promise<RoleRecord[]> {
    const response = await apiClient.get<ApiEnvelope<RoleListResponse>>(this.basePath, {
      params: { limit: 100 },
    });
    return response.data.items;
  }

  async getRole(id: string): Promise<RoleRecord> {
    const response = await apiClient.get<ApiEnvelope<{ role: RoleRecord }>>(
      `${this.basePath}/${id}`
    );
    return response.data.role;
  }

  async createRole(input: CreateRoleInput): Promise<RoleRecord> {
    const response = await apiClient.post<ApiEnvelope<{ role: RoleRecord }>>(
      this.basePath,
      input
    );
    return response.data.role;
  }

  async updateRole(id: string, input: UpdateRoleInput): Promise<RoleRecord> {
    const response = await apiClient.patch<ApiEnvelope<{ role: RoleRecord }>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.role;
  }

  /** Replace the role's permission set (Owner edits manager/staff sets too). */
  async updateRolePermissions(id: string, permissions: string[]): Promise<RoleRecord> {
    const response = await apiClient.put<ApiEnvelope<{ role: RoleRecord }>>(
      `${this.basePath}/${id}/permissions`,
      { permissions } satisfies RolePermissionsInput
    );
    return response.data.role;
  }

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<{ role: RoleRecord }>>(`${this.basePath}/${id}`);
  }
}

export const roleAdminService = new RoleAdminService();
export { RoleAdminService };