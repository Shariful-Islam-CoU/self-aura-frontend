"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/providers/AuthProvider";
import {
  ReturnApproveDialog,
  ReturnDetails,
  ReturnDialog,
  ReturnFilters,
  ReturnReceiveDialog,
  ReturnRefundDialog,
  ReturnSummary,
  ReturnTable,
} from "@/features/returns/components";
import type { ReturnFiltersState } from "@/features/returns/components";
import { returnService } from "@/features/returns";
import type {
  CreateReturnData,
  RejectReturnData,
  Return,
  ReturnPagination,
  UpdateReturnData,
} from "@/features/returns/types";
import { Plus, RotateCcw, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function ReturnsPage() {
  const { canAccess } = useAuth();
  // Backend surface (routes/return.routes.ts): list/create/get are open to any
  // authenticated staff; update, approve, reject, receive and refund-retry are
  // owner/manager (also enforced server-side). Cancel is open to all staff but
  // the backend rejects staff cancelling an approved return, so the UI hides
  // that action for staff. Returns are never deleted - only transitioned.
  const canManage = canAccess("returns.create") || canAccess("returns.edit") || canAccess("returns.approve") || canAccess("returns.receive") || canAccess("returns.refund") || canAccess("returns.cancel");

  const [returns, setReturns] = useState<Return[]>([]);
  const [pagination, setPagination] = useState<ReturnPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ReturnFiltersState>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [returnToEdit, setReturnToEdit] = useState<Return | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debounce return search (server-side, like payments/orders).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(filters.search?.trim() ?? "");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const listParams = {
    page,
    limit: pageSize,
    search: search || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    status: filters.status || undefined,
    refundStatus: filters.refundStatus || undefined,
    sortBy: "returnDate" as const,
    sortOrder: "desc" as const,
  };

  // Load the return list (GET /returns; server-authoritative pagination).
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await returnService.listReturns(listParams);
        if (!cancelled) {
          setReturns(data.returns);
          setPagination(data.pagination);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load returns.");
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    filters.status,
    filters.refundStatus,
    filters.fromDate,
    filters.toDate,
    page,
    pageSize,
    refreshKey,
  ]);

  const handleFiltersChange = (next: ReturnFiltersState) => {
    setFilters(next);
    setPage(1);
    setSuccessMessage(null);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearch("");
    setPage(1);
    setSuccessMessage(null);
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
    setReturnToEdit(null);
    setDialogMode("create");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleEdit = () => {
    if (!selectedReturn) return;
    setReturnToEdit(selectedReturn);
    setDialogMode("edit");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleView = (id: string) => {
    const founded = returns.find((item) => item.id === id);
    if (!founded) return;
    setSelectedReturn(founded);
    setSuccessMessage(null);
    setDetailsOpen(true);
  };

  const handleSubmit = async (
    values: CreateReturnData | UpdateReturnData
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (dialogMode === "edit" && returnToEdit) {
        const updated = await returnService.updateReturn(
          returnToEdit.id,
          values as UpdateReturnData
        );
        setSuccessMessage(`Return ${updated.returnNumber} updated.`);
        setSelectedReturn(updated);
      } else {
        const created = await returnService.createReturn(values as CreateReturnData);
        setSuccessMessage(
          `Return ${created.returnNumber} created. The refund amount was computed by the server.`
        );
        setPage(1);
      }
      setDialogOpen(false);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await returnService.approveReturn(id);
      setSuccessMessage(`Return ${updated.returnNumber} approved.`);
      setSelectedReturn(updated);
      setApproveOpen(false);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (
    id: string,
    input: RejectReturnData
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await returnService.rejectReturn(id, input);
      setSuccessMessage(`Return ${updated.returnNumber} rejected.`);
      setSelectedReturn(updated);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async (id: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await returnService.receiveReturn(id);
      setSuccessMessage(
        `Return ${updated.returnNumber} received. Resellable items were restocked and the refund was recorded by the server.`
      );
      setSelectedReturn(updated);
      setReceiveOpen(false);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefund = async (id: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await returnService.retryReturnRefund(id);
      setSuccessMessage(`Refund recorded for ${updated.returnNumber}.`);
      setSelectedReturn(updated);
      setRefundOpen(false);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await returnService.cancelReturn(id);
      setSuccessMessage(`Return ${updated.returnNumber} cancelled.`);
      setSelectedReturn(updated);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.fromDate ||
      filters.toDate ||
      filters.status ||
      filters.refundStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Returns</h1>
          <p className="text-muted-foreground mt-1">
            Process product returns and refunds. Refund amounts, stock levels
            and payment records are all handled by the server.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          New return
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

      {!error && (
        <ReturnSummary
          totalReturns={pagination.total}
          isLoading={isLoading}
          error={null}
          onRetry={() => setRefreshKey((key) => key + 1)}
        />
      )}

      <ReturnFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <LoadingState text="Loading returns..." />
          ) : error ? (
            <ErrorState
              title="Unable to load returns."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : returns.length === 0 ? (
            <EmptyState
              title="No returns found."
              description={
                hasActiveFilters
                  ? "Try adjusting or resetting your filters."
                  : "Create your first return to get started."
              }
              icon={<RotateCcw className="h-12 w-12" aria-hidden="true" />}
              action={
                <Button type="button" variant="outline" onClick={openCreate}>
                  <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                  New return
                </Button>
              }
            />
          ) : (
            <>
              <ReturnTable data={{ returns, pagination }} onView={handleView} />
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

      <ReturnDialog
        mode={dialogMode}
        open={dialogOpen}
        returnRecord={returnToEdit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onOpenChange={setDialogOpen}
      />

      <ReturnDetails
        open={detailsOpen}
        returnRecord={selectedReturn}
        canManage={canManage}
        isSubmitting={isSubmitting}
        onCancel={handleCancel}
        onReject={handleReject}
        onOpenApprove={() => {
          setSuccessMessage(null);
          setApproveOpen(true);
        }}
        onOpenReceive={() => {
          setSuccessMessage(null);
          setReceiveOpen(true);
        }}
        onOpenRefund={() => {
          setSuccessMessage(null);
          setRefundOpen(true);
        }}
        onOpenEdit={handleEdit}
        onOpenChange={setDetailsOpen}
      />

      <ReturnApproveDialog
        open={approveOpen}
        returnRecord={selectedReturn}
        isSubmitting={isSubmitting}
        onConfirm={handleApprove}
        onOpenChange={setApproveOpen}
      />

      <ReturnReceiveDialog
        open={receiveOpen}
        returnRecord={selectedReturn}
        isSubmitting={isSubmitting}
        onConfirm={handleReceive}
        onOpenChange={setReceiveOpen}
      />

      <ReturnRefundDialog
        open={refundOpen}
        returnRecord={selectedReturn}
        isSubmitting={isSubmitting}
        onConfirm={handleRefund}
        onOpenChange={setRefundOpen}
      />
    </div>
  );
}