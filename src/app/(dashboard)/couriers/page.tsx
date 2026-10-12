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
  CourierDeleteDialog,
  CourierDetails,
  CourierDialog,
  CourierFilters,
  CourierTable,
} from "@/features/couriers/components";
import type { CourierFiltersState } from "@/features/couriers/components";
import { courierService } from "@/features/couriers";
import type {
  Courier,
  CourierPagination,
  CreateCourierData,
  UpdateCourierData,
} from "@/features/couriers/types";
import { Plus, Truck, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function CouriersPage() {
  const { canAccess } = useAuth();
  // Backend surface (routes/courier.routes.ts): list and single-courier reads
  // are open to any authenticated staff; create/update/delete (deactivate) are
  // owner/manager. There is no reactivation endpoint.
  const canManage = canAccess("couriers.create") || canAccess("couriers.edit") || canAccess("couriers.delete");

  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [pagination, setPagination] = useState<CourierPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<CourierFiltersState>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [courierToEdit, setCourierToEdit] = useState<Courier | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debounce courier search (server-side, like every other module).
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
    isActive: filters.isActive,
    sortBy: "name" as const,
    sortOrder: "asc" as const,
  };

  // Load couriers (GET /couriers; server-authoritative pagination/filters).
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await courierService.listCouriers(listParams);
        if (!cancelled) {
          setCouriers(data.couriers);
          setPagination(data.pagination);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load couriers.");
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters.isActive, page, pageSize, refreshKey]);

  const handleFiltersChange = (next: CourierFiltersState) => {
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
    setCourierToEdit(null);
    setDialogMode("create");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleEdit = () => {
    if (!selectedCourier) return;
    setCourierToEdit(selectedCourier);
    setDialogMode("edit");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleView = (id: string) => {
    const founded = couriers.find((item) => item.id === id);
    if (!founded) return;
    setSelectedCourier(founded);
    setSuccessMessage(null);
    setDetailsOpen(true);
  };

  const handleSubmit = async (
    values: CreateCourierData | UpdateCourierData
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (dialogMode === "edit" && courierToEdit) {
        const updated = await courierService.updateCourier(
          courierToEdit.id,
          values as UpdateCourierData
        );
        setSuccessMessage(`Courier ${updated.name} updated.`);
        setSelectedCourier(updated);
      } else {
        const created = await courierService.createCourier(
          values as CreateCourierData
        );
        setSuccessMessage(`Courier ${created.name} created.`);
        setPage(1);
      }
      setDialogOpen(false);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await courierService.deactivateCourier(id);
      setSuccessMessage(
        `Courier ${updated.name} deactivated. The server blocked it if it still had active shipments.`
      );
      setSelectedCourier(updated);
      setDeleteOpen(false);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.isActive !== undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Couriers</h1>
          <p className="text-muted-foreground mt-1">
            Manage shipping partners. Deactivation and approval rules are
            enforced by the server.
          </p>
        </div>
        {canManage && (
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            New courier
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

      <CourierFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <LoadingState text="Loading couriers..." />
          ) : error ? (
            <ErrorState
              title="Unable to load couriers."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : couriers.length === 0 ? (
            <EmptyState
              title="No couriers found."
              description={
                hasActiveFilters
                  ? "Try adjusting or resetting your filters."
                  : "Add your first courier to start shipping orders."
              }
              icon={<Truck className="h-12 w-12" aria-hidden="true" />}
              action={
                canManage ? (
                  <Button type="button" variant="outline" onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                    New courier
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <CourierTable
                data={{ couriers, pagination }}
                onView={handleView}
                renderActions={
                  canManage
                    ? (courierId) => (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const founded = couriers.find(
                              (item) => item.id === courierId
                            );
                            if (!founded) return;
                            setCourierToEdit(founded);
                            setDialogMode("edit");
                            setDialogOpen(true);
                          }}
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

      <CourierDialog
        mode={dialogMode}
        open={dialogOpen}
        courier={courierToEdit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onOpenChange={setDialogOpen}
      />

      <CourierDetails
        open={detailsOpen}
        courier={selectedCourier}
        canManage={canManage}
        isSubmitting={isSubmitting}
        onEdit={handleEdit}
        onDeactivate={() => {
          setSuccessMessage(null);
          setDeleteOpen(true);
        }}
        onOpenChange={setDetailsOpen}
      />

      <CourierDeleteDialog
        open={deleteOpen}
        courier={selectedCourier}
        isSubmitting={isSubmitting}
        onConfirm={handleDeactivate}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}