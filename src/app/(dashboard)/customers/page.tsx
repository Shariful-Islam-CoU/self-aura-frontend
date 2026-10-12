"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/providers/AuthProvider";
import {
  CustomerStats,
  CustomerFilters,
  CustomerTable,
  CustomerTableSkeleton,
  CustomerDialog,
  CustomerDetails,
  CustomerDeleteDialog,
} from "@/features/customers/components";
import type { CustomerAction } from "@/features/customers/components";
import { customerService } from "@/features/customers/services/customerService";
import type {
  CreateCustomerInput,
  Customer,
  CustomerPagination,
  CustomerSortBy,
  CustomerSortOrder,
  CustomerStatusFilter,
  CustomerStatsTotals,
  UpdateCustomerInput,
} from "@/features/customers/types";
import { Users, Plus, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function CustomersPage() {
  const { canAccess } = useAuth();
  // Backend DELETE (deactivate) is owner/manager only; create/update are
  // available to all authenticated roles.
  const canDeactivate = canAccess("customers.edit") || canAccess("customers.delete");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<CustomerPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statsTotals, setStatsTotals] = useState<CustomerStatsTotals | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("all");
  const [sortBy, setSortBy] = useState<CustomerSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<CustomerSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [customerToView, setCustomerToView] = useState<Customer | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasActiveFilters =
    searchInput.trim() !== "" || statusFilter !== "all";

  // Debounce customer search (name / phone / email, server-side)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Load the customer list
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await customerService.listCustomers({
          page,
          limit: pageSize,
          search: search || undefined,
          isActive:
            statusFilter === "all" ? undefined : statusFilter === "active",
          sortBy,
          sortOrder,
        });
        if (!cancelled) {
          setCustomers(data.customers);
          setPagination(data.pagination);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load customers.");
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, sortBy, sortOrder, page, pageSize, refreshKey]);

  // Load backend-computed customer statistics (GET /reports/customers)
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await customerService.getCustomerStats();
        if (!cancelled) {
          setStatsTotals(data.totals);
          setStatsError(null);
          setStatsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setStatsError(
            err instanceof Error ? err.message : "Unable to load customer statistics."
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

  const handleStatusChange = (value: CustomerStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  const handleSortChange = (column: CustomerSortBy) => {
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
    setCustomerToEdit(null);
    setDialogMode("create");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleTableAction = (customer: Customer, action: CustomerAction) => {
    if (action === "view") {
      setCustomerToView(customer);
      setDetailsOpen(true);
    } else if (action === "edit") {
      setCustomerToEdit(customer);
      setDialogMode("edit");
      setSuccessMessage(null);
      setDialogOpen(true);
    } else {
      setCustomerToDelete(customer);
      setSuccessMessage(null);
      setDeleteOpen(true);
    }
  };

  const handleSubmit = async (
    values: CreateCustomerInput | UpdateCustomerInput
  ) => {
    setIsSubmitting(true);
    try {
      if (dialogMode === "edit" && customerToEdit) {
        await customerService.updateCustomer(
          customerToEdit.id,
          values as UpdateCustomerInput
        );
        setSuccessMessage("Customer updated successfully.");
      } else {
        await customerService.createCustomer(values as CreateCustomerInput);
        setSuccessMessage("Customer created successfully.");
      }
      // Refetch - the backend is the source of truth.
      setRefreshKey((key) => key + 1);
      setStatsRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setIsSubmitting(true);
    try {
      await customerService.deactivateCustomer(customerToDelete.id);
      setSuccessMessage("Customer deactivated successfully.");
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
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your business customers.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          Add customer
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

      <CustomerStats
        totals={statsTotals}
        isLoading={statsLoading}
        error={statsError}
        onRetry={() => setStatsRefreshKey((key) => key + 1)}
      />

      <CustomerFilters
        search={searchInput}
        statusFilter={statusFilter}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onReset={handleResetFilters}
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <CustomerTableSkeleton />
          ) : error ? (
            <ErrorState
              title="Unable to load customers."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : customers.length === 0 ? (
            <EmptyState
              title="No customers found."
              description={
                hasActiveFilters
                  ? "Try adjusting or resetting your filters."
                  : "Add customers to start building your customer directory."
              }
              icon={<Users className="h-12 w-12" aria-hidden="true" />}
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={handleResetFilters}>
                    Reset filters
                  </Button>
                ) : (
                  <Button variant="outline" onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                    Add customer
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              <CustomerTable
                customers={customers}
                canDeactivate={canDeactivate}
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

      <CustomerDialog
        open={dialogOpen}
        mode={dialogMode}
        customer={customerToEdit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onOpenChange={setDialogOpen}
      />

      <CustomerDetails
        open={detailsOpen}
        customer={customerToView}
        onOpenChange={setDetailsOpen}
      />

      <CustomerDeleteDialog
        open={deleteOpen}
        customer={customerToDelete}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDelete}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}