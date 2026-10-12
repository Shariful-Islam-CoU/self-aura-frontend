"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { CustomerForm } from "./CustomerForm";
import type {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "../types";

interface CustomerDialogProps {
  open: boolean;
  mode: "create" | "edit";
  customer?: Customer | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateCustomerInput | UpdateCustomerInput) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDialog({
  open,
  mode,
  customer,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: CustomerDialogProps) {
  const isEdit = mode === "edit";

  const handleSubmit = async (
    values: CreateCustomerInput | UpdateCustomerInput
  ) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the customer details below."
              : "Add a new customer to your business."}
          </DialogDescription>
        </DialogHeader>
        <CustomerForm
          key={isEdit ? customer?.id ?? "edit" : "create"}
          mode={mode}
          initialValues={isEdit ? customer : null}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}