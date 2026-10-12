// Small display helpers for user status and role badges.
import { Badge } from "@/components/ui/Badge";
import { getRoleDisplayName } from "@/lib/auth/authUtils";
import type { UserStatus } from "../types";

const STATUS_VARIANTS: Record<UserStatus, "success" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  pending: "warning",
  rejected: "destructive",
  disabled: "secondary",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  pending: "Pending approval",
  rejected: "Rejected",
  disabled: "Disabled",
};

export function statusBadge(status: UserStatus) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
  );
}

export function roleBadge(role: string) {
  return <Badge variant="outline">{getRoleDisplayName(role)}</Badge>;
}