"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, X } from "lucide-react";
import type { CustomerStatusFilter } from "../types";

interface CustomerFiltersProps {
  search: string;
  statusFilter: CustomerStatusFilter;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: CustomerStatusFilter) => void;
  onReset: () => void;
}

export function CustomerFilters({
  search,
  statusFilter,
  hasActiveFilters,
  onSearchChange,
  onStatusChange,
  onReset,
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1 lg:max-w-sm">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="customer-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name, phone or email..."
          className="pl-10"
          aria-label="Search customers"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          id="customer-status-filter"
          label="Status"
          value={statusFilter}
          onChange={(event) =>
            onStatusChange(event.target.value as CustomerStatusFilter)
          }
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active customers" },
            { value: "inactive", label: "Inactive customers" },
          ]}
        />
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