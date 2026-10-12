import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { REFUND_STATUSES, RETURN_STATUSES } from "../constants";
import type { ReturnListParams } from "../types";
import { getRefundStatusLabel, getReturnStatusLabel } from "../utils";

export type ReturnFiltersState = ReturnListParams;

export interface ReturnFiltersProps {
  filters: ReturnFiltersState;
  onChange: (next: ReturnFiltersState) => void;
  onReset: () => void;
}

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Fully controlled: the page owns filter state. Every field maps to a real
// backend list-query param (returnListQuerySchema) - nothing invented.
export function ReturnFilters({ filters, onChange, onReset }: ReturnFiltersProps) {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.fromDate ||
      filters.toDate ||
      filters.customer ||
      filters.status ||
      filters.refundStatus
  );

  const setField = (patch: Partial<ReturnFiltersState>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Input
            label="Search"
            id="return-search"
            placeholder="Return number, order number"
            value={filters.search ?? ""}
            onChange={(event) => setField({ search: event.target.value })}
          />
        </div>
        <div className="w-full sm:w-40">
          <Input
            label="From date"
            id="return-from-date"
            type="date"
            value={filters.fromDate ?? ""}
            onChange={(event) => setField({ fromDate: event.target.value || undefined })}
          />
        </div>
        <div className="w-full sm:w-40">
          <Input
            label="To date"
            id="return-to-date"
            type="date"
            value={filters.toDate ?? ""}
            onChange={(event) => setField({ toDate: event.target.value || undefined })}
          />
        </div>
        <div className="w-full sm:w-44">
          <label htmlFor="return-status" className="block text-sm font-label text-foreground mb-1.5">
            Status
          </label>
          <select
            id="return-status"
            className={selectClassName}
            value={filters.status ?? ""}
            onChange={(event) =>
              setField({
                status: (event.target.value || undefined) as ReturnFiltersState["status"],
              })
            }
          >
            <option value="">All statuses</option>
            {RETURN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getReturnStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="return-refund-status"
            className="block text-sm font-label text-foreground mb-1.5"
          >
            Refund status
          </label>
          <select
            id="return-refund-status"
            className={selectClassName}
            value={filters.refundStatus ?? ""}
            onChange={(event) =>
              setField({
                refundStatus: (event.target.value || undefined) as ReturnFiltersState["refundStatus"],
              })
            }
          >
            <option value="">All refund statuses</option>
            {REFUND_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getRefundStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            aria-label="Clear return filters"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}