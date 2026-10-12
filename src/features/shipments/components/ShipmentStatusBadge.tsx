import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { ShipmentStatus } from "../constants";
import { getShipmentStatusLabel } from "../utils";

export interface ShipmentStatusBadgeProps {
  status: ShipmentStatus;
  className?: string;
}

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary"
  | "outline";

const variantByStatus: Record<ShipmentStatus, BadgeVariant> = {
  pending: "warning",
  ready_to_ship: "info",
  shipped: "info",
  in_transit: "info",
  delivered: "success",
  delivery_failed: "destructive",
  returned_to_seller: "secondary",
  cancelled: "outline",
};

// Renders the exact backend shipment status enum; never an invented value.
export function ShipmentStatusBadge({ status, className }: ShipmentStatusBadgeProps) {
  return (
    <Badge
      variant={variantByStatus[status] ?? "default"}
      className={cn("whitespace-nowrap", className)}
    >
      {getShipmentStatusLabel(status)}
    </Badge>
  );
}