// User management service - Owner-only endpoints (backend enforces).

import { apiClient } from "@/lib/api";
import type {
  UserRecord,
  UserListQuery,
  UserListResponse,
  CreateUserInput,
  UpdateUserInput,
  ChangeRoleInput,
  ResetPasswordInput,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class UserAdminService {
  private readonly basePath = "/users";

  async listUsers(query: UserListQuery = {}): Promise<UserListResponse> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: query.page,
      limit: query.limit,
      search: query.search?.trim() || undefined,
      role: query.role,
      status: query.status,
      isActive: query.isActive,
      isOwner: query.isOwner,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
    const response = await apiClient.get<ApiEnvelope<UserListResponse>>(this.basePath, {
      params,
    });
    return response.data;
  }

  async getUser(id: string): Promise<UserRecord> {
    const response = await apiClient.get<ApiEnvelope<{ user: UserRecord }>>(
      `${this.basePath}/${id}`
    );
    return response.data.user;
  }

  /** Create an active user immediately (admin-created accounts need no approval). */
  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const response = await apiClient.post<ApiEnvelope<{ user: UserRecord }>>(
      this.basePath,
      input
    );
    return response.data.user;
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<UserRecord> {
    const response = await apiClient.patch<ApiEnvelope<{ user: UserRecord }>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.user;
  }

  async approveUser(id: string): Promise<UserRecord> {
    const response = await apiClient.post<ApiEnvelope<{ user: UserRecord }>>(
      `${this.basePath}/${id}/approve`,
      null
    );
    return response.data.user;
  }

  async rejectUser(id: string): Promise<UserRecord> {
    const response = await apiClient.post<ApiEnvelope<{ user: UserRecord }>>(
      `${this.basePath}/${id}/reject`,
      null
    );
    return response.data.user;
  }

  async enableUser(id: string): Promise<UserRecord> {
    const response = await apiClient.post<ApiEnvelope<{ user: UserRecord }>>(
      `${this.basePath}/${id}/enable`,
      null
    );
    return response.data.user;
  }

  async disableUser(id: string): Promise<UserRecord> {
    const response = await apiClient.post<ApiEnvelope<{ user: UserRecord }>>(
      `${this.basePath}/${id}/disable`,
      null
    );
    return response.data.user;
  }

  async changeRole(id: string, role: string): Promise<UserRecord> {
    const response = await apiClient.post<ApiEnvelope<{ user: UserRecord }>>(
      `${this.basePath}/${id}/change-role`,
      { role } satisfies ChangeRoleInput
    );
    return response.data.user;
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await apiClient.post<ApiEnvelope<{ user: UserRecord }>>(
      `${this.basePath}/${id}/reset-password`,
      { newPassword } satisfies ResetPasswordInput
    );
  }
}

export const userAdminService = new UserAdminService();
export { UserAdminService };