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
import type { PermissionRecord } from "../types";
import { Pencil, Trash2 } from "lucide-react";

export interface PermissionActions {
  canEdit: boolean;
  canDelete: boolean;
}

interface PermissionsTableProps {
  permissions: PermissionRecord[];
  actions: PermissionActions;
  onEdit: (permission: PermissionRecord) => void;
  onDelete: (permission: PermissionRecord) => void;
}

export function PermissionsTable({
  permissions,
  actions,
  onEdit,
  onDelete,
}: PermissionsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Module</TableHead>
          <TableHead>Label</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {permissions.map((permission) => {
          const isSystem = permission.isSystem;
          const noActions = !actions.canEdit && !actions.canDelete;
          return (
            <TableRow key={permission.id}>
              <TableCell className="font-mono text-xs font-medium">
                {permission.key}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{permission.module}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{permission.label}</span>
                  {isSystem && <Badge variant="secondary">System</Badge>}
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {permission.description || "—"}
              </TableCell>
              <TableCell>
                {permission.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {noActions ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {actions.canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(permission)}
                        title={isSystem ? "System permissions: label and description only" : "Edit permission"}
                        aria-label={`Edit ${permission.key}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                    )}
                    {actions.canDelete && !isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(permission)}
                        title="Delete permission"
                        aria-label={`Delete ${permission.key}`}
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