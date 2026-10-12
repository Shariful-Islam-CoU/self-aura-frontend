import { Card, CardContent } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/LoadingState";
import type { LedgerSummaryTotals } from "../types";
import { formatAmount } from "../utils";

export interface PaymentSummaryProps {
  summary: LedgerSummaryTotals | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface StatCardProps {
  label: string;
  value: string;
  emphasize?: boolean;
}

function StatCard({ label, value, emphasize }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={
            emphasize
              ? "mt-1 text-2xl font-semibold tabular-nums text-foreground"
              : "mt-1 text-2xl font-semibold tabular-nums"
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// Every figure below is computed by the backend (GET /payments/summary);
// this component only formats what the server returns.
export function PaymentSummary({
  summary,
  isLoading,
  error,
  onRetry,
}: PaymentSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <Skeleton height={16} width="60%" />
              <div className="mt-3">
                <Skeleton height={28} width="80%" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load payment summary."
        description={error}
        onRetry={onRetry}
        retryLabel="Try again"
      />
    );
  }

  if (!summary) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total payments" value={formatAmount(summary.totalPayments)} />
      <StatCard label="Total refunds" value={formatAmount(summary.totalRefunds)} />
      <StatCard label="Net received" value={formatAmount(summary.netReceived)} emphasize />
      <StatCard label="Payments" value={String(summary.paymentCount)} />
      <StatCard label="Refunds" value={String(summary.refundCount)} />
    </div>
  );
}
