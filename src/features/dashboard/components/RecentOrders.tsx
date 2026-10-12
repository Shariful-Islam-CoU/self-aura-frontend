// Recent Orders component
// Order status/payment-status keys mirror the backend order enums.

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/currency';
import { Loader2, Package, Calendar } from 'lucide-react';
import type { RecentOrder } from '../types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary' | 'outline';

const ORDER_STATUS_BADGES: Record<string, { variant: BadgeVariant; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  confirmed: { variant: 'info', label: 'Confirmed' },
  processing: { variant: 'default', label: 'Processing' },
  ready_to_ship: { variant: 'info', label: 'Ready to Ship' },
  shipped: { variant: 'default', label: 'Shipped' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
  returned: { variant: 'secondary', label: 'Returned' },
};

const PAYMENT_STATUS_BADGES: Record<string, { variant: BadgeVariant; label: string }> = {
  unpaid: { variant: 'warning', label: 'Unpaid' },
  partially_paid: { variant: 'warning', label: 'Partially Paid' },
  paid: { variant: 'success', label: 'Paid' },
  refunded: { variant: 'secondary', label: 'Refunded' },
};

interface RecentOrdersProps {
  orders: RecentOrder[];
  isLoading: boolean;
  onViewOrder?: (orderId: string) => void;
}

type SortKey = 'orderNumber' | 'customerName' | 'date' | 'total';

export function RecentOrders({ orders, isLoading, onViewOrder }: RecentOrdersProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc',
  });

  const sortedOrders = useMemo(() => {
    if (!orders.length) return orders;
    return [...orders].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getStatusBadge = (status: string) => {
    const config = ORDER_STATUS_BADGES[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const config = PAYMENT_STATUS_BADGES[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const sortedColumn = (header: string): 'ascending' | 'descending' | 'none' | 'other' | undefined => {
    if (sortConfig.key !== header.toLowerCase()) return undefined;
    return sortConfig.direction === 'asc' ? 'ascending' : 'descending';
  };

  const sortButton = (key: SortKey, label: string, classes = '') => (
    <button
      type="button"
      onClick={() => handleSort(key)}
      className={`inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors ${classes}`}
    >
      {label}
      {sortConfig.key === key && (
        <span aria-hidden="true" className="text-xs">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-10 w-10 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orders.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No recent orders"
            description="Orders will appear here once customers place them."
            icon={<Package className="h-12 w-12" />}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>A list of recent orders</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead aria-sort={sortedColumn('ordernumber')}>
                  {sortButton('orderNumber', 'Order #')}
                </TableHead>
                <TableHead aria-sort={sortedColumn('customername')}>
                  {sortButton('customerName', 'Customer')}
                </TableHead>
                <TableHead aria-sort={sortedColumn('date')}>
                  {sortButton('date', 'Date')}
                </TableHead>
                <TableHead
                  aria-sort={sortedColumn('total')}
                  className="text-right"
                >
                  {sortButton('total', 'Total', 'justify-end')}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.map((order) => (
                <TableRow key={order.id} onClick={() => onViewOrder?.(order.id)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      {new Date(order.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}