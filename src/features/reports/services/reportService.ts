// Report service - every report API call goes through this service, which uses
// the shared apiClient. Backend source of truth:
// self_aura_backend/src/routes/report.routes.ts (all GET, prefixed /reports).
//
// Permissions (backend requireRole):
//   - any authenticated staff: sales, inventory/movements, inventory,
//     customers, delivery
//   - owner/manager only: dashboard, purchases, expenses, payments, profit-loss,
//     returns, products, categories, daily-summary

import { apiClient } from "@/lib/api";
import type {
  CategoriesQuery,
  CategoriesReportData,
  CustomersQuery,
  CustomersReportData,
  DailySummaryQuery,
  DailySummaryReportData,
  DashboardData,
  DashboardQuery,
  DeliveryQuery,
  DeliveryReportData,
  ExpensesQuery,
  ExpensesReportData,
  InventoryMovementsQuery,
  InventoryMovementsReportData,
  InventoryQuery,
  InventoryReportData,
  PaymentsQuery,
  PaymentsReportData,
  ProductsQuery,
  ProductsReportData,
  ProfitLossData,
  ProfitLossQuery,
  PurchasesQuery,
  PurchasesReportData,
  ReturnsQuery,
  ReturnsReportData,
  SalesQuery,
  SalesReportData,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class ReportClient {
  private readonly basePath = "/reports";

  private getReport<T>(path: string, params?: object): Promise<T> {
    const query = params as Record<string, string | number | boolean | undefined> | undefined;
    return apiClient
      .get<ApiEnvelope<T>>(`${this.basePath}${path}`, { params: query })
      .then((response) => response.data);
  }

  getDashboard(query: DashboardQuery = {}): Promise<DashboardData> {
    return this.getReport<DashboardData>("/dashboard", query);
  }

  getSales(query: SalesQuery = {}): Promise<SalesReportData> {
    return this.getReport<SalesReportData>("/sales", query);
  }

  getPurchases(query: PurchasesQuery = {}): Promise<PurchasesReportData> {
    return this.getReport<PurchasesReportData>("/purchases", query);
  }

  getPayments(query: PaymentsQuery = {}): Promise<PaymentsReportData> {
    return this.getReport<PaymentsReportData>("/payments", query);
  }

  getExpenses(query: ExpensesQuery = {}): Promise<ExpensesReportData> {
    return this.getReport<ExpensesReportData>("/expenses", query);
  }

  getProfitLoss(query: ProfitLossQuery = {}): Promise<ProfitLossData> {
    return this.getReport<ProfitLossData>("/profit-loss", query);
  }

  getInventory(query: InventoryQuery = {}): Promise<InventoryReportData> {
    return this.getReport<InventoryReportData>("/inventory", query);
  }

  getInventoryMovements(
    query: InventoryMovementsQuery = {}
  ): Promise<InventoryMovementsReportData> {
    return this.getReport<InventoryMovementsReportData>("/inventory/movements", query);
  }

  getCustomers(query: CustomersQuery = {}): Promise<CustomersReportData> {
    return this.getReport<CustomersReportData>("/customers", query);
  }

  getReturns(query: ReturnsQuery = {}): Promise<ReturnsReportData> {
    return this.getReport<ReturnsReportData>("/returns", query);
  }

  getDelivery(query: DeliveryQuery = {}): Promise<DeliveryReportData> {
    return this.getReport<DeliveryReportData>("/delivery", query);
  }

  getProducts(query: ProductsQuery = {}): Promise<ProductsReportData> {
    return this.getReport<ProductsReportData>("/products", query);
  }

  getCategories(query: CategoriesQuery = {}): Promise<CategoriesReportData> {
    return this.getReport<CategoriesReportData>("/categories", query);
  }

  getDailySummary(query: DailySummaryQuery = {}): Promise<DailySummaryReportData> {
    return this.getReport<DailySummaryReportData>("/daily-summary", query);
  }
}

export const reportClient = new ReportClient();
export { ReportClient };