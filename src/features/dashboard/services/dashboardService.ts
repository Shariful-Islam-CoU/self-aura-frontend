// Dashboard service - handles all dashboard-related API calls
// Backend responses use the { success, message, data } envelope, so every
// method unwraps response.data before returning feature types.

import { apiClient } from '@/lib/api';
import type { ApiEnvelope } from '@/lib/api/types';
import type { OrderListData } from '@/features/orders/types';
import type {
  DashboardData,
  SalesTrendData,
  RecentOrder,
  LowStockProduct,
  DateRangePreset,
} from '../types';

interface DashboardQuery {
  startDate?: string;
  endDate?: string;
  [key: string]: string | number | boolean | undefined;
}

interface SalesTrendResponse {
  totals: {
    orderCount: number;
    completedCount: number;
    cancelledCount: number;
    returnedCount: number;
    grossSales: number;
    discount: number;
    deliveryCharges: number;
    netSales: number;
    averageOrderValue: number;
  };
  series: Array<{
    period: string;
    orderCount: number;
    completedCount: number;
    grossSales: number;
    netSales: number;
  }>;
}

interface LowStockApiItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
}

class DashboardService {
  private readonly basePath = '/reports';

  async getDashboard(query: DashboardQuery = {}): Promise<DashboardData> {
    const response = await apiClient.get<ApiEnvelope<DashboardData>>(`${this.basePath}/dashboard`, {
      params: query,
    });
    return response.data;
  }

  async getSalesTrend(query: DashboardQuery & { groupBy?: 'day' | 'week' | 'month' } = {}): Promise<SalesTrendData> {
    const response = await apiClient.get<ApiEnvelope<SalesTrendResponse>>(`${this.basePath}/sales`, {
      params: {
        ...query,
        groupBy: query.groupBy || 'day',
      },
    });

    return {
      series: response.data.series,
      dateGrouping: query.groupBy || 'day',
    };
  }

  async getRecentOrders(limit = 10): Promise<RecentOrder[]> {
    const response = await apiClient.get<ApiEnvelope<OrderListData>>('/orders', {
      params: {
        page: 1,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    });

    return response.data.orders.slice(0, limit).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name ?? order.customer?.id ?? 'Unknown',
      customerId: order.customer?.id,
      date: order.createdAt,
      total: order.total,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      itemsCount: order.items?.length ?? 0,
    }));
  }

  async getLowStockProducts(): Promise<LowStockProduct[]> {
    const response = await apiClient.get<ApiEnvelope<{ items: LowStockApiItem[] }>>('/inventory/low-stock');

    return response.data.items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      currentStock: item.stock,
      minStockLevel: item.lowStockThreshold,
    }));
  }

  // Helper to build date range from preset
  static buildDateRange(preset: DateRangePreset): { startDate?: string; endDate?: string } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        return { startDate: formatDate(today), endDate: formatDate(today) };
      case 'yesterday':
        return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
      case 'last7days': {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        return { startDate: formatDate(start), endDate: formatDate(today) };
      }
      case 'last30days': {
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        return { startDate: formatDate(start), endDate: formatDate(today) };
      }
      case 'thisMonth': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: formatDate(start), endDate: formatDate(today) };
      }
      case 'previousMonth': {
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
      default:
        return {};
    }
  }
}

export const dashboardService = new DashboardService();
export { DashboardService };