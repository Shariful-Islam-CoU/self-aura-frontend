"use client";

import { Badge } from "@/components/ui/Badge";
import type { PurchaseStatus } from "../types";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary"
  | "outline";

const PURCHASE_STATUS_VARIANTS: Record<PurchaseStatus, BadgeVariant> = {
  draft: "warning",
  received: "success",
  cancelled: "destructive",
};

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  draft: "Draft",
  received: "Received",
  cancelled: "Cancelled",
};

interface PurchaseStatusBadgeProps {
  status: PurchaseStatus;
}

export function PurchaseStatusBadge({ status }: PurchaseStatusBadgeProps) {
  return (
    <Badge variant={PURCHASE_STATUS_VARIANTS[status]}>
      {PURCHASE_STATUS_LABELS[status]}
    </Badge>
  );
}