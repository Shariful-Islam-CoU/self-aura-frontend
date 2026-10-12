"use client";

// Payments report (GET /reports/payments, owner/manager only). Backend returns
// totals + optional series. Filters: date range, payment method, payment type,
// customer, groupBy (day | week | month | paymentMethod). The backend also
// accepts an orderId filter; there is no order picker-sized filter in this
// report UI, so the customer/method/type filters are offered instead.

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportFilters } from "./ReportFilters";
import { ReportDateRange } from "./ReportDateRange";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportChart } from "./ReportChart";
import { ReportExportActions } from "./ReportExportActions";
import { reportClient } from "../services/reportService";
import {
  PAYMENTS_GROUP_BY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
} from "../constants";
import { buildReportDateRange, formatReportPeriod, reportErrorMessage, loadCustomerOptions } from "../utils";
import { useReportQuery, useReportSelectOptions } from "../hooks/useReportQuery";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { PaymentsQuery, PaymentsReportData, ReportDatePreset } from "../types";
import type { PaymentMethod, PaymentType } from "@/features/payments/constants";

const DEFAULT_PRESET: ReportDatePreset = "thisMonth";

function defaultQuery(): PaymentsQuery {
  return { ...buildReportDateRange(DEFAULT_PRESET), groupBy: "day" };
}

export function PaymentsReport() {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [query, setQuery] = useState<PaymentsQuery>(defaultQuery);

  const { data, isLoading, error, status, refresh } = useReportQuery<PaymentsReportData>(
    () => reportClient.getPayments(query),
    JSON.stringify(query)
  );
  const customerOptions = useReportSelectOptions(loadCustomerOptions, "customers");

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
      paymentMethod: (paymentMethod || undefined) as PaymentMethod | undefined,
      paymentType: (paymentType || undefined) as PaymentType | undefined,
      customerId: customerId || undefined,
      groupBy: groupBy || undefined,
    });
  };

  const reset = () => {
    setPreset(DEFAULT_PRESET);
    setStartDate("");
    setEndDate("");
    setPaymentMethod("");
    setPaymentType("");
    setCustomerId("");
    setGroupBy("day");
    setQuery(defaultQuery());
  };

  const totals = data?.totals;
  const series = data?.series ?? [];
  const chartData = series.map((row) => ({
    period: row.period,
    netReceived: row.netReceived,
    received: row.received,
    refunds: row.refunds,
    receivedCount: row.receivedCount,
  }));

  const metrics = totals
    ? [
        { label: "Net Received", value: formatCurrency(totals.netReceived) },
        { label: "Received", value: formatCurrency(totals.received) },
        { label: "Received Count", value: formatNumber(totals.receivedCount) },
        { label: "Refunds", value: formatCurrency(totals.refunds) },
        { label: "Refund Count", value: formatNumber(totals.refundCount) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Payments Report</h2>
          <p className="text-sm text-muted-foreground">
            Backend-computed payment totals and trends (GET /reports/payments).
          </p>
        </div>
        <ReportExportActions reportName="payments" className="shrink-0" />
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
            label="Payment method"
            value={paymentMethod}
            disabled={isLoading}
            placeholder="All methods"
            options={[...PAYMENT_METHOD_OPTIONS]}
            onChange={(event) => setPaymentMethod(event.target.value)}
          />
          <Select
            label="Payment type"
            value={paymentType}
            disabled={isLoading}
            placeholder="All types"
            options={[...PAYMENT_TYPE_OPTIONS]}
            onChange={(event) => setPaymentType(event.target.value)}
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
            label="Group by"
            value={groupBy}
            disabled={isLoading}
            options={PAYMENTS_GROUP_BY_OPTIONS}
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
            title="Payment Trend"
            description={groupBy ? `Grouped by ${groupBy}` : undefined}
            data={chartData}
            xKey="period"
            xTickFormatter={formatReportPeriod}
            lines={[
              { key: "netReceived", name: "Net Received", color: "#3b82f6", format: "currency" },
              {
                key: "received",
                name: "Received",
                color: "#22c55e",
                format: "currency",
                dashed: true,
              },
              {
                key: "refunds",
                name: "Refunds",
                color: "#ef4444",
                format: "currency",
                dashed: true,
              },
              {
                key: "receivedCount",
                name: "Received Count",
                color: "#f59e0b",
                format: "number",
                yAxisId: "right",
              },
            ]}
            ariaLabel="Payment trend chart showing net received, received, refunds, and received count over the selected period."
            loading={isLoading}
          />
        </>
      )}
    </div>
  );
}