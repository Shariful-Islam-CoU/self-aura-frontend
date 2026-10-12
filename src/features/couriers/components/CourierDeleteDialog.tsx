import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { Courier } from "../types";

export interface CourierDeleteDialogProps {
  open: boolean;
  courier: Courier | null;
  isSubmitting: boolean;
  onConfirm: (id: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

// Deactivation, not deletion: DELETE /couriers/:id marks the courier inactive.
// The backend rejects (409) deactivation while the courier has active
// shipments, and there is no reactivation endpoint.
export function CourierDeleteDialog({
  open,
  courier,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: CourierDeleteDialogProps) {
  const [actionError, setActionError] = useState<string | null>(null);

  if (!courier) return null;

  const handleConfirm = async () => {
    setActionError(null);
    try {
      await onConfirm(courier.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to deactivate courier.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate {courier.name}?</DialogTitle>
          <DialogDescription>
            The courier is marked inactive and will no longer be selectable for
            new shipments. The server refuses deactivation while the courier
            still has active shipments, and there is no UI to reactivate a
            courier (the backend exposes no reactivation endpoint).
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Contact person:</span>{" "}
            {courier.contactPerson ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Phone:</span> {courier.phone ?? "—"}
          </p>
        </div>

        {actionError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {actionError}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Keep courier
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Deactivating..." : "Deactivate courier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}