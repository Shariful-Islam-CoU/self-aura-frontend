import { paymentClient } from "@/features/payments/services/paymentService";
import type {
  LedgerListData,
  LedgerListParams,
  LedgerSummaryData,
  LedgerSummaryQuery,
} from "../types";

// The backend has no separate ledger endpoint: the ledger IS the payment
// register (GET /payments) plus the backend-computed totals
// (GET /payments/summary). This service only forwards to those real
// endpoints - no ledger endpoint or figure is fabricated.
class LedgerService {
  listEntries(params: LedgerListParams = {}): Promise<LedgerListData> {
    return paymentClient.listPayments(params);
  }

  getSummary(params: LedgerSummaryQuery = {}): Promise<LedgerSummaryData> {
    return paymentClient.getPaymentSummary(params);
  }
}

export const ledgerService = new LedgerService();
export { LedgerService };
