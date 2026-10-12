"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Users, UserCheck, UserPlus } from "lucide-react";
import { formatNumber } from "@/lib/currency";
import type { CustomerStatsTotals } from "../types";

interface CustomerStatsProps {
  totals: CustomerStatsTotals | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
}

function StatCard({ title, value, icon, iconColor }: StatCardProps) {
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
            <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
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

export function CustomerStats({ totals, isLoading, error, onRetry }: CustomerStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            title="Unable to load customer statistics."
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total customers"
        value={formatNumber(totals.totalCustomers)}
        icon={<Users className="h-5 w-5" aria-hidden="true" />}
        iconColor="text-primary"
      />
      <StatCard
        title="Active customers"
        value={formatNumber(totals.activeCustomers)}
        icon={<UserCheck className="h-5 w-5" aria-hidden="true" />}
        iconColor="text-success"
      />
      <StatCard
        title="New customers (this month)"
        value={formatNumber(totals.newCustomers)}
        icon={<UserPlus className="h-5 w-5" aria-hidden="true" />}
        iconColor="text-info"
      />
    </div>
  );
}