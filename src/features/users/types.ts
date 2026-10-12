// User management feature types - mirror the backend admin contracts.
//
// Backend source of truth (read-only by this step):
//   - routes/user.routes.ts  GET/POST/PATCH /users, /users/:id/approve|reject|enable|disable|change-role|reset-password
//   - types/user.ts          SafeUser
//   - repositories/userRepository.ts

export type UserStatus = "active" | "pending" | "rejected" | "disabled";

/** SafeUser as returned by the /users endpoints (no password secrets). */
export interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: UserStatus;
  isActive: boolean;
  isPrincipalOwner: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: UserStatus;
  isActive?: boolean;
  isOwner?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserListResponse {
  items: UserRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** POST /users body - admin-created users are active immediately. */
export interface CreateUserInput {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

/** PATCH /users/:id body - profile details only. */
export interface UpdateUserInput {
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
}

/** POST /users/:id/change-role body. */
export interface ChangeRoleInput {
  role: string;
}

/** POST /users/:id/reset-password body. */
export interface ResetPasswordInput {
  newPassword: string;
}

export const USER_STATUS_OPTIONS: { value: UserStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending approval" },
  { value: "rejected", label: "Rejected" },
  { value: "disabled", label: "Disabled" },
];