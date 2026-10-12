"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { OrderForm } from "./OrderForm";
import type { CreateOrderInput, Order } from "../types";

interface OrderDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onSubmit: (values: CreateOrderInput) => Promise<Order>;
  onOpenChange: (open: boolean) => void;
}

// Orders are created through the backend's POST /orders; there is no order
// editing endpoint, so this dialog only supports creation.
export function OrderDialog({
  open,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: OrderDialogProps) {
  const handleSubmit = async (values: CreateOrderInput) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create order</DialogTitle>
          <DialogDescription>
            Add a new sales order. Order numbers and totals are assigned by the
            server.
          </DialogDescription>
        </DialogHeader>
        <OrderForm
          key="create-order"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}