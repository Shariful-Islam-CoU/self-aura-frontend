"use client";

import { Badge } from "@/components/ui/Badge";
import type { InventoryStockStatus } from "../types";

// Stock status follows the backend-documented low-stock rule
// (backend reportRepository.getInventoryTotals and the existing dashboard
// low-stock widget): out of stock when stock is 0, low stock when stock is at
// or below lowStockThreshold, otherwise in stock. The badge is a display aid -
// authoritative stock always comes from the backend.
export function getStockStatus(
  stock: number,
  lowStockThreshold: number
): InventoryStockStatus {
  if (stock <= 0) return "out_of_stock";
  if (stock <= lowStockThreshold) return "low_stock";
  return "in_stock";
}

const STATUS_CONFIG: Record<
  InventoryStockStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  in_stock: { label: "In Stock", variant: "success" },
  low_stock: { label: "Low Stock", variant: "warning" },
  out_of_stock: { label: "Out of Stock", variant: "destructive" },
};

interface InventoryStatusBadgeProps {
  stock: number;
  lowStockThreshold: number;
  className?: string;
}

export function InventoryStatusBadge({
  stock,
  lowStockThreshold,
  className,
}: InventoryStatusBadgeProps) {
  const status = getStockStatus(stock, lowStockThreshold);
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}