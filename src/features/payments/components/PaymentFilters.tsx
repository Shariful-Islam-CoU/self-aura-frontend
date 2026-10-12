import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PAYMENT_METHODS, PAYMENT_STATUSES, PAYMENT_TYPES } from "../constants";
import type { PaymentListParams } from "../types";
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentTypeLabel,
} from "../utils";

export type PaymentFiltersState = PaymentListParams;

interface PaymentFiltersProps {
  filters: PaymentFiltersState;
  onChange: (next: PaymentFiltersState) => void;
  onReset: () => void;
}

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Fully controlled: the page owns filter state (server-side filtering only,
// every field maps to a real backend list-query param).
export function PaymentFilters({ filters, onChange, onReset }: PaymentFiltersProps) {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.fromDate ||
      filters.toDate ||
      filters.customer ||
      filters.order ||
      filters.paymentMethod ||
      filters.paymentStatus ||
      filters.paymentType
  );

  const setField = (patch: Partial<PaymentFiltersState>) => {
    onChange({ ...filters, ...patch, page: 1 });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Input
            label="Search"
            id="payment-search"
            placeholder="Payment number, order, reference"
            value={filters.search ?? ""}
            onChange={(event) => setField({ search: event.target.value })}
          />
        </div>
        <div className="w-full sm:w-40">
          <Input
            label="From date"
            id="payment-from-date"
            type="date"
            value={filters.fromDate ?? ""}
            onChange={(event) => setField({ fromDate: event.target.value || undefined })}
          />
        </div>
        <div className="w-full sm:w-40">
          <Input
            label="To date"
            id="payment-to-date"
            type="date"
            value={filters.toDate ?? ""}
            onChange={(event) => setField({ toDate: event.target.value || undefined })}
          />
        </div>
        <div className="w-full sm:w-48">
          <label
            htmlFor="payment-method"
            className="block text-sm font-label text-foreground mb-1.5"
          >
            Method
          </label>
          <select
            id="payment-method"
            className={selectClassName}
            value={filters.paymentMethod ?? ""}
            onChange={(event) =>
              setField({
                paymentMethod: (event.target.value || undefined) as
                  | (typeof filters.paymentMethod)
                  | undefined,
              })
            }
          >
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {getPaymentMethodLabel(method)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="payment-type"
            className="block text-sm font-label text-foreground mb-1.5"
          >
            Type
          </label>
          <select
            id="payment-type"
            className={selectClassName}
            value={filters.paymentType ?? ""}
            onChange={(event) =>
              setField({
                paymentType: (event.target.value || undefined) as
                  | (typeof filters.paymentType)
                  | undefined,
              })
            }
          >
            <option value="">All types</option>
            {PAYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {getPaymentTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="payment-status"
            className="block text-sm font-label text-foreground mb-1.5"
          >
            Status
          </label>
          <select
            id="payment-status"
            className={selectClassName}
            value={filters.paymentStatus ?? ""}
            onChange={(event) =>
              setField({
                paymentStatus: (event.target.value || undefined) as
                  | (typeof filters.paymentStatus)
                  | undefined,
              })
            }
          >
            <option value="">All statuses</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getPaymentStatusLabel(status)}
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
            aria-label="Clear payment filters"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
