// Report utilities: date-range generation (frontend convenience only),
// display formatting, and select-option loaders that back the report filters.
// No report calculation happens here - the backend owns every aggregation.

import { ApiError } from "@/lib/api";
import type { SelectOption } from "@/components/ui/Select";
import { customerService } from "@/features/customers/services/customerService";
import { productService } from "@/features/products/services/productService";
import { categoryService } from "@/features/categories/services/categoryService";
import { supplierService } from "@/features/suppliers/services/supplierService";
import { courierClient } from "@/features/couriers/services/courierService";
import type { ReportDatePreset } from "./types";

/**
 * Generates the start/end dates for a preset. This is a frontend convenience
 * that only produces dates - the backend remains responsible for every report
 * calculation and for its own date-range semantics.
 */
export function buildReportDateRange(
  preset: ReportDatePreset
): { startDate?: string; endDate?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  switch (preset) {
    case "today":
      return { startDate: formatDate(today), endDate: formatDate(today) };
    case "yesterday":
      return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
    case "last7days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: formatDate(start), endDate: formatDate(today) };
    }
    case "last30days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { startDate: formatDate(start), endDate: formatDate(today) };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatDate(start), endDate: formatDate(today) };
    }
    case "previousMonth": {
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: formatDate(start), endDate: formatDate(today) };
    }
    default:
      return {};
  }
}

/**
 * Light display formatter for backend series periods. Backend periods are
 * either date keys (YYYY-MM-DD, YYYY-Www, YYYY-MM) or entity names for
 * non-date groupings; only date-looking keys are shortened.
 */
export function formatReportPeriod(period: string): string {
  if (/^\d{4}-W\d{2}$/.test(period)) return period.slice(5);
  if (/^\d{4}-\d{2}$/.test(period)) return period.slice(5);
  return period;
}

/** Extracts a safe message from an API/unknown error. */
export function reportErrorMessage(
  error: unknown,
  fallback = "Unable to load the report. Please try again."
): string {
  if (error instanceof ApiError) return error.message || fallback;
  return fallback;
}

// ---------------------------------------------------------------------------
// Select-option loaders for the report entity filters. All list calls go
// through the existing feature services -> the shared apiClient.
// ---------------------------------------------------------------------------

export async function loadCustomerOptions(): Promise<SelectOption[]> {
  const data = await customerService.listCustomers({ page: 1, limit: 100 });
  return data.customers.map((customer) => ({ value: customer.id, label: customer.name }));
}

export async function loadProductOptions(): Promise<SelectOption[]> {
  const data = await productService.listProducts({ page: 1, limit: 100 });
  return data.items.map((product) => ({ value: product.id, label: product.name }));
}

export async function loadCategoryOptions(): Promise<SelectOption[]> {
  const data = await categoryService.listCategories();
  return data.map((category) => ({ value: category.id, label: category.name }));
}

export async function loadSupplierOptions(): Promise<SelectOption[]> {
  const data = await supplierService.listSuppliers({ page: 1, limit: 100 });
  return data.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }));
}

export async function loadCourierOptions(): Promise<SelectOption[]> {
  const data = await courierClient.listCouriers({ page: 1, limit: 100 });
  return data.couriers.map((courier) => ({ value: courier.id, label: courier.name }));
}