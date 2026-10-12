import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { getCourierStatusLabel } from "../utils";

export interface CourierStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

// Courier status is the backend boolean `isActive` - the badge simply renders
// Active/Inactive, never an invented enum value.
export function CourierStatusBadge({ isActive, className }: CourierStatusBadgeProps) {
  return (
    <Badge
      variant={isActive ? "success" : "outline"}
      className={cn("whitespace-nowrap", className)}
    >
      {getCourierStatusLabel(isActive)}
    </Badge>
  );
}