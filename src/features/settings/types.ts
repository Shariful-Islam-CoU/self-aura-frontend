// Settings feature types - mirror the backend contract exactly.
//
// Backend source of truth (read-only, never modified by this step):
//   - routes/auth.routes.ts          GET /auth/me, POST /auth/change-password
//   - routes/settings.routes.ts      GET/PATCH /settings/business, GET/PATCH /settings/app
//   - routes/user.routes.ts          DELETE /users/:id (owner - user management)
//   - types/user.ts, types/auth.ts   SafeUser / AuthUser
//   - validators/{settingsValidators,userValidators,authValidators}.ts
//   - controllers/{businessSettingsController,applicationSettingsController,authController}.ts
//   - models/{BusinessSettings,ApplicationSettings,User}.ts

import type { UserRole } from "@/features/auth/types";

/** Standard backend envelope: { success, message, data }. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Current user as returned by GET /auth/me -> data.user.
 * Mirrors backend SafeUser (types/user.ts): the user model has NO email, name,
 * phone, or avatar fields.
 */
export interface ProfileUser {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** GET /auth/me envelope data. */
export interface CurrentUserResponse {
  user: ProfileUser;
}

/** POST /auth/change-password body (changePasswordSchema in userValidators.ts). */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * Business settings returned by GET/PATCH /settings/business
 * (businessSettingsController). lowStockAlertThreshold is null when unset.
 */
export interface BusinessSettings {
  currency: string;
  timezone: string;
  taxRate: number;
  lowStockAlertThreshold: number | null;
  allowNegativeStock: boolean;
  updatedAt: string;
}

/** PATCH /settings/business body (businessSettingsUpdateSchema). */
export interface BusinessSettingsUpdateInput {
  currency?: string;
  timezone?: string;
  taxRate?: number;
  lowStockAlertThreshold?: number;
  allowNegativeStock?: boolean;
}

/**
 * Application setting returned by GET /settings/app and PATCH /settings/app.
 * The value is an arbitrary key-value store type (Schema.Types.Mixed), so it is
 * typed as unknown and formatted as a string in the UI.
 */
export interface ApplicationSetting {
  _id: string;
  name: string;
  value: unknown;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** PATCH /settings/app body (applicationSettingsUpdateSchema). */
export interface ApplicationSettingsUpdateInput {
  name: string;
  value: unknown;
  description?: string;
}

/**
 * Merchant payment settings returned by GET/PATCH /settings/payments and the
 * public GET /api/public/payment-settings endpoint. Stored through the
 * existing ApplicationSettings key-value store:
 *   - payment.bkash.number / payment.bkash.enabled
 *   - payment.nagad.number / payment.nagad.enabled
 *   - payment.cod.enabled
 * Merchant numbers are public configuration (customers need them to send
 * money), never secrets. A disabled method always returns an empty number.
 */
export interface PaymentChannelSettings {
  enabled: boolean;
  number: string;
}

export interface PaymentSettingsData {
  bkash: PaymentChannelSettings;
  nagad: PaymentChannelSettings;
  cod: { enabled: boolean };
}

/** PATCH /settings/payments body (paymentSettingsUpdateSchema). */
export interface PaymentSettingsUpdateInput {
  bkash?: Partial<PaymentChannelSettings>;
  nagad?: Partial<PaymentChannelSettings>;
  cod?: { enabled?: boolean };
}

/**
 * Delivery rule types, mirroring the backend (constants/deliveryRule.ts).
 *
 *   postal_code       postal code only            (legacy, most specific match)
 *   exact_area        district + area             (most specific rule)
 *   area              area only (any district)    (legacy tier)
 *   district_default  district only               (district-wide fallback)
 *   country_default   country only                (country-wide fallback)
 *   keyword           keywords only               (fuzzy text fallback, last resort)
 *
 * Resolution precedence is deterministic: postal code > exact area > area >
 * district default > country default > keyword.
 */
export const DELIVERY_RULE_TYPES = [
  "postal_code",
  "exact_area",
  "area",
  "district_default",
  "country_default",
  "keyword",
] as const;
export type DeliveryRuleType = (typeof DELIVERY_RULE_TYPES)[number];

/** The three first-class structured rule types management configures. */
export const PRIMARY_RULE_TYPES: DeliveryRuleType[] = [
  "exact_area",
  "district_default",
  "country_default",
];

/**
 * Delivery zone area as returned by the backend.
 * Mirrors backend IDeliveryZoneArea (models/DeliveryZone.ts).
 */
export interface DeliveryZoneArea {
  district?: string;
  area?: string;
  postalCode?: string;
  country?: string;
  /**
   * Configured alternative spellings (Bangla + variants). Cross-script
   * matching only ever happens through one of these - never fuzzy guessing.
   */
  aliases?: string[];
  /**
   * Rule-level charge. When set (0 is valid, e.g. a free area), it overrides
   * the zone's base charge for this rule only.
   */
  charge?: number;
  /** Explicit rule type; derived from the fields when absent. */
  ruleType?: DeliveryRuleType;
  /** Customer-facing names/descriptions for the storefront rules list. */
  customerName?: string;
  customerNameBn?: string;
  description?: string;
  descriptionBn?: string;
  /** Normalized match keys computed by the backend at write time. */
  normalizedDistrict?: string;
  normalizedArea?: string;
  normalizedCountry?: string;
  normalizedAliases?: string[];
  /** Legacy keyword coverage (fuzzy last resort). */
  keywords?: string[];
}

/**
 * Delivery zone as returned by the delivery-zone list endpoint.
 * Mirrors backend IDeliveryZone (models/DeliveryZone.ts).
 */
export interface DeliveryZone {
  _id: string;
  code: string;
  name: string;
  description?: string;
  areas: DeliveryZoneArea[];
  baseCharge: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryMinimumAmount?: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  isActive: boolean;
  /**
   * Explicit override weight. When two zones match at the same specificity
   * tier, the higher priority wins, so a specific zone can override a broader
   * one. Mirrors the backend field of the same name.
   */
  priority: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Pagination envelope returned by the backend list controllers. */
export interface DeliveryZonePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Delivery zone area input for create/update. */
export interface DeliveryZoneAreaInput {
  district?: string;
  area?: string;
  postalCode?: string;
  country?: string;
  aliases?: string[];
  /** Rule-level charge (0 valid). Omit to use the zone base charge. */
  charge?: number;
  ruleType?: DeliveryRuleType;
  customerName?: string;
  customerNameBn?: string;
  description?: string;
  descriptionBn?: string;
  keywords?: string[];
}

/** POST delivery-zone body (createDeliveryZoneSchema). */
export interface CreateDeliveryZoneInput {
  code: string;
  name: string;
  description?: string;
  areas: DeliveryZoneAreaInput[];
  baseCharge: number;
  freeDeliveryEnabled?: boolean;
  freeDeliveryMinimumAmount?: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  isActive?: boolean;
  /**
   * Higher wins when two zones match at the same specificity tier. Optional -
   * the backend defaults it to 0.
   */
  priority?: number;
  sortOrder?: number;
}

/** PATCH delivery-zone body (updateDeliveryZoneSchema). */
export interface UpdateDeliveryZoneInput {
  code?: string;
  name?: string;
  description?: string;
  areas?: DeliveryZoneAreaInput[];
  baseCharge?: number;
  freeDeliveryEnabled?: boolean;
  freeDeliveryMinimumAmount?: number;
  estimatedMinDays?: number;
  estimatedMaxDays?: number;
  isActive?: boolean;
  priority?: number;
  sortOrder?: number;
}