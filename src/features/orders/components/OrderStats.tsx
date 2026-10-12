"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { ShoppingCart, CheckCircle2, XCircle, Banknote } from "lucide-react";
import { formatCurrencyCompact, formatNumber } from "@/lib/currency";
import type { SalesStatsTotals } from "../types";

interface OrderStatsProps {
  totals: SalesStatsTotals | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface StatCardProps {
  title: string;
  subtitle: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
}

function StatCard({ title, subtitle, value, icon, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${iconColor} bg-primary/10`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-muted-foreground">
              {title}{" "}
              <span className="text-xs font-normal text-muted-foreground/70">
                {subtitle}
              </span>
            </p>
            <p className="mt-0.5 truncate text-xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-none animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-6 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// All values come from GET /reports/sales (backend-computed, scoped to the
// report date range which defaults to the current month).
export function OrderStats({ totals, isLoading, error, onRetry }: OrderStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ErrorState
            title="Unable to load order statistics."
            description={error}
            onRetry={onRetry}
            retryLabel="Try again"
          />
        </CardContent>
      </Card>
    );
  }

  if (!totals) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total orders"
        subtitle="this month"
        value={formatNumber(totals.orderCount)}
        icon={<ShoppingCart className="h-5 w-5" aria-hidden="true" />}
        iconColor="text-primary"
      />
      <StatCard
        title="Completed"
        subtitle="this month"
        value={formatNumber(totals.completedCount)}
        icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
        iconColor="text-success"
      />
      <StatCard
        title="Cancelled"
        subtitle="this month"
        value={formatNumber(totals.cancelledCount)}
        icon={<XCircle className="h-5 w-5" aria-hidden="true" />}
        iconColor="text-destructive"
      />
      <StatCard
        title="Net sales"
        subtitle="this month"
        value={formatCurrencyCompact(totals.netSales)}
        icon={<Banknote className="h-5 w-5" aria-hidden="true" />}
        iconColor="text-info"
      />
    </div>
  );
}