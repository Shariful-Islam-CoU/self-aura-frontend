"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, X } from "lucide-react";
import { EXPENSE_PAYMENT_METHOD_LABELS, EXPENSE_PAYMENT_METHODS } from "../types";
import type {
  ExpenseCategory,
  ExpensePaymentMethod,
} from "../types";

export type ExpensePaymentMethodFilter = ExpensePaymentMethod | "all";

interface ExpenseFiltersProps {
  search: string;
  category: string;
  paymentMethod: ExpensePaymentMethodFilter;
  from: string;
  to: string;
  categories: ExpenseCategory[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPaymentMethodChange: (value: ExpensePaymentMethodFilter) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onReset: () => void;
}

export function ExpenseFilters({
  search,
  category,
  paymentMethod,
  from,
  to,
  categories,
  hasActiveFilters,
  onSearchChange,
  onCategoryChange,
  onPaymentMethodChange,
  onFromChange,
  onToChange,
  onReset,
}: ExpenseFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="expense-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by number, title or reference..."
            className="pl-10"
            aria-label="Search expenses"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            id="expense-category-filter"
            label="Category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            options={[
              { value: "", label: "All categories" },
              ...categories.map((item) => ({
                value: item.id,
                label: item.isActive ? item.name : `${item.name} (Inactive)`,
              })),
            ]}
          />
          <Select
            id="expense-method-filter"
            label="Payment method"
            value={paymentMethod}
            onChange={(event) =>
              onPaymentMethodChange(event.target.value as ExpensePaymentMethodFilter)
            }
            options={[
              { value: "all", label: "All methods" },
              ...EXPENSE_PAYMENT_METHODS.map((value) => ({
                value,
                label: EXPENSE_PAYMENT_METHOD_LABELS[value],
              })),
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <Input
            id="expense-from-date"
            label="From date"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
          />
        </div>
        <div>
          <Input
            id="expense-to-date"
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