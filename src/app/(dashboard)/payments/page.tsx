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
  PaymentDetails,
  PaymentDialog,
  PaymentFilters,
  PaymentSummary,
  PaymentTable,
} from "@/features/payments/components";
import type { PaymentFiltersState } from "@/features/payments/components";
import { paymentService } from "@/features/payments";
import type {
  CreatePaymentInput,
  LedgerSummaryTotals,
  Payment,
  PaymentPagination,
  RefundPaymentInput,
  RejectPaymentInput,
  UpdatePaymentInput,
} from "@/features/payments/types";
import { CreditCard, Plus, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function PaymentsPage() {
  const { canAccess } = useAuth();
  // The summary endpoint needs payments.view; mutations map to the payment
  // permission keys (create/edit/delete/verify/reject) - all enforced
  // server-side.
  const canCreate = canAccess("payments.create");
  const canEdit = canAccess("payments.edit");
  const canViewSummary = canAccess("payments.view");
  const canManage = canEdit || canAccess("payments.delete");
  const canVerify = canAccess("payments.verify");
  const canReject = canAccess("payments.reject");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaymentPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<LedgerSummaryTotals | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(canViewSummary);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);

  const [filters, setFilters] = useState<PaymentFiltersState>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debounce payment search (server-side, like purchases/orders).
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
    paymentMethod: filters.paymentMethod || undefined,
    paymentStatus: filters.paymentStatus || undefined,
    paymentType: filters.paymentType || undefined,
    sortBy: "paymentDate" as const,
    sortOrder: "desc" as const,
  };

  // Load the payment list (GET /payments; server-authoritative pagination).
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await paymentService.listPayments(listParams);
        if (!cancelled) {
          setPayments(data.payments);
          setPagination(data.pagination);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load payments.");
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
    filters.fromDate,
    filters.toDate,
    filters.paymentMethod,
    filters.paymentStatus,
    filters.paymentType,
    page,
    pageSize,
    refreshKey,
  ]);

  // Backend-computed summary (GET /payments/summary; payments.view).
  useEffect(() => {
    if (!canViewSummary) return;
    let cancelled = false;
    const init = async () => {
      setSummaryLoading(true);
      try {
        const data = await paymentService.getPaymentSummary({
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          paymentMethod: filters.paymentMethod || undefined,
          paymentType: filters.paymentType || undefined,
          paymentStatus: filters.paymentStatus || undefined,
        });
        if (!cancelled) {
          setSummary(data.summary);
          setSummaryError(null);
          setSummaryLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setSummaryError(
            err instanceof Error ? err.message : "Unable to load payment summary."
          );
          setSummaryLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [
    canViewSummary,
    summaryRefreshKey,
    filters.fromDate,
    filters.toDate,
    filters.paymentMethod,
    filters.paymentType,
    filters.paymentStatus,
  ]);

  const handleFiltersChange = (next: PaymentFiltersState) => {
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
    setPaymentToEdit(null);
    setDialogMode("create");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    const payment = payments.find((item) => item.id === id);
    if (!payment) return;
    setPaymentToEdit(payment);
    setDialogMode("edit");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleView = (id: string) => {
    const payment = payments.find((item) => item.id === id);
    if (!payment) return;
    setSelectedPayment(payment);
    setSuccessMessage(null);
    setDetailsOpen(true);
  };

  const handleCreateSubmit = async (
    values: CreatePaymentInput | UpdatePaymentInput
  ): Promise<void> => {
    if (dialogMode === "edit" && paymentToEdit) {
      const updated = await paymentService.updatePayment(
        paymentToEdit.id,
        values as UpdatePaymentInput
      );
      setSuccessMessage(
        `Payment ${updated.paymentNumber} updated.`
      );
      setDialogOpen(false);
      setRefreshKey((key) => key + 1);
      setSummaryRefreshKey((key) => key + 1);
      return;
    }
    const created = await paymentService.createPayment(values as CreatePaymentInput);
    setSuccessMessage(
      `Payment ${created.paymentNumber} recorded. The payment number was assigned by the server.`
    );
    setDialogOpen(false);
    setPage(1);
    setRefreshKey((key) => key + 1);
    setSummaryRefreshKey((key) => key + 1);
  };

  const handleCancelPayment = async (id: string): Promise<void> => {
    const updated = await paymentService.cancelPayment(id);
    setSuccessMessage(`Payment ${updated.paymentNumber} cancelled.`);
    setSelectedPayment(updated);
    setRefreshKey((key) => key + 1);
    setSummaryRefreshKey((key) => key + 1);
  };

  const handleRefundPayment = async (
    id: string,
    input: RefundPaymentInput
  ): Promise<void> => {
    const updated = await paymentService.refundPayment(id, input);
    setSuccessMessage(`Refund recorded for ${updated.paymentNumber}.`);
    setSelectedPayment(updated);
    setRefreshKey((key) => key + 1);
    setSummaryRefreshKey((key) => key + 1);
  };

  const handleVerifyPayment = async (id: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await paymentService.verifyPayment(id);
      setSuccessMessage(`Payment ${updated.paymentNumber} verified.`);
      setSelectedPayment(updated);
      setRefreshKey((key) => key + 1);
      setSummaryRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectPayment = async (
    id: string,
    input: RejectPaymentInput
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await paymentService.rejectPayment(id, input);
      setSuccessMessage(`Payment ${updated.paymentNumber} rejected.`);
      setSelectedPayment(updated);
      setRefreshKey((key) => key + 1);
      setSummaryRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.fromDate ||
      filters.toDate ||
      filters.paymentMethod ||
      filters.paymentType ||
      filters.paymentStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Record and track payments against orders. Payment numbers and
            totals are assigned by the server.
          </p>
        </div>
        <Button type="button" onClick={openCreate} disabled={!canCreate}>
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          New payment
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

      {canViewSummary && (
        <PaymentSummary
          summary={summary}
          isLoading={summaryLoading}
          error={summaryError}
          onRetry={() => setSummaryRefreshKey((key) => key + 1)}
        />
      )}

      <PaymentFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <LoadingState text="Loading payments..." />
          ) : error ? (
            <ErrorState
              title="Unable to load payments."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : payments.length === 0 ? (
            <EmptyState
              title="No payments found."
              description={
                hasActiveFilters
                  ? "Try adjusting or resetting your filters."
                  : "Record your first payment to get started."
              }
              icon={<CreditCard className="h-12 w-12" aria-hidden="true" />}
              action={
                canCreate ? (
                  <Button type="button" variant="outline" onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                    New payment
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <PaymentTable
                data={{ payments, pagination }}
                onView={handleView}
                renderActions={
                  canEdit
                    ? (id) => (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(id)}
                        >
                          Edit
                        </Button>
                      )
                    : undefined
                }
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

      <PaymentDialog
        mode={dialogMode}
        open={dialogOpen}
        payment={paymentToEdit}
        isSubmitting={isSubmitting}
        onSubmit={handleCreateSubmit}
        onOpenChange={setDialogOpen}
      />

      <PaymentDetails
        open={detailsOpen}
        payment={selectedPayment}
        canManage={canManage}
        canVerify={canVerify}
        canReject={canReject}
        isSubmitting={isSubmitting}
        onCancel={handleCancelPayment}
        onRefund={handleRefundPayment}
        onVerify={handleVerifyPayment}
        onReject={handleRejectPayment}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}