// Dashboard types based on backend report types
// Backend: src/types/report.ts

export interface ReportRangeRef {
  fromDate: string;
  toDate: string;
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

export interface CustomerTotals {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customersWithOrders: number;
  repeatCustomers: number;
  totalCustomerOrders: number;
  totalCustomerSales: number;
}

export interface PaymentTotals {
  received: number;
  receivedCount: number;
  refunds: number;
  refundCount: number;
  netReceived: number;
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

// Date range types
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'previousMonth'
  | 'custom';

export interface DateRange {
  startDate?: string;
  endDate?: string;
  preset?: DateRangePreset;
}

// Sales trend chart types
export interface SalesSeriesRow {
  period: string;
  orderCount: number;
  completedCount: number;
  grossSales: number;
  netSales: number;
}

export interface SalesTrendData {
  series: SalesSeriesRow[];
  dateGrouping: 'day' | 'week' | 'month';
}

// Recent orders
export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId?: string;
  date: string;
  total: number;
  status: string;
  paymentStatus: string;
  itemsCount: number;
}

// Low stock products
export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
}