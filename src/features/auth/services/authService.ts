// Authentication service - handles all auth-related API calls
// Backend contract (source of truth):
//   - POST /auth/register       -> 201 { success, message: REGISTER_PENDING, data: { user } }
//   - POST /auth/bootstrap-owner -> 201 { success, message: BOOTSTRAP_OWNER_SUCCESS, data: { user } }
//   - GET  /auth/bootstrap-status -> 200 { success, message, data: { ownerExists } } (public)
//   - POST /auth/login          -> 200 { success, message, data: { user, token } }
//   - GET  /auth/me             -> 200 { success, message, data: { user } }
// The user in login/me responses is an AuthorizedUser (SafeUser + permissions).

import { apiClient } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api/types";
import type {
  LoginRequest,
  LoginResponse,
  User,
  RegisterRequest,
  BootstrapOwnerRequest,
  BootstrapStatus,
} from "@/features/auth/types";
import { setAuthToken, setStoredUser, clearAllAuth } from "@/lib/auth/authStorage";

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiEnvelope<LoginResponse>>("/auth/login", credentials);

    // Persist the session and the current user (including its permission
    // snapshot; the backend still re-resolves permissions per request).
    setAuthToken(response.data.token);
    setStoredUser(response.data.user);

    return response.data;
  }

  async logout(): Promise<void> {
    // The backend uses stateless JWT auth and has no logout endpoint;
    // clearing the local session is the complete logout behavior.
    clearAllAuth();
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiEnvelope<{ user: User }>>("/auth/me");
    return response.data.user;
  }

  /** Register with a requested role; the account stays pending until approved. */
  async register(input: RegisterRequest): Promise<{ message: string; user: User }> {
    const response = await apiClient.post<ApiEnvelope<{ user: User }>>("/auth/register", input);
    return {
      message: response.message || "Registration submitted for approval.",
      user: response.data.user,
    };
  }

  /** One-time principal Owner bootstrap. Rejected with 409 once an Owner exists. */
  async bootstrapOwner(input: BootstrapOwnerRequest): Promise<{ message: string; user: User }> {
    const response = await apiClient.post<ApiEnvelope<{ user: User }>>(
      "/auth/bootstrap-owner",
      input
    );
    return {
      message: response.message || "Owner account created successfully.",
      user: response.data.user,
    };
  }

  /** Public, read-only flag used to surface Owner setup on the login screen. */
  async getBootstrapStatus(): Promise<BootstrapStatus> {
    const response = await apiClient.get<ApiEnvelope<BootstrapStatus>>(
      "/auth/bootstrap-status"
    );
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  }
}

export const authService = new AuthService();