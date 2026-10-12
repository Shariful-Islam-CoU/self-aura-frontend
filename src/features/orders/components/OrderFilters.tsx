"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, X } from "lucide-react";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "./OrderStatusBadge";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../types";
import type { OrderStatus, PaymentStatus } from "../types";

interface OrderFiltersProps {
  search: string;
  status: OrderStatus | "all";
  paymentStatus: PaymentStatus | "all";
  from: string;
  to: string;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: OrderStatus | "all") => void;
  onPaymentStatusChange: (value: PaymentStatus | "all") => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onReset: () => void;
}

export function OrderFilters({
  search,
  status,
  paymentStatus,
  from,
  to,
  hasActiveFilters,
  onSearchChange,
  onStatusChange,
  onPaymentStatusChange,
  onFromChange,
  onToChange,
  onReset,
}: OrderFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="order-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by order number..."
            className="pl-10"
            aria-label="Search orders by order number"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            id="order-status-filter"
            label="Order status"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as OrderStatus | "all")
            }
            options={[
              { value: "all", label: "All statuses" },
              ...ORDER_STATUSES.map((value) => ({
                value,
                label: ORDER_STATUS_LABELS[value],
              })),
            ]}
          />
          <Select
            id="order-payment-status-filter"
            label="Payment"
            value={paymentStatus}
            onChange={(event) =>
              onPaymentStatusChange(event.target.value as PaymentStatus | "all")
            }
            options={[
              { value: "all", label: "All payment statuses" },
              ...PAYMENT_STATUSES.map((value) => ({
                value,
                label: PAYMENT_STATUS_LABELS[value],
              })),
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <Input
            id="order-from-date"
            label="From date"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
          />
        </div>
        <div>
          <Input
            id="order-to-date"
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