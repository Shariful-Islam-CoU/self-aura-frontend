'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/providers/AuthProvider';
import { getFirstAccessibleNavPath } from '@/constants/navigation';
import { ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import {
  DashboardHeader,
  DashboardFilters,
  SummaryCards,
  SalesTrendChart,
  RecentOrders,
  LowStockProducts,
  DashboardSkeleton,
} from '@/features/dashboard/components';
import { dashboardService, DashboardService } from '@/features/dashboard/services/dashboardService';
import type { DashboardData, DateRangePreset, SalesTrendData, RecentOrder, LowStockProduct } from '@/features/dashboard/types';
import { formatDateRange, formatDateRangeFromDates } from '@/lib/dateUtils';

export default function DashboardPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  // The dashboard aggregates reports.dashboard data; staff (and custom roles
  // without reports.dashboard) see a permission state instead of a fetch 403.
  const canViewDashboard = canAccess("reports.dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [salesTrendData, setSalesTrendData] = useState<SalesTrendData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('last30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const fetchDashboardData = useCallback(async () => {
    try {
      const dateRange = DashboardService.buildDateRange(selectedPreset);
      const query = {
        startDate: customStartDate || dateRange.startDate,
        endDate: customEndDate || dateRange.endDate,
      };

      const [dashboard, salesTrend, orders, lowStock] = await Promise.all([
        dashboardService.getDashboard(query),
        dashboardService.getSalesTrend({ ...query, groupBy }),
        dashboardService.getRecentOrders(10),
        dashboardService.getLowStockProducts(),
      ]);

      setDashboardData(dashboard);
      setSalesTrendData(salesTrend);
      setRecentOrders(orders);
      setLowStockProducts(lowStock);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedPreset, customStartDate, customEndDate, groupBy]);

  useEffect(() => {
    // The fetch is invoked through a locally-defined async function so the
    // effect body contains no synchronous state updates. Users without the
    // reports.dashboard permission render the denied state before the loading
    // check, so no state reset is needed here.
    if (!canViewDashboard) {
      return;
    }
    const init = async () => {
      await fetchDashboardData();
    };
    void init();
  }, [fetchDashboardData, canViewDashboard]);

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  const handleRefresh = () => {
    setError(null);
    setIsRefreshing(true);
    void fetchDashboardData();
  };

  const dateRangeLabel = customStartDate && customEndDate
    ? formatDateRangeFromDates(customStartDate, customEndDate)
    : formatDateRange(selectedPreset);

  if (!canViewDashboard) {
    return (
      <PageContainer>
        <div className="flex min-h-[50vh] items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Access denied</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You do not have permission to view the dashboard overview. If you
              believe this is a mistake, contact an Owner to review your role
              and permissions.
            </p>
            <Link
              href={getFirstAccessibleNavPath(canAccess)}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to an area you can access
            </Link>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (isLoading && !dashboardData) {
    return (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/** Consistent vertical rhythm between dashboard sections:
          header, filters, summary cards, chart, and side-by-side sections. */}
      <div className="space-y-6">
        {error && (
          <div>
            <ErrorState
              title="Unable to load dashboard data"
              description={error}
              onRetry={handleRefresh}
              retryLabel="Try again"
            />
          </div>
        )}

        <DashboardHeader
          dateRange={dateRangeLabel}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <DashboardFilters
          selectedPreset={selectedPreset}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onPresetChange={handlePresetChange}
          onCustomDateChange={handleCustomDateChange}
          isLoading={isLoading || isRefreshing}
        />

        <SummaryCards data={dashboardData} isLoading={isLoading} />

        <SalesTrendChart
          data={salesTrendData}
          isLoading={isLoading}
          onGroupByChange={setGroupBy}
          currentGroupBy={groupBy}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentOrders
            orders={recentOrders}
            isLoading={isLoading}
            onViewOrder={(orderId) => router.push(`/orders/${orderId}`)}
          />
          <LowStockProducts
            products={lowStockProducts}
            isLoading={isLoading}
          />
        </div>
      </div>
    </PageContainer>
  );
}