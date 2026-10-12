"use client";

// Product performance report (GET /reports/products, owner/manager only).
// Backend returns totals + an items table per product. Product ranking and all
// sales/COGS/profit figures are computed by the backend and rendered as-is;
// items are shown in the order the API returns them (no frontend sorting).

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportFilters } from "./ReportFilters";
import { ReportDateRange } from "./ReportDateRange";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportTable } from "./ReportTable";
import { ReportExportActions } from "./ReportExportActions";
import { reportClient } from "../services/reportService";
import { ORDER_SOURCE_OPTIONS } from "../constants";
import {
  buildReportDateRange,
  reportErrorMessage,
  loadProductOptions,
  loadCategoryOptions,
} from "../utils";
import { useReportQuery, useReportSelectOptions } from "../hooks/useReportQuery";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { ProductPerformanceRow, ProductsQuery, ProductsReportData, ReportDatePreset } from "../types";
import type { OrderSource } from "@/features/orders/types";

const DEFAULT_PRESET: ReportDatePreset = "thisMonth";

export function ProductPerformanceReport() {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [productId, setProductId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [source, setSource] = useState("");
  const [query, setQuery] = useState<ProductsQuery>(buildReportDateRange(DEFAULT_PRESET));

  const { data, isLoading, error, status, refresh } = useReportQuery<ProductsReportData>(
    () => reportClient.getProducts(query),
    JSON.stringify(query)
  );
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
      productId: productId || undefined,
      categoryId: categoryId || undefined,
      source: (source || undefined) as OrderSource | undefined,
    });
  };

  const reset = () => {
    setPreset(DEFAULT_PRESET);
    setStartDate("");
    setEndDate("");
    setProductId("");
    setCategoryId("");
    setSource("");
    setQuery(buildReportDateRange(DEFAULT_PRESET));
  };

  const totals = data?.totals;
  const items: ProductPerformanceRow[] = data?.items ?? [];

  const metrics = totals
    ? [
        { label: "Products", value: formatNumber(totals.productCount) },
        { label: "Quantity Sold", value: formatNumber(totals.quantitySold) },
        { label: "Orders", value: formatNumber(totals.orderCount) },
        { label: "Gross Sales", value: formatCurrency(totals.grossSales) },
        { label: "Net Sales", value: formatCurrency(totals.netSales) },
        { label: "COGS", value: formatCurrency(totals.cogs) },
        { label: "Profit", value: formatCurrency(totals.profit) },
      ]
    : [];

  const columns = [
    {
      header: "Product",
      cell: (row: ProductPerformanceRow) => (
        <div>
          <span className="font-medium">{row.productName}</span>
          <span className="ml-2 text-xs text-muted-foreground">{row.sku}</span>
        </div>
      ),
    },
    {
      header: "Quantity Sold",
      cell: (row: ProductPerformanceRow) => formatNumber(row.quantitySold),
      align: "right" as const,
    },
    {
      header: "Orders",
      cell: (row: ProductPerformanceRow) => formatNumber(row.orderCount),
      align: "right" as const,
    },
    {
      header: "Gross Sales",
      cell: (row: ProductPerformanceRow) => formatCurrency(row.grossSales),
      align: "right" as const,
    },
    {
      header: "Net Sales",
      cell: (row: ProductPerformanceRow) => formatCurrency(row.netSales),
      align: "right" as const,
    },
    {
      header: "COGS",
      cell: (row: ProductPerformanceRow) => formatCurrency(row.cogs),
      align: "right" as const,
    },
    {
      header: "Profit",
      cell: (row: ProductPerformanceRow) => formatCurrency(row.profit),
      align: "right" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Product Performance</h2>
          <p className="text-sm text-muted-foreground">
            Backend-computed product performance (GET /reports/products).
          </p>
        </div>
        <ReportExportActions reportName="product performance" className="shrink-0" />
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
            label="Source"
            value={source}
            disabled={isLoading}
            placeholder="All sources"
            options={[...ORDER_SOURCE_OPTIONS]}
            onChange={(event) => setSource(event.target.value)}
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
          <ReportTable
            columns={columns}
            rows={items}
            rowKey={(row) => row.productId}
            caption={`Per-product performance for ${data?.fromDate ?? ""} to ${
              data?.toDate ?? ""
            } (${items.length} products)`}
            loading={isLoading}
            error={error}
            onRetry={refresh}
            emptyTitle="No product data"
            emptyDescription="No products had sales in this period."
          />
        </>
      )}
    </div>
  );
}