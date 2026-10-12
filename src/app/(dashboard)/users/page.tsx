"use client";

// User management (Owner-only; the backend enforces users.* permissions).
//
// The register->approve lifecycle is managed here: pending registrations are
// approved or rejected, and existing accounts can be disabled/enabled, have
// their role changed, or get a password reset. Every action button is gated
// by the corresponding user.<action> permission (UX-only).

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
  UsersTable,
  UserFormDialog,
  UserStatusDialog,
  ChangeRoleDialog,
  ResetPasswordDialog,
  userAdminService,
} from "@/features/users";
import type {
  UserRecord,
  UserStatus,
  CreateUserInput,
  UpdateUserInput,
} from "@/features/users";
import { roleAdminService } from "@/features/roles/services/roleAdminService";
import { USER_STATUS_OPTIONS } from "@/features/users/types";
import { Plus, UserCog, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;
type StatusAction = "approve" | "reject" | "disable" | "enable";

export default function UsersPage() {
  const { user: currentUser, canAccess } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusDialog, setStatusDialog] = useState<{ action: StatusAction; user: UserRecord } | null>(null);
  const [changeRoleTarget, setChangeRoleTarget] = useState<UserRecord | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<UserRecord | null>(null);

  const can = useMemo(
    () => ({
      canCreate: canAccess("users.create"),
      canEdit: canAccess("users.edit"),
      canApprove: canAccess("users.approve"),
      canReject: canAccess("users.reject"),
      canDisable: canAccess("users.disable"),
      canEnable: canAccess("users.enable"),
      canChangeRole: canAccess("users.changeRole"),
      canResetPassword: canAccess("users.changePassword"),
    }),
    [canAccess]
  );

  const loadUsers = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setIsLoading(true);
      setError(null);
      try {
        const data = await userAdminService.listUsers({
          page,
          limit: pageSize,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
        });
        setUsers(data.items);
        setTotal(data.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load users.");
      } finally {
        setIsLoading(false);
      }
    },
    [page, pageSize, search, statusFilter]
  );

  // Load once on mount (filters reload through loadUsers).
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await userAdminService.listUsers({
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
        });
        if (!cancelled) {
          setUsers(data.items);
          setTotal(data.pagination.total);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load users.");
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
    let cancelled = false;
    roleAdminService
      .listAllRoles()
      .then((roles) => {
        if (cancelled) return;
        setRoleOptions(roles.map((role) => ({ value: role.name, label: role.name })));
      })
      .catch(() => {
        // Role pickers stay empty; the backend still validates the role name.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced filter reload.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (page !== 1) setPage(1);
      void loadUsers({ silent: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, statusFilter, pageSize, page, loadUsers]);

  const refresh = useCallback(() => void loadUsers({ silent: true }), [loadUsers]);

  const handleCreateOpen = () => {
    setSuccessMessage(null);
    setEditingUser(null);
    setFormMode("create");
    setFormDialogOpen(true);
  };

  const handleEditOpen = (user: UserRecord) => {
    setSuccessMessage(null);
    setEditingUser(user);
    setFormMode("edit");
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (values: CreateUserInput | UpdateUserInput) => {
    setIsSubmitting(true);
    try {
      if (formMode === "edit" && editingUser) {
        await userAdminService.updateUser(editingUser.id, values as UpdateUserInput);
        setSuccessMessage("User details updated.");
      } else {
        await userAdminService.createUser(values as CreateUserInput);
        setSuccessMessage("User created and activated.");
      }
      setFormDialogOpen(false);
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const runStatusAction = async (target: UserRecord) => {
    if (!statusDialog) return;
    setIsSubmitting(true);
    try {
      switch (statusDialog.action) {
        case "approve":
          await userAdminService.approveUser(target.id);
          setSuccessMessage(`@${target.username} approved.`);
          break;
        case "reject":
          await userAdminService.rejectUser(target.id);
          setSuccessMessage(`@${target.username} rejected.`);
          break;
        case "disable":
          await userAdminService.disableUser(target.id);
          setSuccessMessage(`@${target.username} disabled.`);
          break;
        case "enable":
          await userAdminService.enableUser(target.id);
          setSuccessMessage(`@${target.username} enabled.`);
          break;
      }
      setStatusDialog(null);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed.";
      setError(message);
      setStatusDialog(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeRole = async (target: UserRecord, role: string) => {
    setIsSubmitting(true);
    try {
      await userAdminService.changeRole(target.id, role);
      setSuccessMessage(`@${target.username} role changed to ${role}.`);
      setChangeRoleTarget(null);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to change role.";
      setError(message);
      setChangeRoleTarget(null);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (target: UserRecord, newPassword: string) => {
    setIsSubmitting(true);
    try {
      await userAdminService.resetPassword(target.id, newPassword);
      setSuccessMessage(`Password reset for @${target.username}.`);
      setResetPasswordTarget(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reset password.";
      setError(message);
      setResetPasswordTarget(null);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <RequirePermission permission="users.view">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground mt-1">
              Approve registrations and manage accounts, roles and passwords.
            </p>
          </div>
          {can.canCreate && (
            <Button onClick={handleCreateOpen}>
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
              Add user
            </Button>
          )}
        </div>

        {successMessage && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success-foreground"
          >
            <span>{successMessage}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-64">
            <Input
              label="Search"
              type="search"
              placeholder="Username, name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users"
            />
          </div>
          <div className="sm:w-52">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | "")}
              options={USER_STATUS_OPTIONS}
              aria-label="Filter by status"
            />
          </div>
        </div>

        <Card>
          {isLoading ? (
            <LoadingState text="Loading users..." />
          ) : error ? (
            <ErrorState title="Unable to load users." description={error} onRetry={() => void loadUsers()} retryLabel="Try again" />
          ) : users.length === 0 ? (
            <EmptyState
              title="No users found."
              description="No registrations or accounts match your filters."
              icon={<UserCog className="h-12 w-12" aria-hidden="true" />}
              action={
                can.canCreate ? (
                  <Button onClick={handleCreateOpen}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                    Add user
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="p-4">
              <UsersTable
                users={users}
                currentUserId={currentUser?.id ?? ""}
                actions={{
                  canEdit: can.canEdit,
                  canApprove: can.canApprove,
                  canReject: can.canReject,
                  canDisable: can.canDisable,
                  canEnable: can.canEnable,
                  canChangeRole: can.canChangeRole,
                  canResetPassword: can.canResetPassword,
                }}
                onEdit={handleEditOpen}
                onApprove={(user) => {
                  setSuccessMessage(null);
                  setStatusDialog({ action: "approve", user });
                }}
                onReject={(user) => {
                  setSuccessMessage(null);
                  setStatusDialog({ action: "reject", user });
                }}
                onDisable={(user) => {
                  setSuccessMessage(null);
                  setStatusDialog({ action: "disable", user });
                }}
                onEnable={(user) => {
                  setSuccessMessage(null);
                  setStatusDialog({ action: "enable", user });
                }}
                onChangeRole={setChangeRoleTarget}
                onResetPassword={setResetPasswordTarget}
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

        <UserFormDialog
          open={formDialogOpen}
          mode={formMode}
          user={editingUser}
          roleOptions={roleOptions}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
          onOpenChange={setFormDialogOpen}
        />

        <UserStatusDialog
          open={statusDialog !== null}
          action={statusDialog?.action ?? null}
          user={statusDialog?.user ?? null}
          isSubmitting={isSubmitting}
          onConfirm={runStatusAction}
          onOpenChange={(open) => {
            if (!open) setStatusDialog(null);
          }}
        />

        <ChangeRoleDialog
          open={changeRoleTarget !== null}
          user={changeRoleTarget}
          roleOptions={roleOptions}
          isSubmitting={isSubmitting}
          currentUserId={currentUser?.id ?? ""}
          onConfirm={handleChangeRole}
          onOpenChange={(open) => {
            if (!open) setChangeRoleTarget(null);
          }}
        />

        <ResetPasswordDialog
          open={resetPasswordTarget !== null}
          user={resetPasswordTarget}
          isSubmitting={isSubmitting}
          onConfirm={handleResetPassword}
          onOpenChange={(open) => {
            if (!open) setResetPasswordTarget(null);
          }}
        />
      </div>
    </RequirePermission>
  );
}