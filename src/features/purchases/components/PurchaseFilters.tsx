"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, X } from "lucide-react";
import { PURCHASE_STATUS_LABELS } from "./PurchaseStatusBadge";
import { PURCHASE_STATUSES } from "../types";
import type { PurchaseStatus } from "../types";

interface PurchaseFiltersProps {
  search: string;
  status: PurchaseStatus | "all";
  from: string;
  to: string;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: PurchaseStatus | "all") => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onReset: () => void;
}

export function PurchaseFilters({
  search,
  status,
  from,
  to,
  hasActiveFilters,
  onSearchChange,
  onStatusChange,
  onFromChange,
  onToChange,
  onReset,
}: PurchaseFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="purchase-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by purchase number..."
            className="pl-10"
            aria-label="Search purchases by purchase number"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            id="purchase-status-filter"
            label="Status"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as PurchaseStatus | "all")
            }
            options={[
              { value: "all", label: "All statuses" },
              ...PURCHASE_STATUSES.map((value) => ({
                value,
                label: PURCHASE_STATUS_LABELS[value],
              })),
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <Input
            id="purchase-from-date"
            label="From date"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
          />
        </div>
        <div>
          <Input
            id="purchase-to-date"
            label="To date"
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
          />
        </div>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="sm:self-end"
            onClick={onReset}
          >
            <X className="mr-1 h-4 w-4" aria-hidden="true" />
            Reset filters
          </Button>
        )}
      </div>
    </div>
  );
}