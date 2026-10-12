import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { RefundStatusBadge, ReturnStatusBadge } from "./ReturnStatusBadge";
import type { RejectReturnData, Return } from "../types";
import {
  formatAmount,
  formatDate,
  getReturnConditionLabel,
  getReturnReasonLabel,
} from "../utils";

export interface ReturnDetailsProps {
  open: boolean;
  returnRecord: Return | null;
  canManage: boolean;
  isSubmitting: boolean;
  onCancel: (id: string) => Promise<void>;
  onReject: (id: string, input: RejectReturnData) => Promise<void>;
  onOpenApprove: () => void;
  onOpenReceive: () => void;
  onOpenRefund: () => void;
  onOpenEdit: () => void;
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

// The dialog content is remounted on every open, so the reject/cancel form
// state never leaks between opens.
export function ReturnDetails(props: ReturnDetailsProps) {
  const { open, onOpenChange } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <ReturnDetailsContent {...props} />}
    </Dialog>
  );
}

// Full return record (backend-mapped ReturnResponse). Actions only appear for
// valid backend transitions (RETURN_STATUS_TRANSITIONS) and the caller's role.
function ReturnDetailsContent({
  returnRecord,
  canManage,
  isSubmitting,
  onCancel,
  onReject,
  onOpenApprove,
  onOpenReceive,
  onOpenRefund,
  onOpenEdit,
}: ReturnDetailsProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (!returnRecord) return null;

  const requested = returnRecord.status === "requested";
  const approved = returnRecord.status === "approved";
  const receivedButNotRefunded =
    returnRecord.status === "received" && returnRecord.refundStatus !== "refunded";
  const cancellable = requested || approved;
  const canCancelApproved = canManage;

  const handleCancel = async () => {
    setActionError(null);
    try {
      await onCancel(returnRecord.id);
      setConfirmCancel(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to cancel return.");
    }
  };

  const handleReject = async () => {
    setActionError(null);
    try {
      await onReject(returnRecord.id, {
        note: rejectNote.trim() || undefined,
      });
      setRejectOpen(false);
      setRejectNote("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to reject return.");
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{returnRecord.returnNumber}</DialogTitle>
        <DialogDescription>
          Return requested on {formatDate(returnRecord.createdAt)}.
        </DialogDescription>
      </DialogHeader>

      <dl className="divide-y divide-border">
        <DetailRow label="Order">
          {returnRecord.order.orderNumber ?? returnRecord.order.id}
          {typeof returnRecord.order.total === "number"
            ? ` · ${formatAmount(returnRecord.order.total)}`
            : ""}
          {returnRecord.order.orderStatus
            ? ` · ${returnRecord.order.orderStatus}`
            : ""}
        </DetailRow>
        <DetailRow label="Customer">
          {returnRecord.customer.name ?? returnRecord.customer.id}
          {returnRecord.customer.phone ? ` · ${returnRecord.customer.phone}` : ""}
        </DetailRow>
        <DetailRow label="Reason">{getReturnReasonLabel(returnRecord.reason)}</DetailRow>
        <DetailRow label="Return date">{formatDate(returnRecord.returnDate)}</DetailRow>
        <DetailRow label="Status">
          <ReturnStatusBadge status={returnRecord.status} />
        </DetailRow>
        <DetailRow label="Refund status">
          <RefundStatusBadge status={returnRecord.refundStatus} />
        </DetailRow>
        <DetailRow label="Subtotal">
          <span className="tabular-nums">{formatAmount(returnRecord.subtotal)}</span>
        </DetailRow>
        <DetailRow label="Refund amount">
          <span className="font-medium tabular-nums">
            {formatAmount(returnRecord.refundAmount)}
          </span>
        </DetailRow>
        {returnRecord.note && <DetailRow label="Note">{returnRecord.note}</DetailRow>}
        {returnRecord.approvedBy && (
          <DetailRow label="Approved by">
            {returnRecord.approvedBy.username ?? returnRecord.approvedBy.id}
            {returnRecord.approvedBy.role ? ` · ${returnRecord.approvedBy.role}` : ""}
            {returnRecord.approvedAt ? ` · ${formatDate(returnRecord.approvedAt)}` : ""}
          </DetailRow>
        )}
        {returnRecord.completedAt && (
          <DetailRow label="Completed at">{formatDate(returnRecord.completedAt)}</DetailRow>
        )}
        <DetailRow label="Created by">
          {returnRecord.createdBy.username ?? returnRecord.createdBy.id}
          {returnRecord.createdBy.role ? ` · ${returnRecord.createdBy.role}` : ""}
        </DetailRow>
        <DetailRow label="Created">{formatDate(returnRecord.createdAt)}</DetailRow>
        <DetailRow label="Updated">{formatDate(returnRecord.updatedAt)}</DetailRow>
      </dl>

      <div className="rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-label">Product</th>
                <th className="px-3 py-2 font-label">SKU</th>
                <th className="px-3 py-2 font-label text-right">Qty</th>
                <th className="px-3 py-2 font-label text-right">Unit price</th>
                <th className="px-3 py-2 font-label text-right">Refund</th>
                <th className="px-3 py-2 font-label">Reason</th>
                <th className="px-3 py-2 font-label">Condition</th>
              </tr>
            </thead>
            <tbody>
              {returnRecord.items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium text-foreground">
                    {item.productName}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{item.sku}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatAmount(item.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatAmount(item.refundAmount)}
                  </td>
                  <td className="px-3 py-2">{getReturnReasonLabel(item.reason)}</td>
                  <td className="px-3 py-2">{getReturnConditionLabel(item.condition)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {actionError}
        </div>
      )}

      {(cancellable || requested || approved || receivedButNotRefunded) && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          {requested && canManage && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={onOpenEdit} disabled={isSubmitting}>
                Edit
              </Button>
              <Button type="button" size="sm" onClick={onOpenApprove} disabled={isSubmitting}>
                Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectOpen(true);
                  setActionError(null);
                }}
                disabled={isSubmitting}
              >
                Reject
              </Button>
            </>
          )}
          {approved && canManage && (
            <Button type="button" size="sm" onClick={onOpenReceive} disabled={isSubmitting}>
              Receive return
            </Button>
          )}
          {receivedButNotRefunded && canManage && (
            <Button type="button" variant="outline" size="sm" onClick={onOpenRefund} disabled={isSubmitting}>
              Retry refund
            </Button>
          )}
          {cancellable && (!approved || canCancelApproved) && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setConfirmCancel(true);
                setActionError(null);
              }}
              disabled={isSubmitting}
            >
              Cancel return
            </Button>
          )}
        </div>
      )}

      {canManage && rejectOpen && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleReject();
          }}
          className="space-y-3 rounded-md border border-border p-3"
        >
          <p className="text-sm font-medium">Reject {returnRecord.returnNumber}?</p>
          <Textarea
            label="Rejection note"
            id="return-reject-note"
            maxLength={2000}
            placeholder="Optional reason for rejection"
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectOpen(false);
                setRejectNote("");
              }}
              disabled={isSubmitting}
            >
              Keep request
            </Button>
            <Button type="submit" variant="destructive" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Rejecting..." : "Reject return"}
            </Button>
          </div>
        </form>
      )}

      {confirmCancel && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-foreground">
            Cancel {returnRecord.returnNumber}? The backend keeps the record
            and marks its status as cancelled.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmCancel(false)}
              disabled={isSubmitting}
            >
              Keep return
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cancelling..." : "Yes, cancel return"}
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  );
}