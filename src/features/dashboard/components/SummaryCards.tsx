// Summary Cards - Display dashboard metrics (all values are backend-computed)

import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatNumber } from '@/lib/currency';
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  Receipt,
  Boxes,
  CreditCard,
} from 'lucide-react';
import type { DashboardData } from '../types';

type AccentKey = 'primary' | 'success' | 'warning' | 'destructive' | 'info';

const ACCENTS: Record<AccentKey, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
};

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent: AccentKey;
}

function MetricCard({ title, value, icon, accent }: MetricCardProps) {
  return (
    <Card className="transition-all duration-200 hover:border-primary/25 hover:shadow-md">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ACCENTS[accent]}`}
            aria-hidden="true"
          >
            {icon}
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

interface SummaryCardsProps {
  data: DashboardData | null;
  isLoading: boolean;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <span className="animate-pulse h-4 w-20 rounded bg-muted" />
              <span className="animate-pulse h-10 w-10 rounded-lg bg-muted" />
            </div>
            <span className="mt-3 block h-7 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const { sales, expenses, netProfit, grossProfit, customers, inventory, payments } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Sales"
        value={formatCurrency(sales.netSales)}
        icon={<ShoppingCart className="h-5 w-5" aria-hidden="true" />}
        accent="primary"
      />
      <MetricCard
        title="Total Orders"
        value={formatNumber(sales.orderCount)}
        icon={<Package className="h-5 w-5" aria-hidden="true" />}
        accent="info"
      />
      <MetricCard
        title="Gross Profit"
        value={formatCurrency(grossProfit)}
        icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
        accent="success"
      />
      <MetricCard
        title="Net Profit"
        value={formatCurrency(netProfit)}
        icon={<DollarSign className="h-5 w-5" aria-hidden="true" />}
        accent={netProfit >= 0 ? 'success' : 'destructive'}
      />
      <MetricCard
        title="Total Expenses"
        value={formatCurrency(expenses.total)}
        icon={<Receipt className="h-5 w-5" aria-hidden="true" />}
        accent="warning"
      />
      <MetricCard
        title="Customers"
        value={formatNumber(customers.totalCustomers)}
        icon={<Users className="h-5 w-5" aria-hidden="true" />}
        accent="info"
      />
      <MetricCard
        title="Inventory Value"
        value={formatCurrency(inventory.sellingValue)}
        icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
        accent="success"
      />
      <MetricCard
        title="Payments Received"
        value={formatCurrency(payments.netReceived)}
        icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
        accent="info"
      />
    </div>
  );
}