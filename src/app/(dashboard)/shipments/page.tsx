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
  ShipmentDetails,
  ShipmentDialog,
  ShipmentFilters,
  ShipmentStatusDialog,
  ShipmentSummary,
  ShipmentTable,
} from "@/features/shipments/components";
import type { ShipmentFiltersState } from "@/features/shipments/components";
import { shipmentService } from "@/features/shipments";
import { EDITABLE_SHIPMENT_STATUSES } from "@/features/shipments";
import { getShipmentStatusLabel } from "@/features/shipments/utils";
import type {
  CreateShipmentData,
  DeliveryPerformanceSummaryData,
  Shipment,
  ShipmentPagination,
  UpdateShipmentData,
  UpdateShipmentStatusData,
} from "@/features/shipments/types";
import { Plus, Ship, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function ShipmentsPage() {
  const { canAccess } = useAuth();
  // Backend surface (routes/shipment.routes.ts): list, create, single and
  // history need shipments.view/create; update and status transitions need
  // shipments.edit; cancel needs shipments.cancel; the delivery performance
  // summary needs reports.delivery. Order status, address snapshots, SHP
  // numbers and history events are all handled server-side.
  const canViewSummary = canAccess("reports.delivery");
  const canManage =
    canAccess("shipments.create") ||
    canAccess("shipments.edit") ||
    canAccess("shipments.cancel");

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [pagination, setPagination] = useState<ShipmentPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ShipmentFiltersState>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [shipmentToEdit, setShipmentToEdit] = useState<Shipment | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [summary, setSummary] = useState<DeliveryPerformanceSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Debounce shipment search (server-side).
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
    status: filters.status || undefined,
    courier: filters.courier || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  };

  // Load shipments (GET /shipments; server-authoritative pagination/filters).
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await shipmentService.listShipments(listParams);
        if (!cancelled) {
          setShipments(data.shipments);
          setPagination(data.pagination);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load shipments.");
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
    filters.courier,
    filters.fromDate,
    filters.toDate,
    page,
    pageSize,
    refreshKey,
  ]);

  // Backend-computed delivery performance summary (reports.delivery).
  useEffect(() => {
    if (!canViewSummary) return;
    let cancelled = false;
    const init = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const data = await shipmentService.getDeliveryPerformanceSummary({
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
        });
        if (!cancelled) {
          setSummary(data);
          setSummaryLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setSummaryError(
            err instanceof Error ? err.message : "Unable to load performance summary."
          );
          setSummaryLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [canViewSummary, filters.fromDate, filters.toDate, refreshKey]);

  const handleFiltersChange = (next: ShipmentFiltersState) => {
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
    setShipmentToEdit(null);
    setDialogMode("create");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleEdit = () => {
    if (!selectedShipment) return;
    setShipmentToEdit(selectedShipment);
    setDialogMode("edit");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleView = (id: string) => {
    const founded = shipments.find((item) => item.id === id);
    if (!founded) return;
    setSelectedShipment(founded);
    setSuccessMessage(null);
    setTimelineRefreshKey((key) => key + 1);
    setDetailsOpen(true);
  };

  const handleSubmit = async (
    values: CreateShipmentData | UpdateShipmentData
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (dialogMode === "edit" && shipmentToEdit) {
        const updated = await shipmentService.updateShipment(
          shipmentToEdit.id,
          values as UpdateShipmentData
        );
        setSuccessMessage(`Shipment ${updated.shipmentNumber} updated.`);
        setSelectedShipment(updated);
      } else {
        const created = await shipmentService.createShipment(
          values as CreateShipmentData
        );
        setSuccessMessage(
          `Shipment ${created.shipmentNumber} created. The order, address and SHP number were handled by the server.`
        );
        setPage(1);
      }
      setDialogOpen(false);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    id: string,
    input: UpdateShipmentStatusData
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await shipmentService.updateShipmentStatus(id, input);
      setSuccessMessage(
        `Shipment ${updated.shipmentNumber} is now ${getShipmentStatusLabel(updated.status)}.`
      );
      setSelectedShipment(updated);
      setStatusOpen(false);
      setTimelineRefreshKey((key) => key + 1);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await shipmentService.cancelShipment(id);
      setSuccessMessage(`Shipment ${updated.shipmentNumber} cancelled.`);
      setSelectedShipment(updated);
      setTimelineRefreshKey((key) => key + 1);
      setRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.courier ||
      filters.fromDate ||
      filters.toDate
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
          <p className="text-muted-foreground mt-1">
            Track deliveries. Status transitions, order sync, tracking numbers
            and history are all handled by the server.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          New shipment
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

      {!error && canViewSummary && (
        <ShipmentSummary
          summary={summary}
          isLoading={summaryLoading}
          error={summaryError}
          onRetry={() => setRefreshKey((key) => key + 1)}
        />
      )}

      <ShipmentFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <LoadingState text="Loading shipments..." />
          ) : error ? (
            <ErrorState
              title="Unable to load shipments."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : shipments.length === 0 ? (
            <EmptyState
              title="No shipments found."
              description={
                hasActiveFilters
                  ? "Try adjusting or resetting your filters."
                  : "Create your first shipment to get started."
              }
              icon={<Ship className="h-12 w-12" aria-hidden="true" />}
              action={
                <Button type="button" variant="outline" onClick={openCreate}>
                  <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                  New shipment
                </Button>
              }
            />
          ) : (
            <>
              <ShipmentTable
                data={{ shipments, pagination }}
                onView={handleView}
                renderActions={
                  canManage
                    ? (shipmentId) => {
                        const founded = shipments.find(
                          (item) => item.id === shipmentId
                        );
                        if (!founded) return null;
                        const editable = EDITABLE_SHIPMENT_STATUSES.includes(
                          founded.status
                        );
                        if (!editable) return null;
                        return (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShipmentToEdit(founded);
                              setDialogMode("edit");
                              setDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        );
                      }
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

      <ShipmentDialog
        mode={dialogMode}
        open={dialogOpen}
        shipment={shipmentToEdit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onOpenChange={setDialogOpen}
      />

      <ShipmentDetails
        open={detailsOpen}
        shipment={selectedShipment}
        canManage={canManage}
        isSubmitting={isSubmitting}
        timelineRefreshKey={timelineRefreshKey}
        onEdit={handleEdit}
        onOpenStatus={() => {
          setSuccessMessage(null);
          setStatusOpen(true);
        }}
        onCancel={handleCancel}
        onOpenChange={setDetailsOpen}
      />

      <ShipmentStatusDialog
        open={statusOpen}
        shipment={selectedShipment}
        isSubmitting={isSubmitting}
        onConfirm={handleStatusChange}
        onOpenChange={setStatusOpen}
      />
    </div>
  );
}