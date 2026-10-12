"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/providers/AuthProvider";
import {
  OrderStats,
  OrderFilters,
  OrderTable,
  OrderTableSkeleton,
  OrderDialog,
  OrderCancelDialog,
} from "@/features/orders/components";
import type { OrderAction } from "@/features/orders/components";
import { orderService } from "@/features/orders/services/orderService";
import type {
  CreateOrderInput,
  Order,
  OrderPagination,
  OrderSortBy,
  OrderSortOrder,
  OrderStatus,
  PaymentStatus,
  SalesStatsTotals,
} from "@/features/orders/types";
import { ShoppingCart, Plus, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function OrdersPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  // Backend POST /orders/:id/cancel requires owner/manager. Order creation
  // and status updates are open to all authenticated roles.
  const canCancel = canAccess("orders.cancel");

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<OrderPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statsTotals, setStatsTotals] = useState<SalesStatsTotals | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | "all">(
    "all"
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<OrderSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<OrderSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasActiveFilters =
    searchInput.trim() !== "" ||
    statusFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  // Debounce order-number search (server-side).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Load the order list.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await orderService.listOrders({
          page,
          limit: pageSize,
          search: search || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          paymentStatus:
            paymentStatusFilter === "all" ? undefined : paymentStatusFilter,
          from: fromDate || undefined,
          to: toDate || undefined,
          sortBy,
          sortOrder,
        });
        if (!cancelled) {
          setOrders(data.orders);
          setPagination(data.pagination);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load orders.");
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [
    search,
    statusFilter,
    paymentStatusFilter,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
    page,
    pageSize,
    refreshKey,
  ]);

  // Load backend-computed order/sales statistics (GET /reports/sales).
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await orderService.getSalesStats();
        if (!cancelled) {
          setStatsTotals(data.totals);
          setStatsError(null);
          setStatsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setStatsError(
            err instanceof Error ? err.message : "Unable to load order statistics."
          );
          setStatsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [statsRefreshKey]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleStatusChange = (value: OrderStatus | "all") => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePaymentStatusChange = (value: PaymentStatus | "all") => {
    setPaymentStatusFilter(value);
    setPage(1);
  };

  const handleFromChange = (value: string) => {
    setFromDate(value);
    setPage(1);
  };

  const handleToChange = (value: string) => {
    setToDate(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleSortChange = (column: OrderSortBy) => {
    setSortBy(column);
    setSortOrder((prev) => (sortBy === column && prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    setSuccessMessage(null);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  const openCreate = () => {
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleTableAction = (order: Order, action: OrderAction) => {
    if (action === "view") {
      router.push(`/orders/${order.id}`);
    } else {
      setOrderToCancel(order);
      setSuccessMessage(null);
      setCancelOpen(true);
    }
  };

  const handleCreateSubmit = async (values: CreateOrderInput): Promise<Order> => {
    setIsSubmitting(true);
    try {
      const order = await orderService.createOrder(values);
      setSuccessMessage(
        `Order ${order.orderNumber} created successfully. Order number was assigned by the server.`
      );
      setPage(1);
      setRefreshKey((key) => key + 1);
      setStatsRefreshKey((key) => key + 1);
      return order;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;
    setIsSubmitting(true);
    try {
      const updated = await orderService.cancelOrder(orderToCancel.id);
      setSuccessMessage(
        `Order ${updated.orderNumber} cancelled. Stock was restored by the server.`
      );
      setRefreshKey((key) => key + 1);
      setStatsRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage sales orders. Facebook orders are entered manually.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          New order
        </Button>
      </div>

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success-foreground"
        >
          <span>{successMessage}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      <OrderStats
        totals={statsTotals}
        isLoading={statsLoading}
        error={statsError}
        onRetry={() => setStatsRefreshKey((key) => key + 1)}
      />

      <OrderFilters
        search={searchInput}
        status={statusFilter}
        paymentStatus={paymentStatusFilter}
        from={fromDate}
        to={toDate}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPaymentStatusChange={handlePaymentStatusChange}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
        onReset={handleResetFilters}
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <OrderTableSkeleton />
          ) : error ? (
            <ErrorState
              title="Unable to load orders."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders found."
              description={
                hasActiveFilters
                  ? "Try adjusting or resetting your filters."
                  : "Create your first sales order to get started."
              }
              icon={<ShoppingCart className="h-12 w-12" aria-hidden="true" />}
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={handleResetFilters}>
                    Reset filters
                  </Button>
                ) : (
                  <Button variant="outline" onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                    New order
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              <OrderTable
                orders={orders}
                canCancel={canCancel}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onAction={handleTableAction}
              />
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                pageSizeOptions={[10, 20, 50]}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDialog
        open={dialogOpen}
        isSubmitting={isSubmitting}
        onSubmit={handleCreateSubmit}
        onOpenChange={setDialogOpen}
      />

      <OrderCancelDialog
        open={cancelOpen}
        order={orderToCancel}
        isSubmitting={isSubmitting}
        onConfirm={handleCancelConfirm}
        onOpenChange={setCancelOpen}
      />
    </div>
  );
}