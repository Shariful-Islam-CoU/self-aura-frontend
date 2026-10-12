import { PaymentSummary } from "@/features/payments/components/PaymentSummary";
import type { PaymentSummaryProps } from "@/features/payments/components/PaymentSummary";

// Ledger totals are the backend payment summary (GET /payments/summary) -
// no duplicate calculation logic lives here.
export function LedgerSummary(props: PaymentSummaryProps) {
  return <PaymentSummary {...props} />;
}
