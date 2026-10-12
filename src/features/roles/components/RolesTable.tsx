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
import type { RoleRecord } from "../types";
import { KeyRound, Pencil, Trash2 } from "lucide-react";

export interface RoleActions {
  canEdit: boolean;
  canManagePermissions: boolean;
  canDelete: boolean;
}

interface RolesTableProps {
  roles: RoleRecord[];
  actions: RoleActions;
  onEdit: (role: RoleRecord) => void;
  onManagePermissions: (role: RoleRecord) => void;
  onDelete: (role: RoleRecord) => void;
}

export function RolesTable({
  roles,
  actions,
  onEdit,
  onManagePermissions,
  onDelete,
}: RolesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Role</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Permissions</TableHead>
          <TableHead>Users</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => {
          const noActions =
            !actions.canEdit && !actions.canManagePermissions && !actions.canDelete;
          return (
            <TableRow key={role.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{role.name}</span>
                  {role.isSystem && <Badge variant="secondary">System</Badge>}
                  {!role.isActive && <Badge variant="warning">Inactive</Badge>}
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {role.description || "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{role.permissions.length}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{role.userCount}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {noActions ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {actions.canManagePermissions && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManagePermissions(role)}
                        title="Manage permission set"
                        aria-label={`Manage permissions of ${role.name}`}
                      >
                        <KeyRound className="h-4 w-4" aria-hidden="true" />
                        Permissions
                      </Button>
                    )}
                    {actions.canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(role)}
                        title="Edit role"
                        aria-label={`Edit ${role.name}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                    )}
                    {actions.canDelete && !role.isSystem && role.userCount === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(role)}
                        title="Delete role"
                        aria-label={`Delete ${role.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        Delete
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