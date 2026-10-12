"use client";

// Permission management (Owner-only; the backend enforces permissions.*).
//
// Permission keys are the single authorization source on the backend. Roles
// hold key sets, the Owner has implicit full access, and a user's effective
// permissions are resolved from the database on every request.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/providers/AuthProvider";
import { RequirePermission } from "@/components/layout";
import {
  PermissionsTable,
  PermissionFormDialog,
  PermissionDeleteDialog,
  permissionAdminService,
} from "@/features/permissions";
import type { PermissionRecord, CreatePermissionInput, UpdatePermissionInput } from "@/features/permissions";
import { KeyRound, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 20;

export default function PermissionsPage() {
  const { canAccess } = useAuth();

  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");

  const [moduleOptions, setModuleOptions] = useState<{ value: string; label: string }[]>([
    { value: "", label: "All modules" },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingPermission, setEditingPermission] = useState<PermissionRecord | null>(null);
  const [deletePermission, setDeletePermission] = useState<PermissionRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const can = useMemo(
    () => ({
      canCreate: canAccess("permissions.create"),
      canEdit: canAccess("permissions.edit"),
      canDelete: canAccess("permissions.delete"),
    }),
    [canAccess]
  );

  const loadPermissions = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setIsLoading(true);
      setError(null);
      try {
        const data = await permissionAdminService.listPermissions({
          page,
          limit: pageSize,
          search: search.trim() || undefined,
          module: moduleFilter || undefined,
        });
        setPermissions(data.items);
        setTotal(data.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load permissions.");
      } finally {
        setIsLoading(false);
      }
    },
    [page, pageSize, search, moduleFilter]
  );

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await permissionAdminService.listPermissions({
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
        });
        if (!cancelled) {
          setPermissions(data.items);
          setTotal(data.pagination.total);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load permissions.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Unique module list for the filter dropdown (derived from the full catalog).
  useEffect(() => {
    let cancelled = false;
    permissionAdminService
      .listPermissions({ limit: 100 })
      .then((data) => {
        if (cancelled) return;
        const modules = Array.from(new Set(data.items.map((item) => item.module))).sort();
        setModuleOptions([
          { value: "", label: "All modules" },
          ...modules.map((module) => ({ value: module, label: module })),
        ]);
      })
      .catch(() => {
        // Filter dropdown stays at "All modules" on failure.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (page !== 1) setPage(1);
      void loadPermissions({ silent: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, moduleFilter, pageSize, page, loadPermissions]);

  const refresh = useCallback(() => void loadPermissions({ silent: true }), [loadPermissions]);

  const handleCreateOpen = () => {
    setSuccessMessage(null);
    setEditingPermission(null);
    setFormMode("create");
    setFormDialogOpen(true);
  };

  const handleEditOpen = (permission: PermissionRecord) => {
    setSuccessMessage(null);
    setEditingPermission(permission);
    setFormMode("edit");
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (values: CreatePermissionInput | UpdatePermissionInput) => {
    setIsSubmitting(true);
    try {
      if (formMode === "edit" && editingPermission) {
        await permissionAdminService.updatePermission(editingPermission.id, values as UpdatePermissionInput);
        setSuccessMessage("Permission updated.");
      } else {
        await permissionAdminService.createPermission(values as CreatePermissionInput);
        setSuccessMessage("Permission created and grantable via roles.");
      }
      setFormDialogOpen(false);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save the permission.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (permission: PermissionRecord) => {
    setIsSubmitting(true);
    try {
      await permissionAdminService.deletePermission(permission.id);
      setSuccessMessage(`Permission ${permission.key} deleted.`);
      setDeletePermission(null);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete the permission.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <RequirePermission permission="permissions.view">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Permissions</h1>
            <p className="text-muted-foreground mt-1">
              The full catalog of permission keys used to authorize protected
              routes and UI actions.
            </p>
          </div>
          {can.canCreate && (
            <Button onClick={handleCreateOpen}>
              <KeyRound className="mr-1 h-4 w-4" aria-hidden="true" />
              Create permission
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-72">
            <Input
              label="Search"
              type="search"
              placeholder="Key, label or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search permissions"
            />
          </div>
          <div className="sm:w-52">
            <Select
              label="Module"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              options={moduleOptions}
              aria-label="Filter by module"
            />
          </div>
        </div>

        <Card>
          {isLoading ? (
            <LoadingState text="Loading permissions..." />
          ) : error ? (
            <ErrorState title="Unable to load permissions." description={error} onRetry={() => void loadPermissions()} retryLabel="Try again" />
          ) : permissions.length === 0 ? (
            <EmptyState
              title="No permissions found."
              description="No permissions match your filters."
              icon={<KeyRound className="h-12 w-12" aria-hidden="true" />}
              action={
                can.canCreate ? (
                  <Button onClick={handleCreateOpen}>Create permission</Button>
                ) : undefined
              }
            />
          ) : (
            <div className="p-4">
              <PermissionsTable
                permissions={permissions}
                actions={can}
                onEdit={handleEditOpen}
                onDelete={setDeletePermission}
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

        <PermissionFormDialog
          open={formDialogOpen}
          mode={formMode}
          permission={editingPermission}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
          onOpenChange={setFormDialogOpen}
        />

        <PermissionDeleteDialog
          open={deletePermission !== null}
          permission={deletePermission}
          isSubmitting={isSubmitting}
          onConfirm={handleDelete}
          onOpenChange={(open) => {
            if (!open) setDeletePermission(null);
          }}
        />
      </div>
    </RequirePermission>
  );
}