"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { permissionAdminService } from "@/features/permissions/services/permissionAdminService";
import type { PermissionRecord } from "@/features/permissions/types";
import type { RoleRecord } from "../types";
import { ShieldCheck } from "lucide-react";

interface RolePermissionsDialogProps {
  open: boolean;
  role: RoleRecord | null;
  isSubmitting: boolean;
  onConfirm: (role: RoleRecord, permissions: string[]) => void;
  onOpenChange: (open: boolean) => void;
}

export function RolePermissionsDialog({
  open,
  role,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: RolePermissionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Permissions for {role?.name ?? ""}
            </span>
          </DialogTitle>
          <DialogDescription>
            Choose exactly which permission keys this role holds. Changes take
            effect immediately - the backend resolves permissions from the
            database on every request.
          </DialogDescription>
        </DialogHeader>

        {open && role && (
          <RolePermissionPicker
            key={`permissions-${role.id}`}
            role={role}
            isSubmitting={isSubmitting}
            onConfirm={onConfirm}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface RolePermissionPickerProps {
  role: RoleRecord;
  isSubmitting: boolean;
  onConfirm: (role: RoleRecord, permissions: string[]) => void;
  onCancel: () => void;
}

// Mounted via a `key` from RolePermissionsDialog so the selection and search
// always initialize from the current role (lint-safe alternative to
// setState-in-effect). The permission catalog fetch only calls setState inside
// async callbacks.
function RolePermissionPicker({ role, isSubmitting, onConfirm, onCancel }: RolePermissionPickerProps) {
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [selected, setSelected] = useState<string[]>(role.permissions);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    permissionAdminService
      .listAllPermissions()
      .then((items) => {
        if (!cancelled) setPermissions(items);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Unable to load permissions.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback((key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  }, []);

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? permissions.filter(
          (permission) =>
            permission.key.toLowerCase().includes(query) ||
            permission.label.toLowerCase().includes(query) ||
            permission.module.toLowerCase().includes(query)
        )
      : permissions;

    const groups = new Map<string, PermissionRecord[]>();
    for (const permission of filtered) {
      const moduleName = permission.module;
      if (!groups.has(moduleName)) groups.set(moduleName, []);
      groups.get(moduleName)!.push(permission);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions, search]);

  const checkedCount = selected.length;

  return (
    <>
      {isLoading ? (
        <div className="py-8">
          <LoadingState text="Loading permissions..." />
        </div>
      ) : loadError ? (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          {loadError}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <Input
              type="search"
              placeholder="Search permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search permissions"
              className="max-w-sm"
            />
            <Badge variant="outline">
              {checkedCount} selected
            </Badge>
          </div>

          <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border p-4">
            {grouped.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No permissions match your search.
              </p>
            ) : (
              <div className="space-y-5">
                {grouped.map(([moduleName, items]) => (
                  <div key={moduleName}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {moduleName}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {items.map((permission) => (
                        <Checkbox
                          key={permission.key}
                          id={`perm-${permission.key.replace(".", "-")}`}
                          label={permission.label}
                          checked={selected.includes(permission.key)}
                          onChange={() => toggle(permission.key)}
                          data-testid={`perm-${permission.key}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => onConfirm(role, selected)}
          isLoading={isSubmitting}
          disabled={isSubmitting || isLoading}
        >
          Save permission set
        </Button>
      </DialogFooter>
    </>
  );
}