"use client";

// Purchases report (GET /reports/purchases, owner/manager only). Backend
// returns totals + optional series. Filters: date range, supplier, status,
// groupBy (day | week | month | supplier).

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportFilters } from "./ReportFilters";
import { ReportDateRange } from "./ReportDateRange";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportChart } from "./ReportChart";
import { ReportExportActions } from "./ReportExportActions";
import { reportClient } from "../services/reportService";
import { PURCHASES_GROUP_BY_OPTIONS, PURCHASE_STATUS_OPTIONS } from "../constants";
import { buildReportDateRange, formatReportPeriod, reportErrorMessage, loadSupplierOptions } from "../utils";
import { useReportQuery, useReportSelectOptions } from "../hooks/useReportQuery";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { PurchasesQuery, PurchasesReportData, ReportDatePreset } from "../types";
import type { PurchaseStatus } from "@/features/purchases/types";

const DEFAULT_PRESET: ReportDatePreset = "thisMonth";

function defaultQuery(): PurchasesQuery {
  return { ...buildReportDateRange(DEFAULT_PRESET), groupBy: "day" };
}

export function PurchasesReport() {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [query, setQuery] = useState<PurchasesQuery>(defaultQuery);

  const { data, isLoading, error, status: statusCode, refresh } = useReportQuery<PurchasesReportData>(
    () => reportClient.getPurchases(query),
    JSON.stringify(query)
  );
  const supplierOptions = useReportSelectOptions(loadSupplierOptions, "suppliers");

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
    setQuery({
      startDate: start || undefined,
      endDate: end || undefined,
      supplierId: supplierId || undefined,
      status: (status || undefined) as PurchaseStatus | undefined,
      groupBy: groupBy || undefined,
    });
  };

  const reset = () => {
    setPreset(DEFAULT_PRESET);
    setStartDate("");
    setEndDate("");
    setSupplierId("");
    setStatus("");
    setGroupBy("day");
    setQuery(defaultQuery());
  };

  const totals = data?.totals;
  const series = data?.series ?? [];
  const chartData = series.map((row) => ({
    period: row.period,
    totalSpent: row.totalSpent,
    purchases: row.purchaseCount,
  }));

  const metrics = totals
    ? [
        { label: "Total Spent", value: formatCurrency(totals.totalSpent) },
        { label: "Purchases", value: formatNumber(totals.purchaseCount) },
        { label: "Received", value: formatNumber(totals.receivedCount) },
        { label: "Draft", value: formatNumber(totals.draftCount) },
        { label: "Cancelled", value: formatNumber(totals.cancelledCount) },
        { label: "Suppliers", value: formatNumber(totals.supplierCount) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Purchases Report</h2>
          <p className="text-sm text-muted-foreground">
            Backend-computed purchase totals and trends (GET /reports/purchases).
          </p>
        </div>
        <ReportExportActions reportName="purchases" className="shrink-0" />
      </div>

      <ReportFilters
        loading={isLoading}
        onApply={apply}
        onReset={reset}
        error={rangeError}
      >
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Supplier"
            value={supplierId}
            disabled={isLoading}
            placeholder="All suppliers"
            helperText={supplierOptions.loading ? "Loading options..." : undefined}
            options={supplierOptions.options}
            onChange={(event) => setSupplierId(event.target.value)}
          />
          <Select
            label="Status"
            value={status}
            disabled={isLoading}
            placeholder="All statuses"
            options={[...PURCHASE_STATUS_OPTIONS]}
            onChange={(event) => setStatus(event.target.value)}
          />
          <Select
            label="Group by"
            value={groupBy}
            disabled={isLoading}
            options={PURCHASES_GROUP_BY_OPTIONS}
            onChange={(event) => setGroupBy(event.target.value)}
          />
        </div>
      </ReportFilters>

      {error && !data ? (
        <ErrorState
          title={statusCode === 403 ? "Permission required" : "Unable to load the report"}
          description={
            statusCode === 403
              ? "You do not have permission to view this report. Contact an owner or manager."
              : reportErrorMessage(error)
          }
          onRetry={refresh}
        />
      ) : (
        <>
          <ReportSummaryCards metrics={metrics} loading={isLoading} />
          <ReportChart
            title="Purchase Trend"
            description={groupBy ? `Grouped by ${groupBy}` : undefined}
            data={chartData}
            xKey="period"
            xTickFormatter={formatReportPeriod}
            lines={[
              { key: "totalSpent", name: "Total Spent", color: "#3b82f6", format: "currency" },
              {
                key: "purchases",
                name: "Purchases",
                color: "#f59e0b",
                format: "number",
                yAxisId: "right",
              },
            ]}
            ariaLabel="Purchase trend chart showing total spent and purchase count over the selected period."
            loading={isLoading}
          />
        </>
      )}
    </div>
  );
}