"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, X } from "lucide-react";
import type { Category } from "@/features/categories/types";
import type { InventoryListStatusFilter } from "../types";

interface InventoryFiltersProps {
  search: string;
  categories: Category[];
  categoryFilter: string;
  statusFilter: InventoryListStatusFilter;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: InventoryListStatusFilter) => void;
  onReset: () => void;
}

export function InventoryFilters({
  search,
  categories,
  categoryFilter,
  statusFilter,
  hasActiveFilters,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onReset,
}: InventoryFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1 lg:max-w-sm">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="inventory-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name or SKU..."
          className="pl-10"
          aria-label="Search inventory"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center">
        <Select
          id="inventory-category-filter"
          label="Category"
          value={categoryFilter}
          onChange={(event) => onCategoryChange(event.target.value)}
          options={[
            { value: "", label: "All categories" },
            ...categories.map((category) => ({
              value: category.id,
              label: category.name,
            })),
          ]}
        />
        <Select
          id="inventory-status-filter"
          label="Status"
          value={statusFilter}
          onChange={(event) =>
            onStatusChange(event.target.value as InventoryListStatusFilter)
          }
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active products" },
            { value: "inactive", label: "Inactive products" },
            { value: "low_stock", label: "Low stock products" },
          ]}
        />
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="lg:self-end"
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