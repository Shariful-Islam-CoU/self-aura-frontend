"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { statusBadge, roleBadge } from "./UserBadges";
import type { UserRecord } from "../types";
import {
  Check,
  X,
  Ban,
  RotateCcw,
  UserCog,
  KeyRound,
  Pencil,
} from "lucide-react";

export interface UserActions {
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canDisable: boolean;
  canEnable: boolean;
  canChangeRole: boolean;
  canResetPassword: boolean;
}

interface UsersTableProps {
  users: UserRecord[];
  currentUserId: string;
  actions: UserActions;
  onEdit: (user: UserRecord) => void;
  onApprove: (user: UserRecord) => void;
  onReject: (user: UserRecord) => void;
  onDisable: (user: UserRecord) => void;
  onEnable: (user: UserRecord) => void;
  onChangeRole: (user: UserRecord) => void;
  onResetPassword: (user: UserRecord) => void;
}

export function UsersTable({
  users,
  currentUserId,
  actions,
  onEdit,
  onApprove,
  onReject,
  onDisable,
  onEnable,
  onChangeRole,
  onResetPassword,
}: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          // Only pending accounts can be approved/rejected.
          const isPending = user.status === "pending";
          const canDisableHere = actions.canDisable && user.status === "active";
          const canEnableHere = actions.canEnable && user.status === "disabled";
          const noActions =
            !actions.canEdit &&
            !actions.canApprove &&
            !actions.canReject &&
            !canDisableHere &&
            !canEnableHere &&
            !actions.canChangeRole &&
            !actions.canResetPassword;

          return (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {user.name || user.username}
                    {isSelf && (
                      <Badge variant="secondary" className="ml-2">
                        You
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">@{user.username}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {roleBadge(user.role)}
                  {user.isPrincipalOwner && (
                    <Badge variant="warning">Principal Owner</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{statusBadge(user.status)}</TableCell>
              <TableCell>
                <div className="flex flex-col text-xs text-muted-foreground">
                  <span>{user.email || "—"}</span>
                  <span>{user.phone || "—"}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {noActions ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {isPending && actions.canApprove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApprove(user)}
                        title="Approve registration"
                        aria-label={`Approve ${user.username}`}
                      >
                        <Check className="h-4 w-4 text-success" aria-hidden="true" />
                        Approve
                      </Button>
                    )}
                    {isPending && actions.canReject && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReject(user)}
                        title="Reject registration"
                        aria-label={`Reject ${user.username}`}
                      >
                        <X className="h-4 w-4 text-destructive" aria-hidden="true" />
                        Reject
                      </Button>
                    )}
                    {canDisableHere && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDisable(user)}
                        title="Disable account"
                        aria-label={`Disable ${user.username}`}
                      >
                        <Ban className="h-4 w-4" aria-hidden="true" />
                        Disable
                      </Button>
                    )}
                    {canEnableHere && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEnable(user)}
                        title="Enable account"
                        aria-label={`Enable ${user.username}`}
                      >
                        <RotateCcw className="h-4 w-4 text-success" aria-hidden="true" />
                        Enable
                      </Button>
                    )}
                    {actions.canChangeRole && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChangeRole(user)}
                        title="Change role"
                        aria-label={`Change role of ${user.username}`}
                      >
                        <UserCog className="h-4 w-4" aria-hidden="true" />
                        Role
                      </Button>
                    )}
                    {actions.canResetPassword && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResetPassword(user)}
                        title="Reset password"
                        aria-label={`Reset password of ${user.username}`}
                      >
                        <KeyRound className="h-4 w-4" aria-hidden="true" />
                        Password
                      </Button>
                    )}
                    {actions.canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user)}
                        title="Edit profile details"
                        aria-label={`Edit ${user.username}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}