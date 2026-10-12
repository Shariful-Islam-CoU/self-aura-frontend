"use client";

// Profit & Loss report (GET /reports/profit-loss, owner/manager only).
// The backend calculation is authoritative: every figure here (revenue, COGS,
// gross profit, operating expenses, net profit, and the returns adjustment) is
// displayed exactly as returned. Nothing is derived or combined on the client.

import { useState } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportFilters } from "./ReportFilters";
import { ReportDateRange } from "./ReportDateRange";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportChart } from "./ReportChart";
import { ReportExportActions } from "./ReportExportActions";
import { reportClient } from "../services/reportService";
import { buildReportDateRange, reportErrorMessage } from "../utils";
import { useReportQuery } from "../hooks/useReportQuery";
import { formatCurrency } from "@/lib/currency";
import type { ProfitLossData, ProfitLossQuery, ReportDatePreset } from "../types";

const DEFAULT_PRESET: ReportDatePreset = "thisMonth";

export function ProfitLossReport() {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [query, setQuery] = useState<ProfitLossQuery>(buildReportDateRange(DEFAULT_PRESET));

  const { data, isLoading, error, status, refresh } = useReportQuery<ProfitLossData>(
    () => reportClient.getProfitLoss(query),
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

  const metrics = data
    ? [
        { label: "Gross Sales", value: formatCurrency(data.grossSales) },
        { label: "Discount", value: formatCurrency(data.discount) },
        { label: "Returns Adjustment", value: formatCurrency(data.returnsAdjustment) },
        { label: "Net Sales", value: formatCurrency(data.netSales) },
        { label: "Cost of Goods Sold", value: formatCurrency(data.cogs) },
        { label: "Gross Profit", value: formatCurrency(data.grossProfit) },
        { label: "Operating Expenses", value: formatCurrency(data.operatingExpenses) },
        { label: "Net Profit", value: formatCurrency(data.netProfit) },
      ]
    : [];

  const chartData = data
    ? [
        { name: "Gross Sales", value: data.grossSales },
        { name: "Discount", value: data.discount },
        { name: "Returns Adj.", value: data.returnsAdjustment },
        { name: "Net Sales", value: data.netSales },
        { name: "COGS", value: data.cogs },
        { name: "Gross Profit", value: data.grossProfit },
        { name: "Operating Exp.", value: data.operatingExpenses },
        { name: "Net Profit", value: data.netProfit },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Profit &amp; Loss</h2>
          <p className="text-sm text-muted-foreground">
            Backend-computed profit and loss statement (GET /reports/profit-loss).
          </p>
        </div>
        <ReportExportActions reportName="profit & loss" className="shrink-0" />
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
          <ReportSummaryCards metrics={metrics} loading={isLoading} />
          <ReportChart
            title="Profit &amp; Loss Breakdown"
            description="Backend-provided statement figures for the selected period."
            data={chartData}
            xKey="name"
            lines={[{ key: "value", name: "Amount", color: "#3b82f6", format: "currency" }]}
            ariaLabel="Bar chart of the backend profit and loss statement figures: gross sales, discount, returns adjustment, net sales, cost of goods sold, gross profit, operating expenses, and net profit."
            loading={isLoading}
            variant="bar"
          />
        </>
      )}
    </div>
  );
}