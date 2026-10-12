// Settings service - every settings/profile/security API call goes through this
// service, which uses the shared apiClient (no direct fetch from components).
//
// Endpoints used (all authenticated):
//   GET  /auth/me                     current user profile (all roles)
//   POST /auth/change-password        change own password (all roles)
//   GET  /settings/business           business settings (all roles)
//   PATCH /settings/business          update business settings (owner)
//   GET  /settings/app                application settings (owner/manager)
//   PATCH /settings/app               upsert an application setting (owner)
//   GET  /settings/payments           merchant payment settings (all roles)
//   PATCH /settings/payments          update payment settings (owner)
//   DELETE /users/:id                 deactivate an account (owner, user management)
//   GET/POST/PATCH/DELETE /delivery-zones/management/delivery-zones  delivery zones
//
// The backend wraps every response in { success, message, data } and the shared
// apiClient returns the raw JSON body, so each method unwraps .data locally.

import { apiClient } from "@/lib/api";
import type {
  ApiEnvelope,
  ApplicationSetting,
  ApplicationSettingsUpdateInput,
  BusinessSettings,
  BusinessSettingsUpdateInput,
  ChangePasswordInput,
  CreateDeliveryZoneInput,
  CurrentUserResponse,
  DeliveryZone,
  DeliveryZonePagination,
  PaymentSettingsData,
  PaymentSettingsUpdateInput,
  ProfileUser,
  UpdateDeliveryZoneInput,
} from "../types";

class SettingsClient {
  private unwrap<T>(response: ApiEnvelope<T>): T {
    return response.data;
  }

  async getCurrentUser(): Promise<ProfileUser> {
    const response = await apiClient.get<ApiEnvelope<CurrentUserResponse>>("/auth/me");
    return this.unwrap(response).user;
  }

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await apiClient.post<ApiEnvelope<unknown>>("/auth/change-password", input);
  }

  async getBusinessSettings(): Promise<BusinessSettings> {
    const response = await apiClient.get<ApiEnvelope<BusinessSettings>>("/settings/business");
    return this.unwrap(response);
  }

  async updateBusinessSettings(input: BusinessSettingsUpdateInput): Promise<BusinessSettings> {
    const response = await apiClient.patch<ApiEnvelope<BusinessSettings>>(
      "/settings/business",
      input
    );
    return this.unwrap(response);
  }

  async getApplicationSettings(): Promise<ApplicationSetting[]> {
    const response = await apiClient.get<ApiEnvelope<ApplicationSetting[]>>("/settings/app");
    return this.unwrap(response);
  }

  async updateApplicationSetting(
    input: ApplicationSettingsUpdateInput
  ): Promise<ApplicationSetting> {
    const response = await apiClient.patch<ApiEnvelope<ApplicationSetting>>("/settings/app", input);
    return this.unwrap(response);
  }

  /** GET /settings/payments — merchant bKash/Nagad/COD configuration. */
  async getPaymentSettings(): Promise<PaymentSettingsData> {
    const response = await apiClient.get<ApiEnvelope<PaymentSettingsData>>("/settings/payments");
    return this.unwrap(response);
  }

  /** PATCH /settings/payments — owner (settings.manage) only, backend-enforced. */
  async updatePaymentSettings(input: PaymentSettingsUpdateInput): Promise<PaymentSettingsData> {
    const response = await apiClient.patch<ApiEnvelope<PaymentSettingsData>>(
      "/settings/payments",
      input
    );
    return this.unwrap(response);
  }

  async deactivateAccount(userId: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<unknown>>(`/users/${userId}`);
  }

  // Delivery zone endpoints live under the deliveryZone router, which mounts its
  // management sub-router at /delivery-zones/management/delivery-zones
  // (routes/index.ts + routes/deliveryZone.routes.ts). The duplicated segment is
  // the backend's existing shape; these paths are verified against the running
  // API rather than guessed.
  private static readonly ZONES = "/delivery-zones/management/delivery-zones";

  /** GET /delivery-zones/management/delivery-zones — list delivery zones. */
  async getDeliveryZones(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ items: DeliveryZone[]; pagination?: DeliveryZonePagination }> {
    const response = await apiClient.get<
      ApiEnvelope<{ items: DeliveryZone[]; pagination?: DeliveryZonePagination }>
    >(SettingsClient.ZONES, params ? { params } : undefined);
    return this.unwrap(response);
  }

  /** POST /delivery-zones/management/delivery-zones — create a delivery zone. */
  async createDeliveryZone(input: CreateDeliveryZoneInput): Promise<DeliveryZone> {
    const response = await apiClient.post<ApiEnvelope<{ zone: DeliveryZone }>>(
      SettingsClient.ZONES,
      input
    );
    return this.unwrap(response).zone;
  }

  /** PATCH /delivery-zones/management/delivery-zones/:id — update a delivery zone. */
  async updateDeliveryZone(
    id: string,
    input: UpdateDeliveryZoneInput
  ): Promise<DeliveryZone> {
    const response = await apiClient.patch<ApiEnvelope<{ zone: DeliveryZone }>>(
      `${SettingsClient.ZONES}/${id}`,
      input
    );
    return this.unwrap(response).zone;
  }

  /** DELETE /delivery-zones/management/delivery-zones/:id — delete a delivery zone. */
  async deleteDeliveryZone(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<unknown>>(`${SettingsClient.ZONES}/${id}`);
  }

  /** PATCH /delivery-zones/management/delivery-zones/:id/toggle — toggle status. */
  async toggleDeliveryZone(id: string, isActive: boolean): Promise<DeliveryZone> {
    const response = await apiClient.patch<ApiEnvelope<{ zone: DeliveryZone }>>(
      `${SettingsClient.ZONES}/${id}/toggle`,
      { isActive }
    );
    return this.unwrap(response).zone;
  }
}

export const settingsClient = new SettingsClient();
export { SettingsClient };