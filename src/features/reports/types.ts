// Report types mirroring the backend contract exactly.
// Backend source of truth: self_aura_backend/src/types/report.ts.
// The backend performs every report calculation; the frontend only renders
// the values the API returns. Nothing here is derived on the client.

import type { OrderSource } from "@/features/orders/types";
import type { PurchaseStatus } from "@/features/purchases/types";
import type { PaymentMethod, PaymentType } from "@/features/payments/constants";
import type { ReturnStatus, RefundStatus } from "@/features/returns/constants";
import type { ExpensePaymentMethod, InventoryTransactionType } from "./constants";

export interface ReportRangeRef {
  fromDate: string;
  toDate: string;
}

export interface SalesTotals {
  orderCount: number;
  completedCount: number;
  cancelledCount: number;
  returnedCount: number;
  grossSales: number;
  discount: number;
  deliveryCharges: number;
  netSales: number;
  averageOrderValue: number;
}

export interface SalesSeriesRow {
  period: string;
  orderCount: number;
  completedCount: number;
  grossSales: number;
  netSales: number;
}

export interface SalesReportData extends ReportRangeRef {
  source?: OrderSource;
  customerId?: string;
  productId?: string;
  categoryId?: string;
  groupBy?: string;
  totals: SalesTotals;
  series?: SalesSeriesRow[];
}

export interface PurchaseTotals {
  purchaseCount: number;
  receivedCount: number;
  draftCount: number;
  cancelledCount: number;
  totalSpent: number;
  supplierCount: number;
}

export interface PurchaseSeriesRow {
  period: string;
  purchaseCount: number;
  receivedCount: number;
  totalSpent: number;
}

export interface PurchasesReportData extends ReportRangeRef {
  supplierId?: string;
  status?: PurchaseStatus;
  groupBy?: string;
  totals: PurchaseTotals;
  series?: PurchaseSeriesRow[];
}

export interface PaymentTotals {
  received: number;
  receivedCount: number;
  refunds: number;
  refundCount: number;
  netReceived: number;
}

export interface PaymentSeriesRow {
  period: string;
  received: number;
  refunds: number;
  netReceived: number;
  receivedCount: number;
  refundCount: number;
}

export interface PaymentsReportData extends ReportRangeRef {
  paymentMethod?: PaymentMethod;
  paymentType?: PaymentType;
  customerId?: string;
  orderId?: string;
  groupBy?: string;
  totals: PaymentTotals;
  series?: PaymentSeriesRow[];
}

export interface ExpenseTotals {
  expenseCount: number;
  totalExpenses: number;
  categoryCount: number;
}

export interface ExpenseSeriesRow {
  period: string;
  expenseCount: number;
  totalExpenses: number;
}

export interface ExpensesReportData extends ReportRangeRef {
  categoryId?: string;
  paymentMethod?: ExpensePaymentMethod;
  groupBy?: string;
  totals: ExpenseTotals;
  series?: ExpenseSeriesRow[];
}

export interface ProfitLossData extends ReportRangeRef {
  grossSales: number;
  discount: number;
  returnsAdjustment: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
}

export interface InventoryTotals {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockUnits: number;
  costValue: number;
  sellingValue: number;
}

export interface InventoryReportData {
  categoryId?: string;
  totals: InventoryTotals;
}

export interface InventoryMovementTotals {
  movementCount: number;
  stockInCount: number;
  stockOutCount: number;
  adjustmentCount: number;
  returnInCount: number;
  returnOutCount: number;
  unitsIn: number;
  unitsOut: number;
  unitsAdjusted: number;
}

export interface InventoryMovementSeriesRow {
  period: string;
  movementCount: number;
  unitsIn: number;
  unitsOut: number;
}

export interface InventoryMovementsReportData extends ReportRangeRef {
  productId?: string;
  type?: InventoryTransactionType;
  groupBy?: string;
  totals: InventoryMovementTotals;
  series?: InventoryMovementSeriesRow[];
}

export interface CustomerTotals {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customersWithOrders: number;
  repeatCustomers: number;
  totalCustomerOrders: number;
  totalCustomerSales: number;
}

export interface CustomerSeriesRow {
  period: string;
  newCustomers: number;
  orders: number;
  sales: number;
}

export interface CustomersReportData extends ReportRangeRef {
  groupBy?: string;
  totals: CustomerTotals;
  series?: CustomerSeriesRow[];
}

export interface ReturnTotals {
  returnCount: number;
  requestedCount: number;
  approvedCount: number;
  rejectedCount: number;
  receivedCount: number;
  completedCount: number;
  cancelledCount: number;
  returnedQuantity: number;
  refundedAmount: number;
}

export interface ReturnSeriesRow {
  period: string;
  returnCount: number;
  returnedQuantity: number;
  refundedAmount: number;
}

export interface ReturnsReportData extends ReportRangeRef {
  status?: ReturnStatus;
  refundStatus?: RefundStatus;
  groupBy?: string;
  totals: ReturnTotals;
  series?: ReturnSeriesRow[];
}

export interface DeliveryTotals {
  shipmentCount: number;
  pendingCount: number;
  readyToShipCount: number;
  shippedCount: number;
  inTransitCount: number;
  deliveredCount: number;
  deliveryFailedCount: number;
  returnedToSellerCount: number;
  cancelledCount: number;
  avgDeliveryTimeDays: number;
}

export interface DeliverySeriesRow {
  period: string;
  shipmentCount: number;
  deliveredCount: number;
  deliveryFailedCount: number;
}

export interface CourierDeliveryRow {
  courierId: string;
  courierName: string;
  shipmentCount: number;
  deliveredCount: number;
  deliveryFailedCount: number;
}

export interface DeliveryReportData extends ReportRangeRef {
  courierId?: string;
  groupBy?: string;
  totals: DeliveryTotals;
  series?: DeliverySeriesRow[];
  couriers?: CourierDeliveryRow[];
}

export interface ProductPerformanceRow {
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  orderCount: number;
  grossSales: number;
  discount: number;
  netSales: number;
  cogs: number;
  profit: number;
}

export interface ProductPerformanceTotals {
  productCount: number;
  quantitySold: number;
  orderCount: number;
  grossSales: number;
  netSales: number;
  cogs: number;
  profit: number;
}

export interface ProductsReportData extends ReportRangeRef {
  productId?: string;
  categoryId?: string;
  source?: OrderSource;
  totals: ProductPerformanceTotals;
  items: ProductPerformanceRow[];
}

export interface CategoryPerformanceRow {
  categoryId: string | null;
  categoryName: string;
  quantitySold: number;
  orderCount: number;
  grossSales: number;
  netSales: number;
  cogs: number;
  profit: number;
}

export interface CategoriesReportData extends ReportRangeRef {
  categoryId?: string;
  source?: OrderSource;
  totals: ProductPerformanceTotals;
  items: CategoryPerformanceRow[];
}

export interface DailySummaryRow {
  date: string;
  orderCount: number;
  netSales: number;
  cogs: number;
  received: number;
  refunds: number;
  netReceived: number;
  expenses: number;
  receivedCount: number;
  refundCount: number;
  profit: number;
}

export interface DailySummaryReportData extends ReportRangeRef {
  items: DailySummaryRow[];
}

export interface DashboardSales {
  orderCount: number;
  completedCount: number;
  grossSales: number;
  discount: number;
  deliveryCharges: number;
  netSales: number;
  averageOrderValue: number;
}

export interface DashboardData extends ReportRangeRef {
  sales: DashboardSales;
  cogs: number;
  grossProfit: number;
  expenses: { total: number; count: number };
  netProfit: number;
  customers: CustomerTotals;
  payments: PaymentTotals;
  returns: ReturnTotals;
  inventory: InventoryTotals;
}

// ---------------------------------------------------------------------------
// Query parameter shapes mirroring the backend validators
// (self_aura_backend/src/validators/reportValidators.ts). Every field marked
// optional here is optional on the API; the backend re-validates every
// request, so the frontend never has to emulate its rules.
// ---------------------------------------------------------------------------

export interface DashboardQuery {
  startDate?: string;
  endDate?: string;
}

export interface SalesQuery extends DashboardQuery {
  source?: OrderSource;
  customerId?: string;
  productId?: string;
  categoryId?: string;
  groupBy?: string;
}

export interface PurchasesQuery extends DashboardQuery {
  supplierId?: string;
  status?: PurchaseStatus;
  groupBy?: string;
}

export interface PaymentsQuery extends DashboardQuery {
  paymentMethod?: PaymentMethod;
  paymentType?: PaymentType;
  customerId?: string;
  orderId?: string;
  groupBy?: string;
}

export interface ExpensesQuery extends DashboardQuery {
  categoryId?: string;
  paymentMethod?: ExpensePaymentMethod;
  groupBy?: string;
}

export interface ProfitLossQuery {
  startDate?: string;
  endDate?: string;
}

export interface InventoryQuery {
  categoryId?: string;
}

export interface InventoryMovementsQuery extends DashboardQuery {
  productId?: string;
  type?: InventoryTransactionType;
  groupBy?: string;
}

export interface CustomersQuery extends DashboardQuery {
  groupBy?: string;
}

export interface ReturnsQuery extends DashboardQuery {
  status?: ReturnStatus;
  refundStatus?: RefundStatus;
  groupBy?: string;
}

export interface DeliveryQuery extends DashboardQuery {
  courierId?: string;
  groupBy?: string;
}

export interface ProductsQuery extends DashboardQuery {
  productId?: string;
  categoryId?: string;
  source?: OrderSource;
}

export interface CategoriesQuery extends DashboardQuery {
  categoryId?: string;
  source?: OrderSource;
}

export type DailySummaryQuery = DashboardQuery;

// Frontend date-range presets. These only generate the start/end dates the
// backend then uses - the backend remains responsible for the report itself.
export type ReportDatePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "previousMonth"
  | "thisYear"
  | "custom";