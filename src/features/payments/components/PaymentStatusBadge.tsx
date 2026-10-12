import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "../types";
import { getPaymentStatusLabel } from "../utils";

const STATUS_VARIANTS: Record<
  PaymentStatus,
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary"
  | "outline"
> = {
  submitted: "info",
  completed: "success",
  pending: "warning",
  failed: "destructive",
  cancelled: "outline",
  rejected: "destructive",
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const variant = STATUS_VARIANTS[status] ?? "secondary";
  return (
    <Badge variant={variant} className={cn("whitespace-nowrap", className)}>
      {getPaymentStatusLabel(status)}
    </Badge>
  );
}