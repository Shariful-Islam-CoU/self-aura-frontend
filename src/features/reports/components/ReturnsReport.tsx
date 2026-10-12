"use client";

// Returns report (GET /reports/returns, owner/manager only). Backend returns
// totals + optional series. Filters: date range, return status, refund status,
// groupBy (day | week | month | status).

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportFilters } from "./ReportFilters";
import { ReportDateRange } from "./ReportDateRange";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportChart } from "./ReportChart";
import { ReportExportActions } from "./ReportExportActions";
import { reportClient } from "../services/reportService";
import { RETURNS_GROUP_BY_OPTIONS, RETURN_STATUS_OPTIONS, REFUND_STATUS_OPTIONS } from "../constants";
import { buildReportDateRange, formatReportPeriod, reportErrorMessage } from "../utils";
import { useReportQuery } from "../hooks/useReportQuery";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { ReturnsQuery, ReturnsReportData, ReportDatePreset } from "../types";
import type { ReturnStatus, RefundStatus } from "@/features/returns/constants";

const DEFAULT_PRESET: ReportDatePreset = "thisMonth";

function defaultQuery(): ReturnsQuery {
  return { ...buildReportDateRange(DEFAULT_PRESET), groupBy: "day" };
}

export function ReturnsReport() {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [refundStatus, setRefundStatus] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [query, setQuery] = useState<ReturnsQuery>(defaultQuery);

  const { data, isLoading, error, status: statusCode, refresh } = useReportQuery<ReturnsReportData>(
    () => reportClient.getReturns(query),
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
    setQuery({
      startDate: start || undefined,
      endDate: end || undefined,
      status: (status || undefined) as ReturnStatus | undefined,
      refundStatus: (refundStatus || undefined) as RefundStatus | undefined,
      groupBy: groupBy || undefined,
    });
  };

  const reset = () => {
    setPreset(DEFAULT_PRESET);
    setStartDate("");
    setEndDate("");
    setStatus("");
    setRefundStatus("");
    setGroupBy("day");
    setQuery(defaultQuery());
  };

  const totals = data?.totals;
  const series = data?.series ?? [];
  const chartData = series.map((row) => ({
    period: row.period,
    returnCount: row.returnCount,
    refundedAmount: row.refundedAmount,
  }));

  const metrics = totals
    ? [
        { label: "Returns", value: formatNumber(totals.returnCount) },
        { label: "Refunded Amount", value: formatCurrency(totals.refundedAmount) },
        { label: "Returned Quantity", value: formatNumber(totals.returnedQuantity) },
        { label: "Approved", value: formatNumber(totals.approvedCount) },
        { label: "Completed", value: formatNumber(totals.completedCount) },
        { label: "Cancelled", value: formatNumber(totals.cancelledCount) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Returns Report</h2>
          <p className="text-sm text-muted-foreground">
            Backend-computed return totals and trends (GET /reports/returns).
          </p>
        </div>
        <ReportExportActions reportName="returns" className="shrink-0" />
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Return status"
            value={status}
            disabled={isLoading}
            placeholder="All statuses"
            options={[...RETURN_STATUS_OPTIONS]}
            onChange={(event) => setStatus(event.target.value)}
          />
          <Select
            label="Refund status"
            value={refundStatus}
            disabled={isLoading}
            placeholder="All statuses"
            options={[...REFUND_STATUS_OPTIONS]}
            onChange={(event) => setRefundStatus(event.target.value)}
          />
          <Select
            label="Group by"
            value={groupBy}
            disabled={isLoading}
            options={RETURNS_GROUP_BY_OPTIONS}
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
            title="Return Trend"
            description={groupBy ? `Grouped by ${groupBy}` : undefined}
            data={chartData}
            xKey="period"
            xTickFormatter={formatReportPeriod}
            lines={[
              { key: "returnCount", name: "Returns", color: "#f59e0b", format: "number" },
              {
                key: "refundedAmount",
                name: "Refunded Amount",
                color: "#ef4444",
                format: "currency",
                yAxisId: "right",
              },
            ]}
            ariaLabel="Return trend chart showing return count and refunded amount over the selected period."
            loading={isLoading}
          />
        </>
      )}
    </div>
  );
}