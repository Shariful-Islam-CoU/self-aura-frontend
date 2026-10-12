"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/LoadingState";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import {
  MoreHorizontal,
  Eye,
  Ban,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import { formatCurrency } from "@/lib/currency";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderStatusBadge";
import { CANCELLABLE_ORDER_STATUSES } from "../types";
import type {
  Order,
  OrderSortBy,
  OrderSortOrder,
  OrderStatus,
} from "../types";

interface SortIconProps {
  column: OrderSortBy;
  sortBy: OrderSortBy;
  sortOrder: OrderSortOrder;
}

function SortIcon({ column, sortBy, sortOrder }: SortIconProps) {
  if (sortBy !== column) {
    return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />;
  }
  return sortOrder === "asc" ? (
    <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" aria-hidden="true" />
  ) : (
    <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" aria-hidden="true" />
  );
}

export type OrderAction = "view" | "cancel";

interface OrderTableProps {
  orders: Order[];
  canCancel: boolean;
  sortBy: OrderSortBy;
  sortOrder: OrderSortOrder;
  onSortChange: (column: OrderSortBy) => void;
  onAction: (order: Order, action: OrderAction) => void;
}

export function OrderTable({
  orders,
  canCancel,
  sortBy,
  sortOrder,
  onSortChange,
  onAction,
}: OrderTableProps) {
  const handleSort = (column: OrderSortBy) => onSortChange(column);

  const sortableHead = (column: OrderSortBy, label: string) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-accent"
      onClick={() => handleSort(column)}
      aria-sort={
        sortBy === column ? (sortOrder === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon column={column} sortBy={sortBy} sortOrder={sortOrder} />
      </span>
    </TableHead>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption>Sales orders</TableCaption>
        <TableHeader>
          <TableRow>
            {sortableHead("orderNumber", "Order")}
            <TableHead>Customer</TableHead>
            {sortableHead("createdAt", "Date")}
            <TableHead className="text-right">Items</TableHead>
            {sortableHead("total", "Total")}
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const cancellable =
              canCancel && CANCELLABLE_ORDER_STATUSES.includes(order.orderStatus as OrderStatus);
            return (
              <TableRow key={order.id}>
                <TableCell className="whitespace-nowrap">
                  <Link
                    href={`/orders/${order.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[12rem]">
                  <p className="truncate text-sm">{order.customer.name ?? "—"}</p>
                  {order.customer.phone && (
                    <p className="truncate text-xs text-muted-foreground">
                      {order.customer.phone}
                    </p>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell className="text-right text-sm">{order.items.length}</TableCell>
                <TableCell className="whitespace-nowrap text-sm font-medium">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <PaymentStatusBadge status={order.paymentStatus} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <OrderStatusBadge status={order.orderStatus} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for order ${order.orderNumber}`}
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Order {order.orderNumber}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onAction(order, "view")}>
                        <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                        View details
                      </DropdownMenuItem>
                      {cancellable && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onAction(order, "cancel")}
                          >
                            <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
                            Cancel order
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function OrderTableSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-9 rounded-md border border-border" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}