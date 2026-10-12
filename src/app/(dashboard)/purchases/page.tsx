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
  PurchaseStats,
  PurchaseFilters,
  PurchaseTable,
  PurchaseTableSkeleton,
  PurchaseDialog,
  PurchaseReceiveDialog,
  PurchaseCancelDialog,
} from "@/features/purchases/components";
import { purchaseService } from "@/features/purchases/services/purchaseService";
import type { PurchaseAction } from "@/features/purchases/components";
import type {
  CreatePurchaseInput,
  Purchase,
  PurchasePagination,
  PurchaseSortBy,
  PurchaseSortOrder,
  PurchaseStatsTotals,
  PurchaseStatus,
  UpdatePurchaseInput,
} from "@/features/purchases/types";
import { ShoppingCart, Plus, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function PurchasesPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  // Purchase mutations map to the purchase permission keys (create/edit/
  // receive/cancel); the statistics panel reads GET /reports/purchases
  // (reports.purchases). All enforced server-side.
  const canViewStats = canAccess("reports.purchases");
  const canManage =
    canAccess("purchases.create") ||
    canAccess("purchases.edit") ||
    canAccess("purchases.receive") ||
    canAccess("purchases.cancel");

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<PurchasePagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statsTotals, setStatsTotals] = useState<PurchaseStatsTotals | null>(null);
  const [statsLoading, setStatsLoading] = useState(canViewStats);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<PurchaseSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<PurchaseSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [purchaseToReceive, setPurchaseToReceive] = useState<Purchase | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [purchaseToCancel, setPurchaseToCancel] = useState<Purchase | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  // Debounce purchase-number search (server-side).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Load the purchase list (GET /purchases; server-authoritative pagination).
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await purchaseService.listPurchases({
          page,
          limit: pageSize,
          search: search || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          from: fromDate || undefined,
          to: toDate || undefined,
          sortBy,
          sortOrder,
        });
        if (!cancelled) {
          setPurchases(data.purchases);
          setPagination(data.pagination);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load purchases."
          );
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, fromDate, toDate, sortBy, sortOrder, page, pageSize, refreshKey]);

  // Backend-computed purchase statistics (GET /reports/purchases,
  // reports.purchases - the backend returns 403 without it).
  useEffect(() => {
    if (!canViewStats) return;
    let cancelled = false;
    const init = async () => {
      setStatsLoading(true);
      try {
        const data = await purchaseService.getPurchaseStats();
        if (!cancelled) {
          setStatsTotals(data.totals);
          setStatsError(null);
          setStatsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setStatsError(
            err instanceof Error ? err.message : "Unable to load purchase statistics."
          );
          setStatsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [canViewStats, statsRefreshKey]);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleStatusChange = (value: PurchaseStatus | "all") => {
    setStatusFilter(value);
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
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleSortChange = (column: PurchaseSortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
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
    setPurchaseToEdit(null);
    setDialogMode("create");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleTableAction = (purchase: Purchase, action: PurchaseAction) => {
    if (action === "view") {
      router.push(`/purchases/${purchase.id}`);
    } else if (action === "edit") {
      setPurchaseToEdit(purchase);
      setDialogMode("edit");
      setSuccessMessage(null);
      setDialogOpen(true);
    } else if (action === "receive") {
      setPurchaseToReceive(purchase);
      setSuccessMessage(null);
      setReceiveOpen(true);
    } else {
      setPurchaseToCancel(purchase);
      setSuccessMessage(null);
      setCancelOpen(true);
    }
  };

  const handleCreateSubmit = async (
    values: CreatePurchaseInput | UpdatePurchaseInput
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (dialogMode === "edit" && purchaseToEdit) {
        const updated = await purchaseService.updatePurchase(
          purchaseToEdit.id,
          values as UpdatePurchaseInput
        );
        setSuccessMessage(
          `Purchase ${updated.purchaseNumber} updated. Totals were recalculated by the server.`
        );
        setRefreshKey((key) => key + 1);
        setStatsRefreshKey((key) => key + 1);
        setDialogOpen(false);
        return;
      }
      const created = await purchaseService.createPurchase(
        values as CreatePurchaseInput
      );
      setSuccessMessage(
        `Purchase ${created.purchaseNumber} created. Purchase number and totals were assigned by the server.`
      );
      setPage(1);
      setRefreshKey((key) => key + 1);
      setStatsRefreshKey((key) => key + 1);
      setDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiveConfirm = async (): Promise<void> => {
    if (!purchaseToReceive) return;
    setIsSubmitting(true);
    try {
      const received = await purchaseService.receivePurchase(purchaseToReceive.id);
      setSuccessMessage(
        `Purchase ${received.purchaseNumber} received. Inventory and totals were updated by the server.`
      );
      setRefreshKey((key) => key + 1);
      setStatsRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = async (): Promise<void> => {
    if (!purchaseToCancel) return;
    setIsSubmitting(true);
    try {
      const cancelled = await purchaseService.cancelPurchase(purchaseToCancel.id);
      setSuccessMessage(
        `Purchase ${cancelled.purchaseNumber} cancelled.`
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
          <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
          <p className="text-muted-foreground mt-1">
            Record purchases from suppliers. Purchase numbers and totals are
            assigned by the server.
          </p>
        </div>
        {canManage && (
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            New purchase
          </Button>
        )}
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

      {canViewStats && (
        <PurchaseStats
          totals={statsTotals}
          isLoading={statsLoading}
          error={statsError}
          onRetry={() => setStatsRefreshKey((key) => key + 1)}
        />
      )}

      <PurchaseFilters
        search={searchInput}
        status={statusFilter}
        from={fromDate}
        to={toDate}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={handleSearchInputChange}
        onStatusChange={handleStatusChange}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
        onReset={handleResetFilters}
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <PurchaseTableSkeleton />
          ) : error ? (
            <ErrorState
              title="Unable to load purchases."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : purchases.length === 0 ? (
            <EmptyState
              title="No purchases found."
              description={
                hasActiveFilters
                  ? "Try adjusting or resetting your filters."
                  : "Record your first purchase to get started."
              }
              icon={<ShoppingCart className="h-12 w-12" aria-hidden="true" />}
              action={
                canManage ? (
                  <Button type="button" variant="outline" onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                    New purchase
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <PurchaseTable
                purchases={purchases}
                canManage={canManage}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onAction={handleTableAction}
              />
              <div className="mt-4">
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
            </>
          )}
        </CardContent>
      </Card>

      <PurchaseDialog
        mode={dialogMode}
        open={dialogOpen}
        purchase={purchaseToEdit}
        isSubmitting={isSubmitting}
        onSubmit={handleCreateSubmit}
        onOpenChange={setDialogOpen}
      />

      <PurchaseReceiveDialog
        open={receiveOpen}
        purchase={purchaseToReceive}
        isSubmitting={isSubmitting}
        onConfirm={handleReceiveConfirm}
        onOpenChange={setReceiveOpen}
      />

      <PurchaseCancelDialog
        open={cancelOpen}
        purchase={purchaseToCancel}
        isSubmitting={isSubmitting}
        onConfirm={handleCancelConfirm}
        onOpenChange={setCancelOpen}
      />
    </div>
  );
}
