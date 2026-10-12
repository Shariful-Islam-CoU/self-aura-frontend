import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "../types";
import { getPaymentMethodLabel } from "../utils";

interface PaymentMethodBadgeProps {
  method: PaymentMethod;
  className?: string;
}

export function PaymentMethodBadge({ method, className }: PaymentMethodBadgeProps) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", className)}>
      {getPaymentMethodLabel(method)}
    </Badge>
  );
}
