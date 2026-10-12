import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { ReturnForm } from "./ReturnForm";
import type { CreateReturnData, Return, UpdateReturnData } from "../types";

export interface ReturnDialogProps {
  mode: "create" | "edit";
  open: boolean;
  returnRecord?: Return | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateReturnData | UpdateReturnData) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

// The form is remounted on every open so field state never leaks between
// create/edit runs.
export function ReturnDialog({
  mode,
  open,
  returnRecord,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: ReturnDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Create return"
              : `Edit ${returnRecord?.returnNumber ?? "return"}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Only delivered orders can be returned. Refund amounts are computed and assigned by the server."
              : "Returns can be edited while their status is Requested."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ReturnForm
            key={`${mode}-${returnRecord?.id ?? "new"}`}
            mode={mode}
            returnRecord={returnRecord}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}