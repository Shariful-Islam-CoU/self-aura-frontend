import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { courierService } from "@/features/couriers";
import type { Courier } from "@/features/couriers/types";
import { SHIPMENT_STATUSES } from "../constants";
import type { ShipmentStatus } from "../constants";
import { getShipmentStatusLabel } from "../utils";

export interface ShipmentFiltersState {
  search?: string;
  status?: ShipmentStatus;
  courier?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ShipmentFiltersProps {
  filters: ShipmentFiltersState;
  onChange: (next: ShipmentFiltersState) => void;
  onReset: () => void;
}

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Fully controlled. Every field maps to a real backend list-query param
// (shipmentListQuerySchema) - search, status, courier id and the created date
// range are all applied server-side. The courier options come from the real
// (undeleted) courier API; no names are hardcoded.
export function ShipmentFilters({ filters, onChange, onReset }: ShipmentFiltersProps) {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [couriersError, setCouriersError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await courierService.listCouriers({
          limit: 100,
          sortBy: "name",
          sortOrder: "asc",
        });
        if (!cancelled) {
          setCouriers(data.couriers);
          setCouriersError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setCouriersError(
            err instanceof Error ? err.message : "Unable to load couriers."
          );
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (patch: Partial<ShipmentFiltersState>) => {
    onChange({ ...filters, ...patch });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.courier ||
      filters.fromDate ||
      filters.toDate
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-52">
          <Input
            label="Search"
            id="shipment-search"
            placeholder="Shipment no., tracking, order"
            value={filters.search ?? ""}
            onChange={(event) => setField({ search: event.target.value })}
          />
        </div>
        <div className="w-full sm:w-44">
          <label htmlFor="shipment-status" className="block text-sm font-label text-foreground mb-1.5">
            Status
          </label>
          <select
            id="shipment-status"
            className={selectClassName}
            value={filters.status ?? ""}
            onChange={(event) =>
              setField({
                status: (event.target.value || undefined) as ShipmentStatus | undefined,
              })
            }
          >
            <option value="">All statuses</option>
            {SHIPMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getShipmentStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-48">
          <label htmlFor="shipment-courier" className="block text-sm font-label text-foreground mb-1.5">
            Courier
          </label>
          <select
            id="shipment-courier"
            className={selectClassName}
            value={filters.courier ?? ""}
            onChange={(event) =>
              setField({ courier: event.target.value || undefined })
            }
          >
            <option value="">All couriers</option>
            {couriers.map((courier) => (
              <option key={courier.id} value={courier.id}>
                {courier.name}
              </option>
            ))}
          </select>
          {couriersError && (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {couriersError}
            </p>
          )}
        </div>
        <div className="w-full sm:w-44">
          <Input
            label="From date"
            id="shipment-from-date"
            type="date"
            value={filters.fromDate ?? ""}
            onChange={(event) => setField({ fromDate: event.target.value || undefined })}
          />
        </div>
        <div className="w-full sm:w-44">
          <Input
            label="To date"
            id="shipment-to-date"
            type="date"
            value={filters.toDate ?? ""}
            onChange={(event) => setField({ toDate: event.target.value || undefined })}
          />
        </div>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            aria-label="Clear shipment filters"
          >
            Clear filters
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Date range filters on shipment creation date (server-side).
      </p>
    </div>
  );
}