// Authentication types matching the backend auth/user contracts.

export type UserStatus = "active" | "pending" | "rejected" | "disabled";

// The backend treats roles as free-form names (custom roles are supported).
// "owner" is the implicit, protected full-access role from the one-time
// bootstrap; it is never stored as a Role document.
export type UserRole = "owner" | "manager" | "staff";

/**
 * The signed-in user as returned by POST /auth/login and GET /auth/me
 * (backend AuthorizedUser = SafeUser + effective permission keys).
 *
 * Permissions are resolved from the database on every request - they are
 * never a JWT claim - so `permissions` is a UI snapshot only. The backend
 * remains the source of truth: an outdated snapshot results in a 403
 * ("Access denied"), never an automatic logout.
 */
export interface User {
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
  permissions: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * POST /auth/register body. Registration only requests a role
 * (manager | staff); the request is pending until an Owner approves it.
 */
export interface RegisterRequest {
  username: string;
  name: string;
  email: string;
  phone: string;
  requestedRole: "manager" | "staff";
  password: string;
}

/** POST /auth/bootstrap-owner body - one-time principal Owner setup. */
export interface BootstrapOwnerRequest {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}

/**
 * GET /auth/bootstrap-status response body - public, read-only flag used by the
 * login screen to surface the one-time Owner setup when it is still available.
 */
export interface BootstrapStatus {
  ownerExists: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
}