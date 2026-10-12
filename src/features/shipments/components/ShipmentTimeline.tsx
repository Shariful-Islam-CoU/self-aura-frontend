import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ShipmentEvent } from "../types";
import { formatDateTime, getShipmentStatusLabel } from "../utils";
import { shipmentClient } from "../services/shipmentService";

export interface ShipmentTimelineProps {
  shipmentId: string | null;
  open: boolean;
  refreshKey: number;
}

// Renders the real backend event history (GET /shipments/:id/history) in the
// order the server returns it. No fake events are ever created - the server
// records one event per status change (and on cancel).
export function ShipmentTimeline({
  shipmentId,
  open,
  refreshKey,
}: ShipmentTimelineProps) {
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Stale events simply stay hidden while the dialog is closed; the fetch
    // below re-runs whenever the dialog reopens.
    if (!open || !shipmentId) return;
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const history = await shipmentClient.getShipmentHistory(shipmentId);
        if (!cancelled) {
          setEvents(history);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load shipment history.");
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [shipmentId, open, refreshKey, retryCount]);

  return (
    <div className="rounded-md border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground">
        Timeline{" "}
        <span className="text-muted-foreground">({events.length})</span>
      </h3>

      {isLoading ? (
        <div className="mt-3 space-y-2">
          <div className="h-4 animate-pulse rounded bg-muted" />
          <div className="h-4 animate-pulse rounded bg-muted w-3/4" />
          <div className="h-4 animate-pulse rounded bg-muted w-1/2" />
        </div>
      ) : error ? (
        <div className="mt-3 flex flex-col items-start gap-2">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Retry
          </Button>
        </div>
      ) : events.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No events recorded yet. The server records an event each time the
          shipment&apos;s status changes (and on cancel).
        </p>
      ) : (
        <ol className="relative mt-4 space-y-4 border-l border-border pl-4">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span
                className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary"
                aria-hidden="true"
              />
              <p className="text-sm font-medium">
                {getShipmentStatusLabel(event.fromStatus)} →{" "}
                {getShipmentStatusLabel(event.toStatus)}
              </p>
              {event.note && (
                <p className="mt-0.5 text-sm text-muted-foreground">{event.note}</p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                by {event.createdBy.username ?? "—"} · {formatDateTime(event.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}