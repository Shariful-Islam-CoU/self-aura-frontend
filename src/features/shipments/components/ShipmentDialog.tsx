import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { ShipmentForm } from "./ShipmentForm";
import type {
  CreateShipmentData,
  Shipment,
  UpdateShipmentData,
} from "../types";

export interface ShipmentDialogProps {
  mode: "create" | "edit";
  open: boolean;
  shipment?: Shipment | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateShipmentData | UpdateShipmentData) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

// The form is remounted on every open so field state never leaks between
// create/edit runs.
export function ShipmentDialog({
  mode,
  open,
  shipment,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: ShipmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create shipment" : `Edit ${shipment?.shipmentNumber ?? "shipment"}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Ship an existing order. The server validates eligibility, the courier and the tracking number, then assigns the SHP number and snapshots the order address."
              : "Update courier, tracking, charge or note. The linked order cannot be changed."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ShipmentForm
            key={`${mode}-${shipment?.id ?? "new"}`}
            mode={mode}
            shipment={shipment}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}