// Role management feature types - mirror the backend admin contracts.
//
// Backend source of truth (read-only):
//   - routes/role.routes.ts  GET/POST/PATCH/DELETE /roles, PUT /roles/:id/permissions
//   - services/roleService.ts SafeRole
//
// Custom roles carry a permission key set. The Owner role is implicit full
// access and is never a Role document - the backend rejects the reserved name.

export interface RoleRecord {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoleListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface RoleListResponse {
  items: RoleRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** POST /roles body. */
export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions?: string[];
}

/** PATCH /roles/:id body. `name` is rejected by the backend for system roles. */
export interface UpdateRoleInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

/** PUT /roles/:id/permissions body. */
export interface RolePermissionsInput {
  permissions: string[];
}