// Financial Ledger types.
//
// Backend limitation (verified against routes/index.ts): there is no
// dedicated ledger/transaction/financial module. The authoritative financial
// register is the Payment API itself, so ledger types are the backend payment
// contracts - nothing is invented here.

export type {
  Payment as LedgerEntry,
  PaymentListData as LedgerListData,
  PaymentListParams as LedgerListParams,
  PaymentPagination as LedgerPagination,
  PaymentSummaryData as LedgerSummaryData,
  PaymentSummaryQuery as LedgerSummaryQuery,
  PaymentDailySummaryData as LedgerDailySummaryData,
  DailyPaymentRow,
  LedgerSummaryTotals,
  RefundPaymentInput,
} from "@/features/payments/types";
