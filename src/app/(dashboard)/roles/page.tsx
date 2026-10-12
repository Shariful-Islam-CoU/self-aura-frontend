"use client";

// Role management (Owner-only; the backend enforces roles.* permissions).
//
// Roles are the DB-driven permission carriers: every role holds a set of
// permission keys, and the backend resolves a user's effective permissions
// from its role document on EVERY request (immediate effect, no restart).
// The Owner role is implicit full access and is never listed here.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/providers/AuthProvider";
import { RequirePermission } from "@/components/layout";
import {
  RolesTable,
  RoleFormDialog,
  RolePermissionsDialog,
  RoleDeleteDialog,
  roleAdminService,
} from "@/features/roles";
import type { RoleRecord, CreateRoleInput, UpdateRoleInput } from "@/features/roles";
import { Shield, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function RolesPage() {
  const { canAccess } = useAuth();

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [permissionsRole, setPermissionsRole] = useState<RoleRecord | null>(null);
  const [deleteRole, setDeleteRole] = useState<RoleRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const can = useMemo(
    () => ({
      canCreate: canAccess("roles.create"),
      canEdit: canAccess("roles.edit"),
      canManagePermissions: canAccess("roles.managePermissions"),
      canDelete: canAccess("roles.delete"),
    }),
    [canAccess]
  );

  const loadRoles = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setIsLoading(true);
      setError(null);
      try {
        const data = await roleAdminService.listRoles({
          page,
          limit: pageSize,
          search: search.trim() || undefined,
        });
        setRoles(data.items);
        setTotal(data.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load roles.");
      } finally {
        setIsLoading(false);
      }
    },
    [page, pageSize, search]
  );

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await roleAdminService.listRoles({ page: 1, limit: DEFAULT_PAGE_SIZE });
        if (!cancelled) {
          setRoles(data.items);
          setTotal(data.pagination.total);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load roles.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (page !== 1) setPage(1);
      void loadRoles({ silent: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, pageSize, page, loadRoles]);

  const refresh = useCallback(() => void loadRoles({ silent: true }), [loadRoles]);

  const handleCreateOpen = () => {
    setSuccessMessage(null);
    setEditingRole(null);
    setFormMode("create");
    setFormDialogOpen(true);
  };

  const handleEditOpen = (role: RoleRecord) => {
    setSuccessMessage(null);
    setEditingRole(role);
    setFormMode("edit");
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (values: CreateRoleInput | UpdateRoleInput) => {
    setIsSubmitting(true);
    try {
      if (formMode === "edit" && editingRole) {
        await roleAdminService.updateRole(editingRole.id, values as UpdateRoleInput);
        setSuccessMessage("Role updated.");
      } else {
        await roleAdminService.createRole(values as CreateRoleInput);
        setSuccessMessage("Role created.");
      }
      setFormDialogOpen(false);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save the role.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionSave = async (role: RoleRecord, permissions: string[]) => {
    setIsSubmitting(true);
    try {
      await roleAdminService.updateRolePermissions(role.id, permissions);
      setSuccessMessage(`Permissions saved for ${role.name}. They are effective immediately.`);
      setPermissionsRole(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save permissions.");
      setPermissionsRole(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (role: RoleRecord) => {
    setIsSubmitting(true);
    try {
      await roleAdminService.deleteRole(role.id);
      setSuccessMessage(`Role ${role.name} deleted.`);
      setDeleteRole(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete the role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <RequirePermission permission="roles.view">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
            <p className="text-muted-foreground mt-1">
              Roles hold the permission keys that gate every protected action.
              Changes take effect immediately.
            </p>
          </div>
          {can.canCreate && (
            <Button onClick={handleCreateOpen}>
              <Shield className="mr-1 h-4 w-4" aria-hidden="true" />
              Create role
            </Button>
          )}
        </div>

        {successMessage && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success-foreground"
          >
            <span>{successMessage}</span>
            <Button variant="ghost" size="icon" onClick={() => setSuccessMessage(null)} aria-label="Dismiss">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        <div className="sm:w-72">
          <Input
            label="Search roles"
            type="search"
            placeholder="Search by role name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search roles"
          />
        </div>

        <Card>
          {isLoading ? (
            <LoadingState text="Loading roles..." />
          ) : error ? (
            <ErrorState title="Unable to load roles." description={error} onRetry={() => void loadRoles()} retryLabel="Try again" />
          ) : roles.length === 0 ? (
            <EmptyState
              title="No roles found."
              description="Create your first role to start assigning permission sets."
              icon={<Shield className="h-12 w-12" aria-hidden="true" />}
              action={
                can.canCreate ? (
                  <Button onClick={handleCreateOpen}>Create role</Button>
                ) : undefined
              }
            />
          ) : (
            <div className="p-4">
              <RolesTable
                roles={roles}
                actions={can}
                onEdit={handleEditOpen}
                onManagePermissions={setPermissionsRole}
                onDelete={setDeleteRole}
              />
              <div className="mt-4">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={total}
                  pageSize={pageSize}
                  pageSizeOptions={[10, 20, 50]}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </Card>

        <RoleFormDialog
          open={formDialogOpen}
          mode={formMode}
          role={editingRole}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
          onOpenChange={setFormDialogOpen}
        />

        <RolePermissionsDialog
          open={permissionsRole !== null}
          role={permissionsRole}
          isSubmitting={isSubmitting}
          onConfirm={handlePermissionSave}
          onOpenChange={(open) => {
            if (!open) setPermissionsRole(null);
          }}
        />

        <RoleDeleteDialog
          open={deleteRole !== null}
          role={deleteRole}
          isSubmitting={isSubmitting}
          onConfirm={handleDelete}
          onOpenChange={(open) => {
            if (!open) setDeleteRole(null);
          }}
        />
      </div>
    </RequirePermission>
  );
}