"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { UserRecord } from "../types";

export type UserStatusAction = "approve" | "reject" | "disable" | "enable";

const ACTION_META: Record<
  UserStatusAction,
  { title: string; description: string; confirmLabel: string; destructive: boolean }
> = {
  approve: {
    title: "Approve registration",
    description:
      "This activates the account and lets the user sign in with the permissions of their requested role.",
    confirmLabel: "Approve account",
    destructive: false,
  },
  reject: {
    title: "Reject registration",
    description:
      "The user will not be able to sign in. A rejected registration can only be re-created by the Owner.",
    confirmLabel: "Reject account",
    destructive: true,
  },
  disable: {
    title: "Disable account",
    description:
      "The user will immediately lose access until the account is enabled again. Their data is kept.",
    confirmLabel: "Disable account",
    destructive: true,
  },
  enable: {
    title: "Enable account",
    description: "Restores sign-in access for this user.",
    confirmLabel: "Enable account",
    destructive: false,
  },
};

interface UserStatusDialogProps {
  open: boolean;
  action: UserStatusAction | null;
  user: UserRecord | null;
  isSubmitting: boolean;
  onConfirm: (user: UserRecord) => void;
  onOpenChange: (open: boolean) => void;
}

export function UserStatusDialog({
  open,
  action,
  user,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: UserStatusDialogProps) {
  if (!action || !user) return null;
  const meta = ACTION_META[action];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>
            {meta.description} Target: <span className="font-medium text-foreground">@{user.username}</span>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={meta.destructive ? "destructive" : "default"}
            onClick={() => onConfirm(user)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {meta.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}