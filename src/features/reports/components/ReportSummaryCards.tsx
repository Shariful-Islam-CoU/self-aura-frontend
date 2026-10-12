"use client";

// Reusable summary metric cards. Values are pre-formatted strings produced
// from the backend report payload - the cards themselves never compute or
// re-derive any business metric.

import { Card, CardContent } from "@/components/ui/Card";

export interface ReportMetric {
  label: string;
  value: string;
  hint?: string;
}

export interface ReportSummaryCardsProps {
  metrics: ReportMetric[];
  loading: boolean;
}

export function ReportSummaryCards({ metrics, loading }: ReportSummaryCardsProps) {
  if (loading && metrics.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-7 w-28 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (metrics.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{metric.value}</p>
            {metric.hint && <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}