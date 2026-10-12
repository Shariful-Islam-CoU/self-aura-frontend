"use client";

// Customers report (GET /reports/customers). Backend returns customer totals +
// optional series. Filters: date range, groupBy (day | week | month). Rankings
// and activity figures come from the backend only.

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportFilters } from "./ReportFilters";
import { ReportDateRange } from "./ReportDateRange";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportChart } from "./ReportChart";
import { ReportExportActions } from "./ReportExportActions";
import { reportClient } from "../services/reportService";
import { CUSTOMERS_GROUP_BY_OPTIONS } from "../constants";
import { buildReportDateRange, formatReportPeriod, reportErrorMessage } from "../utils";
import { useReportQuery } from "../hooks/useReportQuery";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { CustomersQuery, CustomersReportData, ReportDatePreset } from "../types";

const DEFAULT_PRESET: ReportDatePreset = "thisMonth";

function defaultQuery(): CustomersQuery {
  return { ...buildReportDateRange(DEFAULT_PRESET), groupBy: "day" };
}

export function CustomerReport() {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [query, setQuery] = useState<CustomersQuery>(defaultQuery);

  const { data, isLoading, error, status, refresh } = useReportQuery<CustomersReportData>(
    () => reportClient.getCustomers(query),
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
      groupBy: groupBy || undefined,
    });
  };

  const reset = () => {
    setPreset(DEFAULT_PRESET);
    setStartDate("");
    setEndDate("");
    setGroupBy("day");
    setQuery(defaultQuery());
  };

  const totals = data?.totals;
  const series = data?.series ?? [];
  const chartData = series.map((row) => ({
    period: row.period,
    newCustomers: row.newCustomers,
    orders: row.orders,
    sales: row.sales,
  }));

  const metrics = totals
    ? [
        { label: "Total Customers", value: formatNumber(totals.totalCustomers) },
        { label: "New Customers", value: formatNumber(totals.newCustomers) },
        { label: "Active Customers", value: formatNumber(totals.activeCustomers) },
        { label: "With Orders", value: formatNumber(totals.customersWithOrders) },
        { label: "Repeat Customers", value: formatNumber(totals.repeatCustomers) },
        { label: "Customer Orders", value: formatNumber(totals.totalCustomerOrders) },
        { label: "Customer Sales", value: formatCurrency(totals.totalCustomerSales) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Customers Report</h2>
          <p className="text-sm text-muted-foreground">
            Backend-computed customer analytics (GET /reports/customers).
          </p>
        </div>
        <ReportExportActions reportName="customers" className="shrink-0" />
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
            label="Group by"
            value={groupBy}
            disabled={isLoading}
            options={CUSTOMERS_GROUP_BY_OPTIONS}
            onChange={(event) => setGroupBy(event.target.value)}
          />
        </div>
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
            title="Customer Activity"
            description={groupBy ? `Grouped by ${groupBy}` : undefined}
            data={chartData}
            xKey="period"
            xTickFormatter={formatReportPeriod}
            lines={[
              { key: "newCustomers", name: "New Customers", color: "#22c55e", format: "number" },
              { key: "orders", name: "Orders", color: "#3b82f6", format: "number" },
              { key: "sales", name: "Sales", color: "#f59e0b", format: "currency", yAxisId: "right" },
            ]}
            ariaLabel="Customer activity chart showing new customers, orders, and sales over the selected period."
            loading={isLoading}
          />
        </>
      )}
    </div>
  );
}