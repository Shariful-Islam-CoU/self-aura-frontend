import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  DELIVERY_FAILURE_REASONS,
  SHIPMENT_STATUS_TRANSITIONS,
} from "../constants";
import type { Shipment, UpdateShipmentStatusData } from "../types";
import {
  getDeliveryFailureReasonLabel,
  getShipmentStatusLabel,
} from "../utils";
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";

export interface ShipmentStatusDialogProps {
  open: boolean;
  shipment: Shipment | null;
  isSubmitting: boolean;
  onConfirm: (id: string, input: UpdateShipmentStatusData) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Status-transition dialog. Only the backend-defined next statuses are offered
// (SHIPMENT_STATUS_TRANSITIONS); delivery_failed always requires a failure
// reason, mirroring the backend refine. No optimistic updates - the page
// refreshes from the server response. The content remounts on every open, so
// the form state never leaks between opens.
export function ShipmentStatusDialog(props: ShipmentStatusDialogProps) {
  const { open, onOpenChange } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <ShipmentStatusDialogContent {...props} />}
    </Dialog>
  );
}

function ShipmentStatusDialogContent({
  shipment,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: ShipmentStatusDialogProps) {
  const allowedNext = shipment
    ? (SHIPMENT_STATUS_TRANSITIONS[shipment.status] ?? [])
    : [];

  const [status, setStatus] = useState<string>(
    shipment ? (SHIPMENT_STATUS_TRANSITIONS[shipment.status]?.[0] ?? "") : ""
  );
  const [failureReason, setFailureReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (!shipment) return null;

  const handleConfirm = async () => {
    setActionError(null);
    if (!status) {
      setActionError("Select a next status.");
      return;
    }
    if (status === "delivery_failed" && !failureReason) {
      setActionError("Delivery failure reason is required for a failed delivery.");
      return;
    }
    try {
      await onConfirm(shipment.id, {
        status: status as UpdateShipmentStatusData["status"],
        failureReason:
          status === "delivery_failed" && failureReason
            ? (failureReason as UpdateShipmentStatusData["failureReason"])
            : undefined,
        note: note.trim() || undefined,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update status.");
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Update shipment status</DialogTitle>
        <DialogDescription>
          {shipment.shipmentNumber} ·{" "}
          <span className="inline-flex">
            <ShipmentStatusBadge status={shipment.status} />
          </span>{" "}
          → {status ? getShipmentStatusLabel(status as UpdateShipmentStatusData["status"]) : "…"}
        </DialogDescription>
      </DialogHeader>

      {allowedNext.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This shipment is in a terminal state ({getShipmentStatusLabel(shipment.status)});
          the backend allows no further status changes.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="shipment-next-status" className="block text-sm font-label text-foreground mb-1.5">
              Next status
            </label>
            <select
              id="shipment-next-status"
              className={selectClassName}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setFailureReason("");
                setActionError(null);
              }}
            >
              {allowedNext.map((next) => (
                <option key={next} value={next}>
                  {getShipmentStatusLabel(next)}
                </option>
              ))}
            </select>
          </div>

          {status === "delivery_failed" && (
            <div>
              <label htmlFor="shipment-failure-reason" className="block text-sm font-label text-foreground mb-1.5">
                Failure reason
              </label>
              <select
                id="shipment-failure-reason"
                className={selectClassName}
                value={failureReason}
                onChange={(event) => {
                  setFailureReason(event.target.value);
                  setActionError(null);
                }}
              >
                <option value="">Select a reason</option>
                {DELIVERY_FAILURE_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {getDeliveryFailureReasonLabel(reason)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Textarea
            label="Note (optional)"
            id="shipment-status-note"
            maxLength={2000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />

          {actionError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {actionError}
            </div>
          )}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          {allowedNext.length === 0 ? "Close" : "Cancel"}
        </Button>
        {allowedNext.length > 0 && (
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update status"}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}