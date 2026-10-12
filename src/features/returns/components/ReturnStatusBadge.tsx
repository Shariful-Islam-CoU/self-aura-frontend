import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { RefundStatus, ReturnStatus } from "../types";
import { getRefundStatusLabel, getReturnStatusLabel } from "../utils";

const STATUS_VARIANTS: Record<
  ReturnStatus,
  "secondary" | "warning" | "info" | "success" | "destructive" | "outline"
> = {
  requested: "warning",
  approved: "info",
  rejected: "destructive",
  received: "secondary",
  completed: "success",
  cancelled: "outline",
};

const REFUND_VARIANTS: Record<
  RefundStatus,
  "secondary" | "warning" | "success" | "destructive"
> = {
  not_started: "secondary",
  pending: "warning",
  refunded: "success",
  failed: "destructive",
};

export interface ReturnStatusBadgeProps {
  status: ReturnStatus;
  className?: string;
}

export interface RefundStatusBadgeProps {
  status: RefundStatus;
  className?: string;
}

export function ReturnStatusBadge({ status, className }: ReturnStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? "secondary"} className={cn("whitespace-nowrap", className)}>
      {getReturnStatusLabel(status)}
    </Badge>
  );
}

export function RefundStatusBadge({ status, className }: RefundStatusBadgeProps) {
  return (
    <Badge variant={REFUND_VARIANTS[status] ?? "secondary"} className={cn("whitespace-nowrap", className)}>
      {getRefundStatusLabel(status)}
    </Badge>
  );
}