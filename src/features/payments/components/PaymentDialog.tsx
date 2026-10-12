import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { PaymentForm } from "./PaymentForm";
import type { CreatePaymentInput, Payment, UpdatePaymentInput } from "../types";

export interface PaymentDialogProps {
  mode: "create" | "edit";
  open: boolean;
  payment: Payment | null;
  isSubmitting: boolean;
  onSubmit: (values: CreatePaymentInput | UpdatePaymentInput) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

// The form is remounted on every open so field state never leaks between
// create/edit runs.
export function PaymentDialog({
  mode,
  open,
  payment,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Record payment"
              : `Edit ${payment?.paymentNumber ?? "payment"}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Payment number is assigned by the server after recording."
              : "Method, date, reference and note can be updated."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <PaymentForm
            key={`${mode}-${payment?.id ?? "new"}`}
            mode={mode}
            payment={payment}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
