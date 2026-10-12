import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { DeliveryPerformanceSummaryData } from "../types";

export interface ShipmentSummaryProps {
  summary: DeliveryPerformanceSummaryData | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface StatProps {
  label: string;
  value: string | number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

// Delivery performance metrics. Every value is computed by the backend
// (GET /shipments/performance-summary) and displayed exactly as returned -
// the frontend never derives delivery statistics. Owner/manager only.
export function ShipmentSummary({
  summary,
  isLoading,
  error,
  onRetry,
}: ShipmentSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery performance</CardTitle>
        <CardDescription>
          Server-computed metrics (shipment performance summary) — shown to
          owner/manager only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState text="Loading performance summary..." />
        ) : error ? (
          <ErrorState
            title="Unable to load performance summary."
            description={error}
            onRetry={onRetry}
            retryLabel="Try again"
          />
        ) : summary ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total shipments" value={summary.totalShipments} />
            <Stat label="Delivered" value={summary.deliveredCount} />
            <Stat label="In transit" value={summary.inTransitCount} />
            <Stat label="Failed" value={summary.failedCount} />
            <Stat label="Returned" value={summary.returnedCount} />
            <Stat label="Cancelled" value={summary.cancelledCount} />
            <Stat label="Delivery success" value={summary.deliverySuccessCount} />
            <Stat label="Failure rate" value={`${summary.deliveryFailureRate}%`} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}