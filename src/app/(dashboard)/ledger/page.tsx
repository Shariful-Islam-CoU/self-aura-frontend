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
  LedgerDetails,
  LedgerFilters,
  LedgerSummary,
  LedgerTable,
} from "@/features/ledger/components";
import type { LedgerFiltersState } from "@/features/ledger/components";
import { ledgerService } from "@/features/ledger";
import { paymentClient } from "@/features/payments/services/paymentService";
import type {
  LedgerEntry,
  LedgerPagination,
  LedgerSummaryTotals,
} from "@/features/ledger/types";
import type { RefundPaymentInput } from "@/features/payments/types";
import { BookOpen, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function LedgerPage() {
  const { canAccess } = useAuth();
  // The backend has no separate ledger module: this register is the payment
  // records plus backend-computed totals. Viewing the register and its summary
  // requires payments.view; mutations map to the payment permission keys
  // (create/edit/delete). Each check is UX-only - the backend enforces them.
  const canViewSummary = canAccess("payments.view");
  const canManage = canAccess("payments.edit") || canAccess("payments.delete");

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [pagination, setPagination] = useState<LedgerPagination>({
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

  const [filters, setFilters] = useState<LedgerFiltersState>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

  const [isSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(filters.search?.trim() ?? "");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  // Chronological register (GET /payments, newest first, server pagination).
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await ledgerService.listEntries({
          page,
          limit: pageSize,
          search: search || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          paymentMethod: filters.paymentMethod || undefined,
          paymentType: filters.paymentType || undefined,
          paymentStatus: filters.paymentStatus || undefined,
          sortBy: "paymentDate",
          sortOrder: "desc",
        });
        if (!cancelled) {
          setEntries(data.payments);
          setPagination(data.pagination);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load ledger.");
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
    filters.fromDate,
    filters.toDate,
    filters.paymentMethod,
    filters.paymentType,
    filters.paymentStatus,
    page,
    pageSize,
    refreshKey,
  ]);

  // Backend totals (GET /payments/summary; payments.view).
  useEffect(() => {
    if (!canViewSummary) return;
    let cancelled = false;
    const init = async () => {
      setSummaryLoading(true);
      try {
        const data = await ledgerService.getSummary({
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
            err instanceof Error ? err.message : "Unable to load ledger summary."
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

  const handleFiltersChange = (next: LedgerFiltersState) => {
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

  const handleView = (id: string) => {
    const entry = entries.find((item) => item.id === id);
    if (!entry) return;
    setSelectedEntry(entry);
    setSuccessMessage(null);
    setDetailsOpen(true);
  };

  const handleCancelEntry = async (id: string): Promise<void> => {
    const updated = await paymentClient.cancelPayment(id);
    setSuccessMessage(`Payment ${updated.paymentNumber} cancelled.`);
    setSelectedEntry(updated);
    setRefreshKey((key) => key + 1);
    setSummaryRefreshKey((key) => key + 1);
  };

  const handleRefundEntry = async (
    id: string,
    input: RefundPaymentInput
  ): Promise<void> => {
    const updated = await paymentClient.refundPayment(id, input);
    setSuccessMessage(`Refund recorded for ${updated.paymentNumber}.`);
    setSelectedEntry(updated);
    setRefreshKey((key) => key + 1);
    setSummaryRefreshKey((key) => key + 1);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Ledger</h1>
        <p className="text-muted-foreground mt-1">
          Chronological register of payments and refunds from the backend.
          Every figure shown is computed by the server.
        </p>
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
        <LedgerSummary
          summary={summary}
          isLoading={summaryLoading}
          error={summaryError}
          onRetry={() => setSummaryRefreshKey((key) => key + 1)}
        />
      )}

      <LedgerFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <LoadingState text="Loading ledger entries..." />
          ) : error ? (
            <ErrorState
              title="Unable to load the ledger."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : entries.length === 0 ? (
            <EmptyState
              title="No ledger entries found."
              description={
                hasActiveFilters
                  ? "Try adjusting or resetting your filters."
                  : "Ledger entries appear once payments are recorded."
              }
              icon={<BookOpen className="h-12 w-12" aria-hidden="true" />}
            />
          ) : (
            <>
              <LedgerTable entries={entries} onView={handleView} />
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

      <LedgerDetails
        open={detailsOpen}
        payment={selectedEntry}
        canManage={canManage}
        isSubmitting={isSubmitting}
        onCancel={handleCancelEntry}
        onRefund={handleRefundEntry}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}