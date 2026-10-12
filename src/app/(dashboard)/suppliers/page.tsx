"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/providers/AuthProvider";
import {
  SupplierFilters,
  SupplierTable,
  SupplierTableSkeleton,
  SupplierDialog,
  SupplierDetails,
  SupplierDeleteDialog,
} from "@/features/suppliers/components";
import type {
  SupplierAction,
  SupplierStatusFilter,
} from "@/features/suppliers/components";
import { supplierService } from "@/features/suppliers/services/supplierService";
import type { SupplierFormValues } from "@/features/suppliers/components/SupplierForm";
import type {
  CreateSupplierInput,
  Supplier,
  SupplierPagination,
  SupplierSortBy,
  SupplierSortOrder,
  UpdateSupplierInput,
} from "@/features/suppliers/types";
import { Truck, Plus, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function SuppliersPage() {
  const { canAccess } = useAuth();
  // Backend /suppliers POST/PATCH/DELETE (and /reports/purchases used in the
  // details dialog) are owner/manager only. Listing and viewing are available
  // to all authenticated roles.
  const canManage = canAccess("suppliers.create") || canAccess("suppliers.edit") || canAccess("suppliers.delete");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<SupplierPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierStatusFilter>("all");
  const [sortBy, setSortBy] = useState<SupplierSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SupplierSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [supplierToView, setSupplierToView] = useState<Supplier | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasActiveFilters = searchInput.trim() !== "" || statusFilter !== "all";

  // Debounce supplier search (name / phone / email, server-side).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Load the supplier list (GET /suppliers; server-authoritative pagination).
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await supplierService.listSuppliers({
          page,
          limit: pageSize,
          search: search || undefined,
          isActive:
            statusFilter === "all" ? undefined : statusFilter === "active",
          sortBy,
          sortOrder,
        });
        if (!cancelled) {
          setSuppliers(data.suppliers);
          setPagination(data.pagination);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load suppliers."
          );
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, sortBy, sortOrder, page, pageSize, refreshKey]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleStatusChange = (value: SupplierStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  const handleSortChange = (column: SupplierSortBy) => {
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
    setSupplierToEdit(null);
    setDialogMode("create");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleTableAction = (supplier: Supplier, action: SupplierAction) => {
    if (action === "view") {
      setSupplierToView(supplier);
      setDetailsOpen(true);
    } else if (action === "edit") {
      setSupplierToEdit(supplier);
      setDialogMode("edit");
      setSuccessMessage(null);
      setDialogOpen(true);
    } else {
      setSupplierToDelete(supplier);
      setSuccessMessage(null);
      setDeleteOpen(true);
    }
  };

  // The supplier dialog closes itself after this promise resolves; on failure
  // the form keeps the dialog open and surfaces the server error.
  const handleSubmit = async (
    values: SupplierFormValues
  ): Promise<Supplier> => {
    setIsSubmitting(true);
    try {
      if (dialogMode === "edit" && supplierToEdit) {
        const updated = await supplierService.updateSupplier(
          supplierToEdit.id,
          values as UpdateSupplierInput
        );
        setSuccessMessage(`Supplier "${updated.name}" updated.`);
        setRefreshKey((key) => key + 1);
        return updated;
      }
      const created = await supplierService.createSupplier(
        values as CreateSupplierInput
      );
      setSuccessMessage(`Supplier "${created.name}" created.`);
      setPage(1);
      setRefreshKey((key) => key + 1);
      return created;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    setIsSubmitting(true);
    try {
      const deactivated = await supplierService.deactivateSupplier(
        supplierToDelete.id
      );
      setSuccessMessage(`Supplier "${deactivated.name}" deactivated.`);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage supplier relationships and contact details.
          </p>
        </div>
        {canManage && (
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Add supplier
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

      <SupplierFilters
        search={searchInput}
        status={statusFilter}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onReset={handleResetFilters}
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <SupplierTableSkeleton />
          ) : error ? (
            <ErrorState
              title="Unable to load suppliers."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : suppliers.length === 0 ? (
            <EmptyState
              title="No suppliers found."
              description={
                hasActiveFilters
                  ? "Try adjusting or resetting your filters."
                  : "Add suppliers to start building your procurement directory."
              }
              icon={<Truck className="h-12 w-12" aria-hidden="true" />}
              action={
                canManage ? (
                  <Button variant="outline" onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                    Add supplier
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              <SupplierTable
                suppliers={suppliers}
                canManage={canManage}
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

      <SupplierDialog
        open={dialogOpen}
        mode={dialogMode}
        supplier={supplierToEdit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onOpenChange={setDialogOpen}
      />

      <SupplierDetails
        open={detailsOpen}
        supplier={supplierToView}
        canViewStats={canManage}
        onOpenChange={setDetailsOpen}
      />

      <SupplierDeleteDialog
        open={deleteOpen}
        supplier={supplierToDelete}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDelete}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}