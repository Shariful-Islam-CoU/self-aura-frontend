import { PaymentDetails } from "@/features/payments/components/PaymentDetails";
import type { PaymentDetailsProps } from "@/features/payments/components/PaymentDetails";

export type LedgerDetailsProps = PaymentDetailsProps;

// Ledger entry details are payment details - reuse the single implementation.
export function LedgerDetails(props: LedgerDetailsProps) {
  return <PaymentDetails {...props} />;
}
