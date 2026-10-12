"use client";

// Reusable chart for report series. Charts only visualize the data the backend
// already aggregated - they never calculate business metrics. Line variant for
// trends, bar variant for categorical comparisons (e.g. profit & loss).

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";

export type ReportChartRow = Record<string, string | number>;

export interface ReportChartLineConfig {
  /** Key on each chart row. */
  key: string;
  name: string;
  color: string;
  format: "currency" | "number";
  /** Counts go on a secondary right axis. */
  yAxisId?: "right";
  dashed?: boolean;
}

export interface ReportChartProps {
  title: string;
  description?: string;
  data: ReportChartRow[];
  lines: ReportChartLineConfig[];
  xKey: string;
  xTickFormatter?: (value: string) => string;
  ariaLabel: string;
  height?: number;
  loading: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  variant?: "line" | "bar";
}

const compactNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

interface TooltipEntry {
  dataKey: string;
  name: string;
  value: number | string;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  lines: ReportChartLineConfig[];
}

function ChartTooltip({ active, payload, label, lines }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
      <p className="mb-2 font-medium text-foreground">{label}</p>
      {payload.map((entry) => {
        const line = lines.find((l) => l.key === entry.dataKey);
        const display =
          line?.format === "currency"
            ? formatCurrency(Number(entry.value))
            : compactNumber(Number(entry.value));
        return (
          <p key={entry.dataKey} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>
            <span>{display}</span>
          </p>
        );
      })}
    </div>
  );
}

export function ReportChart({
  title,
  description,
  data,
  lines,
  xKey,
  xTickFormatter,
  ariaLabel,
  height = 288,
  loading,
  emptyTitle = "No trend data",
  emptyDescription = "No series data was returned for the current filters.",
  variant = "line",
}: ReportChartProps) {
  const hasRightAxis = lines.some((line) => line.yAxisId === "right");
  const leftLines = lines.filter((line) => line.yAxisId !== "right");
  const rightLines = lines.filter((line) => line.yAxisId === "right");
  const leftHasCurrency = leftLines.some((line) => line.format === "currency");
  const rightHasCurrency = rightLines.some((line) => line.format === "currency");
  const leftTickFormatter = (value: number) =>
    leftHasCurrency ? formatCurrencyCompact(Math.round(value)) : compactNumber(value);
  const rightTickFormatter = (value: number) =>
    rightHasCurrency ? formatCurrencyCompact(Math.round(value)) : compactNumber(value);

  let content: React.ReactNode;

  if (loading) {
    content = (
      <div
        className="w-full animate-pulse rounded bg-muted"
        style={{ height }}
        aria-hidden="true"
      />
    );
  } else if (data.length === 0) {
    content = <EmptyState title={emptyTitle} description={emptyDescription} />;
  } else if (variant === "bar") {
    content = (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey={xKey}
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: "var(--muted-foreground)" }}
            tickFormatter={xTickFormatter}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={leftTickFormatter}
          />
          <Tooltip content={<ChartTooltip lines={lines} />} />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          {lines.map((line) => (
            <Bar
              key={line.key}
              dataKey={line.key}
              name={line.name}
              fill={line.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  } else {
    content = (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey={xKey}
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={xTickFormatter}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={leftTickFormatter}
          />
          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={rightTickFormatter}
            />
          )}
          <Tooltip content={<ChartTooltip lines={lines} />} />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              strokeDasharray={line.dashed ? "5 5" : undefined}
              dot={false}
              activeDot={{ r: 6 }}
              {...(line.yAxisId ? { yAxisId: line.yAxisId } : {})}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div
          role="img"
          aria-label={ariaLabel}
          className="w-full"
          style={{ height }}
        >
          {content}
        </div>
      </CardContent>
    </Card>
  );
}