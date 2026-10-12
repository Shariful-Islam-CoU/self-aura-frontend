"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { SupplierForm } from "./SupplierForm";
import type { SupplierFormValues } from "./SupplierForm";
import type { Supplier } from "../types";

interface SupplierDialogProps {
  open: boolean;
  mode: "create" | "edit";
  supplier: Supplier | null;
  isSubmitting: boolean;
  onSubmit: (values: SupplierFormValues) => Promise<Supplier>;
  onOpenChange: (open: boolean) => void;
}

export function SupplierDialog({
  open,
  mode,
  supplier,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: SupplierDialogProps) {
  const handleSubmit = async (values: SupplierFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create supplier" : "Edit supplier"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new supplier to the directory."
              : `Update details for ${supplier?.name ?? "this supplier"}.`}
          </DialogDescription>
        </DialogHeader>
        <SupplierForm
          key={mode === "edit" ? `edit-${supplier?.id ?? "none"}` : "create"}
          mode={mode}
          supplier={mode === "edit" ? supplier : null}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}