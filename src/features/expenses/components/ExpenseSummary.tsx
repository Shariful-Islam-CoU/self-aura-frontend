"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Wallet, ReceiptText } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { ExpenseSummaryData } from "../types";

interface ExpenseSummaryProps {
  summary: ExpenseSummaryData | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function StatCard({
  title,
  value,
  icon,
  iconColor,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
}) {
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

export function ExpenseSummary({ summary, isLoading, error, onRetry }: ExpenseSummaryProps) {
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
            title="Unable to load expense summary."
            description={error}
            onRetry={onRetry}
            retryLabel="Try again"
          />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const topCategory = summary.byCategory[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total expenses (filtered)"
        value={formatCurrency(summary.summary.total)}
        icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
        iconColor="text-primary"
      />
      <StatCard
        title="Expense count (filtered)"
        value={formatNumber(summary.summary.count)}
        icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
        iconColor="text-info"
      />
      <StatCard
        title={topCategory ? `Top category: ${topCategory.categoryName}` : "Top category"}
        value={topCategory ? formatCurrency(topCategory.total) : "—"}
        icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
        iconColor="text-success"
      />
    </div>
  );
}