import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { CourierForm } from "./CourierForm";
import type { Courier, CreateCourierData, UpdateCourierData } from "../types";

export interface CourierDialogProps {
  mode: "create" | "edit";
  open: boolean;
  courier?: Courier | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateCourierData | UpdateCourierData) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

// The form is remounted on every open so field state never leaks between
// create/edit runs.
export function CourierDialog({
  mode,
  open,
  courier,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: CourierDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Create courier"
              : `Edit ${courier?.name ?? "courier"}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a shipping partner. The server rejects duplicate courier names."
              : "Update courier details. Deactivation is handled separately."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CourierForm
            key={`${mode}-${courier?.id ?? "new"}`}
            mode={mode}
            courier={courier}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}