import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { CourierStatusBadge } from "./CourierStatusBadge";
import type { Courier } from "../types";
import { formatDate, toWebsiteHref } from "../utils";

export interface CourierDetailsProps {
  open: boolean;
  courier: Courier | null;
  canManage: boolean;
  isSubmitting: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
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

export function CourierDetails({
  open,
  courier,
  canManage,
  isSubmitting,
  onEdit,
  onDeactivate,
  onOpenChange,
}: CourierDetailsProps) {
  if (!courier) return null;

  const websiteHref = toWebsiteHref(courier.website);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{courier.name}</DialogTitle>
          <DialogDescription>
            Courier registered on {formatDate(courier.createdAt)}.
          </DialogDescription>
        </DialogHeader>

        <dl className="divide-y divide-border">
          <DetailRow label="Status">
            <CourierStatusBadge isActive={courier.isActive} />
          </DetailRow>
          {courier.contactPerson && (
            <DetailRow label="Contact person">{courier.contactPerson}</DetailRow>
          )}
          {courier.phone && <DetailRow label="Phone">{courier.phone}</DetailRow>}
          {courier.website && (
            <DetailRow label="Website">
              {websiteHref ? (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {courier.website.trim()}
                </a>
              ) : (
                courier.website.trim()
              )}
            </DetailRow>
          )}
          {courier.address && <DetailRow label="Address">{courier.address}</DetailRow>}
          {courier.notes && <DetailRow label="Notes">{courier.notes}</DetailRow>}
          <DetailRow label="Created">{formatDate(courier.createdAt)}</DetailRow>
          <DetailRow label="Updated">{formatDate(courier.updatedAt)}</DetailRow>
        </dl>

        {canManage && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              disabled={isSubmitting}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDeactivate}
              disabled={isSubmitting}
            >
              Deactivate
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}