"use client";

// Daily summary report (GET /reports/daily-summary, owner/manager only).
// Backend returns one row per day (no totals payload), so this panel renders
// only the backend rows as a table plus a trend chart of two of the returned
// fields (net sales and profit). No totals are derived on the frontend.

import { useState } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportFilters } from "./ReportFilters";
import { ReportDateRange } from "./ReportDateRange";
import { ReportTable } from "./ReportTable";
import { ReportChart } from "./ReportChart";
import { ReportExportActions } from "./ReportExportActions";
import { reportClient } from "../services/reportService";
import { buildReportDateRange, reportErrorMessage } from "../utils";
import { useReportQuery } from "../hooks/useReportQuery";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { DailySummaryQuery, DailySummaryReportData, DailySummaryRow, ReportDatePreset } from "../types";

const DEFAULT_PRESET: ReportDatePreset = "thisMonth";

export function DailySummaryReport() {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [query, setQuery] = useState<DailySummaryQuery>(buildReportDateRange(DEFAULT_PRESET));

  const { data, isLoading, error, status, refresh } = useReportQuery<DailySummaryReportData>(
    () => reportClient.getDailySummary(query),
    JSON.stringify(query)
  );

  const invalidRange = startDate && endDate && startDate > endDate;
  const rangeError = invalidRange ? "End date must be on or after the start date." : null;

  const apply = () => {
    if (invalidRange) return;
    let start = startDate;
    let end = endDate;
    if (preset !== "custom") {
      const range = buildReportDateRange(preset);
      start = range.startDate ?? "";
      end = range.endDate ?? "";
    }
    setQuery({ startDate: start || undefined, endDate: end || undefined });
  };

  const reset = () => {
    setPreset(DEFAULT_PRESET);
    setStartDate("");
    setEndDate("");
    setQuery(buildReportDateRange(DEFAULT_PRESET));
  };

  const items: DailySummaryRow[] = data?.items ?? [];
  const chartData = items.map((row) => ({
    date: row.date,
    netSales: row.netSales,
    profit: row.profit,
  }));

  const columns = [
    {
      header: "Date",
      cell: (row: DailySummaryRow) => <span className="font-medium">{row.date}</span>,
    },
    {
      header: "Orders",
      cell: (row: DailySummaryRow) => formatNumber(row.orderCount),
      align: "right" as const,
    },
    {
      header: "Net Sales",
      cell: (row: DailySummaryRow) => formatCurrency(row.netSales),
      align: "right" as const,
    },
    {
      header: "COGS",
      cell: (row: DailySummaryRow) => formatCurrency(row.cogs),
      align: "right" as const,
    },
    {
      header: "Received",
      cell: (row: DailySummaryRow) => formatCurrency(row.received),
      align: "right" as const,
    },
    {
      header: "Refunds",
      cell: (row: DailySummaryRow) => formatCurrency(row.refunds),
      align: "right" as const,
    },
    {
      header: "Net Received",
      cell: (row: DailySummaryRow) => formatCurrency(row.netReceived),
      align: "right" as const,
    },
    {
      header: "Expenses",
      cell: (row: DailySummaryRow) => formatCurrency(row.expenses),
      align: "right" as const,
    },
    {
      header: "Profit",
      cell: (row: DailySummaryRow) => formatCurrency(row.profit),
      align: "right" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Daily Summary</h2>
          <p className="text-sm text-muted-foreground">
            Backend-computed per-day summary (GET /reports/daily-summary).
          </p>
        </div>
        <ReportExportActions reportName="daily summary" className="shrink-0" />
      </div>

      <ReportFilters loading={isLoading} onApply={apply} onReset={reset} error={rangeError}>
        <ReportDateRange
          preset={preset}
          startDate={startDate}
          endDate={endDate}
          onChange={(nextPreset, start, end) => {
            setPreset(nextPreset);
            setStartDate(start);
            setEndDate(end);
          }}
          disabled={isLoading}
        />
      </ReportFilters>

      {error && !data ? (
        <ErrorState
          title={status === 403 ? "Permission required" : "Unable to load the report"}
          description={
            status === 403
              ? "You do not have permission to view this report. Contact an owner or manager."
              : reportErrorMessage(error)
          }
          onRetry={refresh}
        />
      ) : (
        <>
          <ReportChart
            title="Daily Net Sales &amp; Profit"
            description="Two of the backend-returned daily figures, plotted per day."
            data={chartData}
            xKey="date"
            lines={[
              { key: "netSales", name: "Net Sales", color: "#3b82f6", format: "currency" },
              {
                key: "profit",
                name: "Profit",
                color: "#22c55e",
                format: "currency",
                yAxisId: "right",
              },
            ]}
            ariaLabel="Daily summary chart showing net sales and profit for each day in the selected period."
            loading={isLoading}
          />
          <ReportTable
            columns={columns}
            rows={items}
            rowKey={(row) => row.date}
            caption={`Daily summary for ${data?.fromDate ?? ""} to ${data?.toDate ?? ""} (${
              items.length
            } days)`}
            loading={isLoading}
            error={error}
            onRetry={refresh}
            emptyTitle="No daily data"
            emptyDescription="No daily summary rows were returned for this period."
          />
        </>
      )}
    </div>
  );
}