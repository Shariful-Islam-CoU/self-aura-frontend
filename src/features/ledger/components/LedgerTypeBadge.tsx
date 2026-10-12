import { PaymentTypeBadge } from "@/features/payments/components/PaymentTypeBadge";
import type { PaymentType } from "@/features/payments/types";

interface LedgerTypeBadgeProps {
  type: PaymentType;
  className?: string;
}

// Thin ledger-named wrapper over the single payment-type badge (one source
// of truth for payment/refund presentation).
export function LedgerTypeBadge({ type, className }: LedgerTypeBadgeProps) {
  return <PaymentTypeBadge type={type} className={className} />;
}
