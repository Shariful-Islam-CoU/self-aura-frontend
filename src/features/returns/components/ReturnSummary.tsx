import { Card, CardContent } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/LoadingState";

export interface ReturnSummaryProps {
  totalReturns: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

// The backend exposes no return-summary endpoint, so no aggregate metrics are
// invented here. The only authoritative figure available is the server
// pagination total from GET /returns.
export function ReturnSummary({
  totalReturns,
  isLoading,
  error,
  onRetry,
}: ReturnSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton height={16} width="40%" />
          <div className="mt-3">
            <Skeleton height={28} width="30%" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load return totals."
        description={error}
        onRetry={onRetry}
        retryLabel="Try again"
      />
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">Total returns (filtered)</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{totalReturns}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          This count comes from server pagination. The backend provides no
          aggregate return summary; every amount shown elsewhere is
          server-computed per return.
        </p>
      </CardContent>
    </Card>
  );
}