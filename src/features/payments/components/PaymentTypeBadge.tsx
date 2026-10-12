import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { PaymentType } from "../types";
import { getPaymentTypeLabel } from "../utils";

interface PaymentTypeBadgeProps {
  type: PaymentType;
  className?: string;
}

export function PaymentTypeBadge({ type, className }: PaymentTypeBadgeProps) {
  const isRefund = type === "refund";
  return (
    <Badge variant={isRefund ? "destructive" : "default"} className={cn("whitespace-nowrap", className)}>
      {getPaymentTypeLabel(type)}
    </Badge>
  );
}
