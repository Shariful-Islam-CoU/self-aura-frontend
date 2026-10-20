import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  CANCELLABLE_SHIPMENT_STATUSES,
  EDITABLE_SHIPMENT_STATUSES,
  SHIPMENT_STATUS_TRANSITIONS,
} from "../constants";
import type { ShipmentStatus } from "../constants";
import type { Shipment } from "../types";
import {
  formatAmount,
  formatDateTime,
  getDeliveryFailureReasonLabel,
  getShipmentStatusLabel,
} from "../utils";
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";
import { ShipmentTimeline } from "./ShipmentTimeline";

export interface ShipmentDetailsProps {
  open: boolean;
  shipment: Shipment | null;
  canManage: boolean;
  isSubmitting: boolean;
  timelineRefreshKey: number;
  onEdit: () => void;
  onOpenStatus: () => void;
  onCancel: (id: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

const customerLabel = (shipment: Shipment): string => {
  const customer = shipment.customer;
  return customer.name || customer.phone || customer.email || customer.id;
};

export function ShipmentDetails({
  open,
  shipment,
  canManage,
  isSubmitting,
  timelineRefreshKey,
  onEdit,
  onOpenStatus,
  onCancel,
  onOpenChange,
}: ShipmentDetailsProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!shipment) return null;

  const editable = EDITABLE_SHIPMENT_STATUSES.includes(shipment.status);
  const cancellable = CANCELLABLE_SHIPMENT_STATUSES.includes(shipment.status);
  const hasNextTransition = (SHIPMENT_STATUS_TRANSITIONS[shipment.status] ?? []).length > 0;

  const address = shipment.shippingAddress;

  const handleCancelConfirm = async () => {
    setCancelError(null);
    try {
      await onCancel(shipment.id);
      setConfirmingCancel(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Unable to cancel shipment.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{shipment.shipmentNumber}</DialogTitle>
          <DialogDescription>
            Created {formatDateTime(shipment.createdAt)} by{" "}
            {shipment.createdBy.username ?? "—"}.
          </DialogDescription>
        </DialogHeader>

        <dl className="divide-y divide-border">
          <DetailRow label="Status">
            <span className="flex flex-wrap items-center gap-2">
              <ShipmentStatusBadge status={shipment.status} />
              {shipment.failureReason && (
                <span className="text-sm text-muted-foreground">
                  {getDeliveryFailureReasonLabel(shipment.failureReason)}
                </span>
              )}
            </span>
          </DetailRow>
          <DetailRow label="Order">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={`/orders/${shipment.order.id}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {shipment.order.orderNumber ?? shipment.order.id}
              </Link>
              {shipment.order.orderStatus && (
                <span className="text-muted-foreground">
                  {getShipmentStatusLabel(shipment.order.orderStatus as ShipmentStatus)}
                </span>
              )}
            </span>
          </DetailRow>
          <DetailRow label="Customer">{customerLabel(shipment)}</DetailRow>
          <DetailRow label="Courier">
            {shipment.courier.name ? (
              <span>
                {shipment.courier.name}
                {shipment.courier.phone ? ` · ${shipment.courier.phone}` : ""}
              </span>
            ) : (
              "—"
            )}
          </DetailRow>
          <DetailRow label="Tracking number">
            {shipment.trackingNumber ?? (
              <span className="text-muted-foreground">Not provided</span>
            )}
          </DetailRow>
          <DetailRow label="Delivery charge">
            {formatAmount(shipment.deliveryCharge)}
          </DetailRow>
          {shipment.shippedAt && (
            <DetailRow label="Shipped at">{formatDateTime(shipment.shippedAt)}</DetailRow>
          )}
          {shipment.deliveredAt && (
            <DetailRow label="Delivered at">{formatDateTime(shipment.deliveredAt)}</DetailRow>
          )}
          {shipment.failedAt && (
            <DetailRow label="Failed at">{formatDateTime(shipment.failedAt)}</DetailRow>
          )}
          {shipment.returnedAt && (
            <DetailRow label="Returned at">{formatDateTime(shipment.returnedAt)}</DetailRow>
          )}
          {shipment.note && <DetailRow label="Note">{shipment.note}</DetailRow>}
          <DetailRow label="Created">{formatDateTime(shipment.createdAt)}</DetailRow>
          <DetailRow label="Updated">{formatDateTime(shipment.updatedAt)}</DetailRow>
        </dl>

        <div className="rounded-md border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Shipping address</h3>
          <p className="mt-2 text-sm text-foreground">
            {address.recipientName} · {address.phone}
          </p>
          <p className="text-sm text-muted-foreground">
            {address.addressLine}
            {[address.district || address.area, address.city, address.postalCode, address.country]
              .filter(Boolean)
              .map((part) => `, ${part}`)
              .join("")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Snapshot of the order&apos;s address taken by the server at creation
            time.
          </p>
        </div>

        <ShipmentTimeline
          shipmentId={shipment.id}
          open={open}
          refreshKey={timelineRefreshKey}
        />

        {canManage && (
          <div className="space-y-3 border-t border-border pt-4">
            {cancelError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {cancelError}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {editable && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  disabled={isSubmitting}
                >
                  Edit
                </Button>
              )}
              {hasNextTransition && (
                <Button
                  type="button"
                  size="sm"
                  onClick={onOpenStatus}
                  disabled={isSubmitting}
                >
                  Update status
                </Button>
              )}
              {cancellable && !confirmingCancel && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmingCancel(true)}
                  disabled={isSubmitting}
                >
                  Cancel shipment
                </Button>
              )}
            </div>
            {confirmingCancel && (
              <div className="flex flex-col items-stretch justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 sm:flex-row sm:items-center">
                <p className="text-sm text-foreground">
                  Cancel {shipment.shipmentNumber}? This is irreversible; the
                  server records it as a history event.
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmingCancel(false)}
                    disabled={isSubmitting}
                  >
                    Keep shipment
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelConfirm}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Cancelling..." : "Confirm cancel"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}