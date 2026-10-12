// Sales Trend Chart component

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/lib/currency';
import type { SalesTrendData } from '../types';

interface SalesTrendChartProps {
  data: SalesTrendData | null;
  isLoading: boolean;
  onGroupByChange: (groupBy: 'day' | 'week' | 'month') => void;
  currentGroupBy: 'day' | 'week' | 'month';
}

const GROUP_BY_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const COLORS = {
  netSales: '#3b82f6',
  grossSales: '#10b981',
  orderCount: '#f59e0b',
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || !label) return null;

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span className="font-medium">{entry.name}:</span>
          <span>{entry.name === 'Orders' ? entry.value : formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function SalesTrendChart({ data, isLoading, onGroupByChange, currentGroupBy }: SalesTrendChartProps) {
  const chartData = useMemo(() => {
    if (!data?.series?.length) return [];
    return data.series.map((item) => ({
      period: item.period,
      'Net Sales': item.netSales,
      'Gross Sales': item.grossSales,
      Orders: item.orderCount,
    }));
  }, [data]);

  if (isLoading || !data?.series?.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales Trend</CardTitle>
            <Select
              value={currentGroupBy}
              onChange={(e) => onGroupByChange(e.target.value as 'day' | 'week' | 'month')}
              options={GROUP_BY_OPTIONS}
              disabled
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse bg-muted h-full w-full rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sales Trend</CardTitle>
          <Select
            value={currentGroupBy}
            onChange={(e) => onGroupByChange(e.target.value as 'day' | 'week' | 'month')}
            options={GROUP_BY_OPTIONS}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="period"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  // Format the period for display
                  if (value.includes('W')) return value;
                  if (value.length === 7) return value.slice(5); // YYYY-MM -> MM
                  return value;
                }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value).replace('৳', '').replace(/,/g, '')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line
                type="monotone"
                dataKey="Net Sales"
                stroke={COLORS.netSales}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="Net Sales"
              />
              <Line
                type="monotone"
                dataKey="Gross Sales"
                stroke={COLORS.grossSales}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 6 }}
                name="Gross Sales"
              />
              <Line
                type="monotone"
                dataKey="Orders"
                stroke={COLORS.orderCount}
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={false}
                activeDot={{ r: 6 }}
                name="Orders"
                yAxisId="right"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}