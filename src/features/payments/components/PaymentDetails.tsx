import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PaymentMethodBadge } from "./PaymentMethodBadge";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PaymentTypeBadge } from "./PaymentTypeBadge";
import { isManualPaymentMethod, PAYMENT_METHODS } from "../constants";
import type { Payment, RefundPaymentInput, RejectPaymentInput } from "../types";
import {
  formatAmount,
  formatDate,
  getPaymentMethodLabel,
} from "../utils";

export interface PaymentDetailsProps {
  open: boolean;
  payment: Payment | null;
  canManage: boolean;
  isSubmitting: boolean;
  /** Holders of the payments.verify permission (manual bKash/Nagad only). */
  canVerify?: boolean;
  /** Holders of the payments.reject permission (manual bKash/Nagad only). */
  canReject?: boolean;
  onCancel?: (id: string) => Promise<void>;
  onRefund?: (id: string, input: RefundPaymentInput) => Promise<void>;
  onVerify?: (id: string) => Promise<void>;
  onReject?: (id: string, input: RejectPaymentInput) => Promise<void>;
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

const todayInputValue = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// The dialog content is remounted on every open, so the cancel-confirm/refund
// and verify/reject form state never leaks between opens.
export function PaymentDetails(props: PaymentDetailsProps) {
  const { open, onOpenChange } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <PaymentDetailsContent {...props} />}
    </Dialog>
  );
}

function PaymentDetailsContent({
  payment,
  canManage,
  isSubmitting,
  canVerify = false,
  canReject = false,
  onCancel,
  onRefund,
  onVerify,
  onReject,
}: PaymentDetailsProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [confirmVerify, setConfirmVerify] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | undefined>(undefined);
  const [actionError, setActionError] = useState<string | null>(null);

  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState<
    (typeof PAYMENT_METHODS)[number] | undefined
  >(undefined);
  const [refundDate, setRefundDate] = useState(todayInputValue());
  const [refundReference, setRefundReference] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [refundError, setRefundError] = useState<string | undefined>(undefined);

  if (!payment) return null;

  const isManual = isManualPaymentMethod(payment.paymentMethod);
  const isSubmitted = payment.paymentStatus === "submitted";

  // Manual bKash/Nagad payments awaiting verification are the only ones that
  // can be verified or rejected. Legacy methods keep their existing lifecycle.
  const isVerifiable = isManual && isSubmitted;
  const isRejectable = isManual && isSubmitted;

  const isCancellable =
    payment.paymentType === "payment" && payment.paymentStatus !== "cancelled" && !isSubmitted;
  const isRefundable =
    payment.paymentType === "payment" && payment.paymentStatus !== "cancelled" && !isSubmitted;

  const handleCancel = async () => {
    if (!onCancel) return;
    setActionError(null);
    try {
      await onCancel(payment.id);
      setConfirmCancel(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to cancel payment."
      );
    }
  };

  const handleVerify = async () => {
    if (!onVerify) return;
    setActionError(null);
    try {
      await onVerify(payment.id);
      setConfirmVerify(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to verify payment."
      );
    }
  };

  const handleReject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onReject) return;

    if (rejectReason.trim().length > 500) {
      setRejectError("Rejection reason must be at most 500 characters.");
      return;
    }

    setRejectError(undefined);
    setActionError(null);
    try {
      await onReject(payment.id, {
        rejectionReason: rejectReason.trim() || undefined,
      });
      setRejectOpen(false);
      setRejectReason("");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to reject payment."
      );
    }
  };

  const handleRefund = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onRefund) return;

    const parsed = Number(refundAmount);
    if (!refundAmount.trim()) {
      setRefundError("Amount is required.");
      return;
    }
    if (Number.isNaN(parsed) || parsed <= 0) {
      setRefundError("Amount must be greater than zero.");
      return;
    }
    if (parsed > 100000000000) {
      setRefundError("Amount is too large.");
      return;
    }
    if (refundReference.trim().length > 200) {
      setRefundError("Reference must be at most 200 characters.");
      return;
    }
    if (refundNote.trim().length > 2000) {
      setRefundError("Note must be at most 2000 characters.");
      return;
    }

    setRefundError(undefined);
    setActionError(null);
    try {
      await onRefund(payment.id, {
        amount: parsed,
        paymentMethod: refundMethod || undefined,
        paymentDate: refundDate || undefined,
        reference: refundReference.trim() || undefined,
        note: refundNote.trim() || undefined,
      });
      setRefundOpen(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to record refund."
      );
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{payment.paymentNumber}</DialogTitle>
        <DialogDescription>
          Payment recorded on {formatDate(payment.createdAt)}.
        </DialogDescription>
      </DialogHeader>

      <dl className="divide-y divide-border">
        <DetailRow label="Payment no.">{payment.paymentNumber}</DetailRow>
        <DetailRow label="Customer">
          {payment.customer.name ?? payment.customer.id}
          {payment.customer.phone ? ` · ${payment.customer.phone}` : ""}
        </DetailRow>
        <DetailRow label="Order">
          {payment.order.orderNumber ?? payment.order.id}
          {typeof payment.order.total === "number"
            ? ` · ${formatAmount(payment.order.total)}`
            : ""}
        </DetailRow>
        <DetailRow label="Amount">
          <span className="font-medium tabular-nums">
            {formatAmount(payment.amount)}
          </span>
        </DetailRow>
        <DetailRow label="Type">
          <PaymentTypeBadge type={payment.paymentType} />
        </DetailRow>
        <DetailRow label="Method">
          <PaymentMethodBadge method={payment.paymentMethod} />
        </DetailRow>
        <DetailRow label="Status">
          <PaymentStatusBadge status={payment.paymentStatus} />
        </DetailRow>
        <DetailRow label="Payment date">{formatDate(payment.paymentDate)}</DetailRow>
        {isManual ? (
          <DetailRow label="Transaction ID">{payment.reference ?? "—"}</DetailRow>
        ) : (
          payment.reference && (
            <DetailRow label="Reference">{payment.reference}</DetailRow>
          )
        )}
        {payment.verifiedAt && (
          <DetailRow label="Verified at">{formatDate(payment.verifiedAt)}</DetailRow>
        )}
        {payment.verifiedBy && (
          <DetailRow label="Verified by">
            {payment.verifiedBy.username ?? payment.verifiedBy.id}
            {payment.verifiedBy.role ? ` · ${payment.verifiedBy.role}` : ""}
          </DetailRow>
        )}
        {payment.rejectedAt && (
          <DetailRow label="Rejected at">{formatDate(payment.rejectedAt)}</DetailRow>
        )}
        {payment.rejectedBy && (
          <DetailRow label="Rejected by">
            {payment.rejectedBy.username ?? payment.rejectedBy.id}
            {payment.rejectedBy.role ? ` · ${payment.rejectedBy.role}` : ""}
          </DetailRow>
        )}
        {payment.rejectionReason && (
          <DetailRow label="Rejection reason">{payment.rejectionReason}</DetailRow>
        )}
        {payment.note && <DetailRow label="Note">{payment.note}</DetailRow>}
        {payment.parentPayment && (
          <DetailRow label="Parent payment">
            {payment.parentPayment.paymentNumber ?? payment.parentPayment.id}
            {typeof payment.parentPayment.amount === "number"
              ? ` · ${formatAmount(payment.parentPayment.amount)}`
              : ""}
          </DetailRow>
        )}
        {payment.cancelledAt && (
          <DetailRow label="Cancelled at">
            {formatDate(payment.cancelledAt)}
          </DetailRow>
        )}
        <DetailRow label="Created by">
          {payment.createdBy.username ?? payment.createdBy.id}
          {payment.createdBy.role ? ` · ${payment.createdBy.role}` : ""}
        </DetailRow>
        <DetailRow label="Created">{formatDate(payment.createdAt)}</DetailRow>
      </dl>

      {actionError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {actionError}
        </div>
      )}

      {(canManage && (isCancellable || isRefundable)) ||
      ((canVerify && isVerifiable) || (canReject && isRejectable)) ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          {isRefundable && !refundOpen && !confirmCancel && !confirmVerify && !rejectOpen && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRefundOpen(true);
                setActionError(null);
              }}
            >
              Record refund
            </Button>
          )}
          {isCancellable && !confirmCancel && !refundOpen && !confirmVerify && !rejectOpen && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setConfirmCancel(true);
                setActionError(null);
              }}
            >
              Cancel payment
            </Button>
          )}
          {canVerify &&
            isVerifiable &&
            !confirmVerify &&
            !rejectOpen &&
            !confirmCancel &&
            !refundOpen && (
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  setConfirmVerify(true);
                  setActionError(null);
                }}
              >
                Verify payment
              </Button>
            )}
          {canReject &&
            isRejectable &&
            !rejectOpen &&
            !confirmVerify &&
            !confirmCancel &&
            !refundOpen && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setRejectOpen(true);
                  setActionError(null);
                }}
              >
                Reject payment
              </Button>
            )}
        </div>
      ) : null}

      {canManage && confirmCancel && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-foreground">
            Cancel {payment.paymentNumber}? The backend keeps the record and
            marks its status as cancelled.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmCancel(false)}
              disabled={isSubmitting}
            >
              Keep payment
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cancelling..." : "Yes, cancel payment"}
            </Button>
          </div>
        </div>
      )}

      {canVerify && confirmVerify && (
        <div className="rounded-md border border-border bg-accent/30 p-3">
          <p className="text-sm text-foreground">
            Verify {payment.paymentNumber}? Only verified payments count as
            confirmed income, and the order will be marked as paid. This action
            is recorded in the audit log.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmVerify(false)}
              disabled={isSubmitting}
            >
              Keep submitted
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleVerify}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Yes, verify payment"}
            </Button>
          </div>
        </div>
      )}

      {canReject && rejectOpen && (
        <form
          onSubmit={handleReject}
          className="space-y-4 rounded-md border border-destructive/30 bg-destructive/5 p-3"
          noValidate
        >
          <p className="text-sm font-medium text-foreground">
            Reject {payment.paymentNumber}? The order stays unpaid and the
            payment will not count as income.
          </p>
          {rejectError && (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {rejectError}
            </div>
          )}
          <Textarea
            label="Rejection reason (optional)"
            id="reject-reason"
            maxLength={500}
            placeholder="For example: transaction ID does not match the bKash reference"
            value={rejectReason}
            onChange={(event) => {
              setRejectReason(event.target.value);
              setRejectError(undefined);
            }}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectOpen(false);
                setRejectReason("");
                setRejectError(undefined);
              }}
              disabled={isSubmitting}
            >
              Keep submitted
            </Button>
            <Button type="submit" variant="destructive" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Rejecting..." : "Yes, reject payment"}
            </Button>
          </div>
        </form>
      )}

      {canManage && refundOpen && (
        <form onSubmit={handleRefund} className="space-y-4 rounded-md border border-border p-3" noValidate>
          <p className="text-sm font-medium">Record refund for {payment.paymentNumber}</p>
          {refundError && (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {refundError}
            </div>
          )}
          <Input
            label="Refund amount"
            id="refund-amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            value={refundAmount}
            onChange={(event) => {
              setRefundAmount(event.target.value);
              setRefundError(undefined);
            }}
          />
          <div className="space-y-1.5">
            <label
              htmlFor="refund-method"
              className="block text-sm font-label text-foreground"
            >
              Payment method
            </label>
            <select
              id="refund-method"
              className={selectClassName}
              value={refundMethod ?? ""}
              onChange={(event) =>
                setRefundMethod(
                  (event.target.value || undefined) as
                    | (typeof PAYMENT_METHODS)[number]
                    | undefined
                )
              }
            >
              <option value="">Same as original (server default)</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {getPaymentMethodLabel(method)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Refund date"
            id="refund-date"
            type="date"
            value={refundDate}
            onChange={(event) => setRefundDate(event.target.value)}
          />
          <Input
            label="Reference"
            id="refund-reference"
            maxLength={200}
            value={refundReference}
            onChange={(event) => setRefundReference(event.target.value)}
          />
          <Textarea
            label="Note"
            id="refund-note"
            maxLength={2000}
            value={refundNote}
            onChange={(event) => setRefundNote(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRefundOpen(false)}
              disabled={isSubmitting}
            >
              Discard
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record refund"}
            </Button>
          </div>
        </form>
      )}
    </DialogContent>
  );
}