"use client";

// Inventory report. Two backend endpoints:
//   GET /reports/inventory           - totals (filter: category, no dates)
//   GET /reports/inventory/movements - movements totals + series (dates,
//                                      product, type, groupBy)
// All figures (valuation, stock counts, movement sums) are rendered exactly as
// the backend returns them.

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportFilters } from "./ReportFilters";
import { ReportDateRange } from "./ReportDateRange";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportChart } from "./ReportChart";
import { ReportExportActions } from "./ReportExportActions";
import { reportClient } from "../services/reportService";
import { MOVEMENTS_GROUP_BY_OPTIONS, INVENTORY_TRANSACTION_TYPE_OPTIONS } from "../constants";
import {
  buildReportDateRange,
  formatReportPeriod,
  reportErrorMessage,
  loadCategoryOptions,
  loadProductOptions,
} from "../utils";
import { useReportQuery, useReportSelectOptions } from "../hooks/useReportQuery";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type {
  InventoryMovementsQuery,
  InventoryMovementsReportData,
  InventoryQuery,
  InventoryReportData,
  ReportDatePreset,
} from "../types";
import type { InventoryTransactionType } from "../constants";

const DEFAULT_PRESET: ReportDatePreset = "thisMonth";

function defaultMovementsQuery(): InventoryMovementsQuery {
  return { ...buildReportDateRange(DEFAULT_PRESET), groupBy: "day" };
}

export function InventoryReport() {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [type, setType] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [inventoryQuery, setInventoryQuery] = useState<InventoryQuery>({});
  const [movementsQuery, setMovementsQuery] = useState<InventoryMovementsQuery>(
    defaultMovementsQuery
  );

  const inventory = useReportQuery<InventoryReportData>(
    () => reportClient.getInventory(inventoryQuery),
    JSON.stringify(inventoryQuery)
  );
  const movements = useReportQuery<InventoryMovementsReportData>(
    () => reportClient.getInventoryMovements(movementsQuery),
    JSON.stringify(movementsQuery)
  );

  const categoryOptions = useReportSelectOptions(loadCategoryOptions, "categories");
  const productOptions = useReportSelectOptions(loadProductOptions, "products");

  const invalidRange = startDate && endDate && startDate > endDate;
  const rangeError = invalidRange ? "End date must be on or after the start date." : null;
  const loading = inventory.isLoading || movements.isLoading;

  const apply = () => {
    if (invalidRange) return;
    let start = startDate;
    let end = endDate;
    if (preset !== "custom") {
      const range = buildReportDateRange(preset);
      start = range.startDate ?? "";
      end = range.endDate ?? "";
    }
    setInventoryQuery({ categoryId: categoryId || undefined });
    setMovementsQuery({
      startDate: start || undefined,
      endDate: end || undefined,
      productId: productId || undefined,
      type: (type || undefined) as InventoryTransactionType | undefined,
      groupBy: groupBy || undefined,
    });
  };

  const reset = () => {
    setPreset(DEFAULT_PRESET);
    setStartDate("");
    setEndDate("");
    setCategoryId("");
    setProductId("");
    setType("");
    setGroupBy("day");
    setInventoryQuery({});
    setMovementsQuery(defaultMovementsQuery());
  };

  const totals = inventory.data?.totals;
  const movementTotals = movements.data?.totals;
  const series = movements.data?.series ?? [];
  const chartData = series.map((row) => ({
    period: row.period,
    unitsIn: row.unitsIn,
    unitsOut: row.unitsOut,
    movements: row.movementCount,
  }));

  const metrics = [
    ...(totals
      ? [
          { label: "Total Products", value: formatNumber(totals.totalProducts) },
          { label: "Active Products", value: formatNumber(totals.activeProducts) },
          { label: "Low Stock", value: formatNumber(totals.lowStockCount) },
          { label: "Out of Stock", value: formatNumber(totals.outOfStockCount) },
          { label: "Total Units", value: formatNumber(totals.totalStockUnits) },
          { label: "Inventory Value (Cost)", value: formatCurrency(totals.costValue) },
          { label: "Inventory Value (Selling)", value: formatCurrency(totals.sellingValue) },
        ]
      : []),
    ...(movementTotals
      ? [
          { label: "Movements", value: formatNumber(movementTotals.movementCount) },
          { label: "Units In", value: formatNumber(movementTotals.unitsIn) },
          { label: "Units Out", value: formatNumber(movementTotals.unitsOut) },
          { label: "Units Adjusted", value: formatNumber(movementTotals.unitsAdjusted) },
        ]
      : []),
  ];

  const hasError = (inventory.error && !inventory.data) || (movements.error && !movements.data);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Inventory Report</h2>
          <p className="text-sm text-muted-foreground">
            Backend-computed inventory valuation and stock movements
            (GET /reports/inventory, GET /reports/inventory/movements).
          </p>
        </div>
        <ReportExportActions reportName="inventory" className="shrink-0" />
      </div>

      <ReportFilters loading={loading} onApply={apply} onReset={reset} error={rangeError}>
        <ReportDateRange
          preset={preset}
          startDate={startDate}
          endDate={endDate}
          onChange={(nextPreset, start, end) => {
            setPreset(nextPreset);
            setStartDate(start);
            setEndDate(end);
          }}
          disabled={loading}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Category"
            value={categoryId}
            disabled={loading}
            placeholder="All categories"
            helperText={categoryOptions.loading ? "Loading options..." : undefined}
            options={categoryOptions.options}
            onChange={(event) => setCategoryId(event.target.value)}
          />
          <Select
            label="Product"
            value={productId}
            disabled={loading}
            placeholder="All products"
            helperText={productOptions.loading ? "Loading options..." : undefined}
            options={productOptions.options}
            onChange={(event) => setProductId(event.target.value)}
          />
          <Select
            label="Transaction type"
            value={type}
            disabled={loading}
            placeholder="All types"
            options={[...INVENTORY_TRANSACTION_TYPE_OPTIONS]}
            onChange={(event) => setType(event.target.value)}
          />
          <Select
            label="Group by"
            value={groupBy}
            disabled={loading}
            options={MOVEMENTS_GROUP_BY_OPTIONS}
            onChange={(event) => setGroupBy(event.target.value)}
          />
        </div>
      </ReportFilters>

      {hasError ? (
        <ErrorState
          title="Unable to load the report"
          description={
            reportErrorMessage(inventory.error ?? movements.error) ||
            "Unable to load the report. Please try again."
          }
          onRetry={() => {
            inventory.refresh();
            movements.refresh();
          }}
        />
      ) : (
        <>
          <ReportSummaryCards metrics={metrics} loading={loading} />
          <ReportChart
            title="Stock Movement Trend"
            description={groupBy ? `Grouped by ${groupBy}` : undefined}
            data={chartData}
            xKey="period"
            xTickFormatter={formatReportPeriod}
            lines={[
              { key: "unitsIn", name: "Units In", color: "#22c55e", format: "number" },
              { key: "unitsOut", name: "Units Out", color: "#ef4444", format: "number" },
              {
                key: "movements",
                name: "Movements",
                color: "#3b82f6",
                format: "number",
                yAxisId: "right",
              },
            ]}
            ariaLabel="Stock movement chart showing units in, units out, and movement count over the selected period."
            loading={movements.isLoading}
          />
        </>
      )}
    </div>
  );
}