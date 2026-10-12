"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { PurchaseForm } from "./PurchaseForm";
import type { CreatePurchaseInput, Purchase, UpdatePurchaseInput } from "../types";

interface PurchaseDialogProps {
  mode: "create" | "edit";
  open: boolean;
  purchase: Purchase | null;
  isSubmitting: boolean;
  onSubmit: (
    values: CreatePurchaseInput | UpdatePurchaseInput
  ) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseDialog({
  mode,
  open,
  purchase,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: PurchaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New purchase" : `Edit ${purchase?.purchaseNumber ?? "purchase"}`}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Record a purchase from a supplier. Purchase numbers and totals are assigned by the server."
              : "Only draft purchases can be edited. Unit costs and totals are stored and recalculated by the server."}
          </DialogDescription>
        </DialogHeader>
        <PurchaseForm
          key={mode === "create" ? "create-purchase" : `edit-purchase-${purchase?.id ?? "unknown"}`}
          mode={mode}
          purchase={purchase}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
