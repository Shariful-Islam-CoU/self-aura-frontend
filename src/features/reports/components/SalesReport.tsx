"use client";

// Sales report (GET /reports/sales). Table-free: backend returns totals +
// optional series, all rendered as-is. Filters: date range, source, customer,
// product, category, groupBy.

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportFilters } from "./ReportFilters";
import { ReportDateRange } from "./ReportDateRange";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportChart } from "./ReportChart";
import { ReportExportActions } from "./ReportExportActions";
import { reportClient } from "../services/reportService";
import { ORDER_SOURCE_OPTIONS, SALES_GROUP_BY_OPTIONS } from "../constants";
import {
  buildReportDateRange,
  formatReportPeriod,
  reportErrorMessage,
  loadCustomerOptions,
  loadProductOptions,
  loadCategoryOptions,
} from "../utils";
import { useReportQuery, useReportSelectOptions } from "../hooks/useReportQuery";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { SalesQuery, SalesReportData, ReportDatePreset } from "../types";
import type { OrderSource } from "@/features/orders/types";

const DEFAULT_PRESET: ReportDatePreset = "thisMonth";

function defaultQuery(): SalesQuery {
  return { ...buildReportDateRange(DEFAULT_PRESET), groupBy: "day" };
}

export function SalesReport() {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [source, setSource] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [query, setQuery] = useState<SalesQuery>(defaultQuery);

  const { data, isLoading, error, status, refresh } = useReportQuery<SalesReportData>(
    () => reportClient.getSales(query),
    JSON.stringify(query)
  );
  const customerOptions = useReportSelectOptions(loadCustomerOptions, "customers");
  const productOptions = useReportSelectOptions(loadProductOptions, "products");
  const categoryOptions = useReportSelectOptions(loadCategoryOptions, "categories");

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
      source: (source || undefined) as OrderSource | undefined,
      customerId: customerId || undefined,
      productId: productId || undefined,
      categoryId: categoryId || undefined,
      groupBy: groupBy || undefined,
    });
  };

  const reset = () => {
    setPreset(DEFAULT_PRESET);
    setStartDate("");
    setEndDate("");
    setSource("");
    setCustomerId("");
    setProductId("");
    setCategoryId("");
    setGroupBy("day");
    setQuery(defaultQuery());
  };

  const totals = data?.totals;
  const series = data?.series ?? [];
  const chartData = series.map((row) => ({
    period: row.period,
    netSales: row.netSales,
    grossSales: row.grossSales,
    orders: row.orderCount,
  }));

  const metrics = totals
    ? [
        { label: "Net Sales", value: formatCurrency(totals.netSales) },
        { label: "Orders", value: formatNumber(totals.orderCount) },
        { label: "Average Order Value", value: formatCurrency(totals.averageOrderValue) },
        { label: "Gross Sales", value: formatCurrency(totals.grossSales) },
        { label: "Discount", value: formatCurrency(totals.discount) },
        { label: "Completed", value: formatNumber(totals.completedCount) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Sales Report</h2>
          <p className="text-sm text-muted-foreground">
            Backend-computed sales totals and trends (GET /reports/sales).
          </p>
        </div>
        <ReportExportActions reportName="sales" className="shrink-0" />
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Source"
            value={source}
            disabled={isLoading}
            placeholder="All sources"
            options={[...ORDER_SOURCE_OPTIONS]}
            onChange={(event) => setSource(event.target.value)}
          />
          <Select
            label="Customer"
            value={customerId}
            disabled={isLoading}
            placeholder="All customers"
            helperText={customerOptions.loading ? "Loading options..." : undefined}
            options={customerOptions.options}
            onChange={(event) => setCustomerId(event.target.value)}
          />
          <Select
            label="Product"
            value={productId}
            disabled={isLoading}
            placeholder="All products"
            helperText={productOptions.loading ? "Loading options..." : undefined}
            options={productOptions.options}
            onChange={(event) => setProductId(event.target.value)}
          />
          <Select
            label="Category"
            value={categoryId}
            disabled={isLoading}
            placeholder="All categories"
            helperText={categoryOptions.loading ? "Loading options..." : undefined}
            options={categoryOptions.options}
            onChange={(event) => setCategoryId(event.target.value)}
          />
          <Select
            label="Group by"
            value={groupBy}
            disabled={isLoading}
            options={SALES_GROUP_BY_OPTIONS}
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
            title="Sales Trend"
            description={groupBy ? `Grouped by ${groupBy}` : undefined}
            data={chartData}
            xKey="period"
            xTickFormatter={formatReportPeriod}
            lines={[
              { key: "netSales", name: "Net Sales", color: "#3b82f6", format: "currency" },
              {
                key: "grossSales",
                name: "Gross Sales",
                color: "#22c55e",
                format: "currency",
                dashed: true,
              },
              { key: "orders", name: "Orders", color: "#f59e0b", format: "number", yAxisId: "right" },
            ]}
            ariaLabel="Sales trend chart showing net sales, gross sales, and order count over the selected period."
            loading={isLoading}
          />
        </>
      )}
    </div>
  );
}