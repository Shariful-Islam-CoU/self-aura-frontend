"use client";

// Expenses report (GET /reports/expenses, owner/manager only). Backend returns
// totals + optional series. Filters: date range, payment method, groupBy
// (day | week | month | category | paymentMethod). The backend also accepts a
// categoryId filter, but no expense-category list API exists in the frontend
// surface, so only the filters backed by a selectable source are offered.

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportFilters } from "./ReportFilters";
import { ReportDateRange } from "./ReportDateRange";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportChart } from "./ReportChart";
import { ReportExportActions } from "./ReportExportActions";
import { reportClient } from "../services/reportService";
import { EXPENSES_GROUP_BY_OPTIONS, EXPENSE_PAYMENT_METHOD_OPTIONS } from "../constants";
import { buildReportDateRange, formatReportPeriod, reportErrorMessage } from "../utils";
import { useReportQuery } from "../hooks/useReportQuery";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { ExpensesQuery, ExpensesReportData, ReportDatePreset } from "../types";
import type { ExpensePaymentMethod } from "../constants";

const DEFAULT_PRESET: ReportDatePreset = "thisMonth";

function defaultQuery(): ExpensesQuery {
  return { ...buildReportDateRange(DEFAULT_PRESET), groupBy: "day" };
}

export function ExpensesReport() {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [query, setQuery] = useState<ExpensesQuery>(defaultQuery);

  const { data, isLoading, error, status, refresh } = useReportQuery<ExpensesReportData>(
    () => reportClient.getExpenses(query),
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
      paymentMethod: (paymentMethod || undefined) as ExpensePaymentMethod | undefined,
      groupBy: groupBy || undefined,
    });
  };

  const reset = () => {
    setPreset(DEFAULT_PRESET);
    setStartDate("");
    setEndDate("");
    setPaymentMethod("");
    setGroupBy("day");
    setQuery(defaultQuery());
  };

  const totals = data?.totals;
  const series = data?.series ?? [];
  const chartData = series.map((row) => ({
    period: row.period,
    totalExpenses: row.totalExpenses,
    expenses: row.expenseCount,
  }));

  const metrics = totals
    ? [
        { label: "Total Expenses", value: formatCurrency(totals.totalExpenses) },
        { label: "Expenses", value: formatNumber(totals.expenseCount) },
        { label: "Categories", value: formatNumber(totals.categoryCount) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Expenses Report</h2>
          <p className="text-sm text-muted-foreground">
            Backend-computed expense totals and trends (GET /reports/expenses).
          </p>
        </div>
        <ReportExportActions reportName="expenses" className="shrink-0" />
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Payment method"
            value={paymentMethod}
            disabled={isLoading}
            placeholder="All methods"
            options={[...EXPENSE_PAYMENT_METHOD_OPTIONS]}
            onChange={(event) => setPaymentMethod(event.target.value)}
          />
          <Select
            label="Group by"
            value={groupBy}
            disabled={isLoading}
            options={EXPENSES_GROUP_BY_OPTIONS}
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
            title="Expense Trend"
            description={groupBy ? `Grouped by ${groupBy}` : undefined}
            data={chartData}
            xKey="period"
            xTickFormatter={formatReportPeriod}
            lines={[
              {
                key: "totalExpenses",
                name: "Total Expenses",
                color: "#ef4444",
                format: "currency",
              },
              {
                key: "expenses",
                name: "Expenses",
                color: "#f59e0b",
                format: "number",
                yAxisId: "right",
              },
            ]}
            ariaLabel="Expense trend chart showing total expenses and expense count over the selected period."
            loading={isLoading}
          />
        </>
      )}
    </div>
  );
}