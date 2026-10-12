// Permission management feature types - mirror the backend admin contracts.
//
// Backend source of truth (read-only):
//   - routes/permission.routes.ts  GET/POST/PATCH/DELETE /permissions
//   - services/permissionService.ts SafePermission
//
// Permissions are the only authorization source on the backend; roles hold
// key sets, and the Owner has implicit full access. System (seeded)
// permissions cannot be modified or deleted.

export interface PermissionRecord {
  id: string;
  key: string;
  module: string;
  label: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionListQuery {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PermissionListResponse {
  items: PermissionRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** POST /permissions body. `key` must match module.action. */
export interface CreatePermissionInput {
  key: string;
  module: string;
  label: string;
  description?: string;
}

/** PATCH /permissions/:id body. */
export interface UpdatePermissionInput {
  label?: string;
  description?: string;
  isActive?: boolean;
}