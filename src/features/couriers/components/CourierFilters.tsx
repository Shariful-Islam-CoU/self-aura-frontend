import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface CourierFiltersState {
  search?: string;
  isActive?: boolean;
}

export interface CourierFiltersProps {
  filters: CourierFiltersState;
  onChange: (next: CourierFiltersState) => void;
  onReset: () => void;
}

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Fully controlled. Every field maps to a real backend list-query param
// (courierListQuerySchema); the isActive select is the backend 'true'/'false'
// filter expressed as a boolean in the UI.
export function CourierFilters({ filters, onChange, onReset }: CourierFiltersProps) {
  const hasActiveFilters = Boolean(
    filters.search || filters.isActive !== undefined
  );

  const setField = (patch: Partial<CourierFiltersState>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Input
            label="Search"
            id="courier-search"
            placeholder="Name, phone, contact person"
            value={filters.search ?? ""}
            onChange={(event) => setField({ search: event.target.value })}
          />
        </div>
        <div className="w-full sm:w-44">
          <label htmlFor="courier-status" className="block text-sm font-label text-foreground mb-1.5">
            Status
          </label>
          <select
            id="courier-status"
            className={selectClassName}
            value={filters.isActive === undefined ? "" : String(filters.isActive)}
            onChange={(event) => {
              const value = event.target.value;
              setField({
                isActive: value === "" ? undefined : value === "true",
              });
            }}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            aria-label="Clear courier filters"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}