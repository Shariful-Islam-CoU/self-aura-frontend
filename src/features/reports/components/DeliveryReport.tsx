"use client";

// Delivery report (GET /reports/delivery). Backend returns shipment totals,
// an optional series, and a per-courier breakdown. Courier performance is
// computed by the backend and rendered here as-is.

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportFilters } from "./ReportFilters";
import { ReportDateRange } from "./ReportDateRange";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportChart } from "./ReportChart";
import { ReportTable } from "./ReportTable";
import { ReportExportActions } from "./ReportExportActions";
import { reportClient } from "../services/reportService";
import { DELIVERY_GROUP_BY_OPTIONS } from "../constants";
import { buildReportDateRange, formatReportPeriod, reportErrorMessage, loadCourierOptions } from "../utils";
import { useReportQuery, useReportSelectOptions } from "../hooks/useReportQuery";
import { formatNumber } from "@/lib/currency";
import type { CourierDeliveryRow, DeliveryQuery, DeliveryReportData, ReportDatePreset } from "../types";

const DEFAULT_PRESET: ReportDatePreset = "thisMonth";

function defaultQuery(): DeliveryQuery {
  return { ...buildReportDateRange(DEFAULT_PRESET), groupBy: "day" };
}

export function DeliveryReport() {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [courierId, setCourierId] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [query, setQuery] = useState<DeliveryQuery>(defaultQuery);

  const { data, isLoading, error, status, refresh } = useReportQuery<DeliveryReportData>(
    () => reportClient.getDelivery(query),
    JSON.stringify(query)
  );
  const courierOptions = useReportSelectOptions(loadCourierOptions, "couriers");

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
      courierId: courierId || undefined,
      groupBy: groupBy || undefined,
    });
  };

  const reset = () => {
    setPreset(DEFAULT_PRESET);
    setStartDate("");
    setEndDate("");
    setCourierId("");
    setGroupBy("day");
    setQuery(defaultQuery());
  };

  const totals = data?.totals;
  const series = data?.series ?? [];
  const couriers: CourierDeliveryRow[] = data?.couriers ?? [];
  const chartData = series.map((row) => ({
    period: row.period,
    shipmentCount: row.shipmentCount,
    deliveredCount: row.deliveredCount,
    deliveryFailedCount: row.deliveryFailedCount,
  }));

  const metrics = totals
    ? [
        { label: "Shipments", value: formatNumber(totals.shipmentCount) },
        { label: "Delivered", value: formatNumber(totals.deliveredCount) },
        { label: "Pending", value: formatNumber(totals.pendingCount) },
        { label: "Ready to Ship", value: formatNumber(totals.readyToShipCount) },
        { label: "Shipped", value: formatNumber(totals.shippedCount) },
        { label: "In Transit", value: formatNumber(totals.inTransitCount) },
        { label: "Delivery Failed", value: formatNumber(totals.deliveryFailedCount) },
        { label: "Returned to Seller", value: formatNumber(totals.returnedToSellerCount) },
        { label: "Cancelled", value: formatNumber(totals.cancelledCount) },
        { label: "Avg Delivery Time", value: `${formatNumber(totals.avgDeliveryTimeDays)} days` },
      ]
    : [];

  const courierColumns = [
    {
      header: "Courier",
      cell: (row: CourierDeliveryRow) => <span className="font-medium">{row.courierName}</span>,
    },
    { header: "Shipments", cell: (row: CourierDeliveryRow) => formatNumber(row.shipmentCount), align: "right" as const },
    { header: "Delivered", cell: (row: CourierDeliveryRow) => formatNumber(row.deliveredCount), align: "right" as const },
    {
      header: "Delivery Failed",
      cell: (row: CourierDeliveryRow) => formatNumber(row.deliveryFailedCount),
      align: "right" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Delivery Report</h2>
          <p className="text-sm text-muted-foreground">
            Backend-computed shipment and courier analytics (GET /reports/delivery).
          </p>
        </div>
        <ReportExportActions reportName="delivery" className="shrink-0" />
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Courier"
            value={courierId}
            disabled={isLoading}
            placeholder="All couriers"
            helperText={courierOptions.loading ? "Loading options..." : undefined}
            options={courierOptions.options}
            onChange={(event) => setCourierId(event.target.value)}
          />
          <Select
            label="Group by"
            value={groupBy}
            disabled={isLoading}
            options={DELIVERY_GROUP_BY_OPTIONS}
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
            title="Delivery Trend"
            description={groupBy ? `Grouped by ${groupBy}` : undefined}
            data={chartData}
            xKey="period"
            xTickFormatter={formatReportPeriod}
            lines={[
              { key: "shipmentCount", name: "Shipments", color: "#3b82f6", format: "number" },
              { key: "deliveredCount", name: "Delivered", color: "#22c55e", format: "number" },
              {
                key: "deliveryFailedCount",
                name: "Delivery Failed",
                color: "#ef4444",
                format: "number",
              },
            ]}
            ariaLabel="Delivery trend chart showing shipments, delivered, and delivery failed counts over the selected period."
            loading={isLoading}
          />
          <ReportTable
            columns={courierColumns}
            rows={couriers}
            rowKey={(row) => row.courierId}
            caption="Courier performance (backend-computed)"
            loading={isLoading}
            error={error}
            onRetry={refresh}
            emptyTitle="No courier data"
            emptyDescription="No couriers had shipments in this period."
          />
        </>
      )}
    </div>
  );
}