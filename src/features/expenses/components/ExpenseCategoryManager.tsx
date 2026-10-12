"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/LoadingState";
import { ApiError } from "@/lib/api";
import { expenseCategoryService } from "../services/expenseCategoryService";
import { Plus, Pencil, Ban, X, Check } from "lucide-react";
import type { ExpenseCategory } from "../types";

interface ExpenseCategoryManagerProps {
  open: boolean;
  categories: ExpenseCategory[];
  isLoading: boolean;
  error: string | null;
  canManage: boolean;
  onRetry: () => void;
  /** Reloads the category lists after any mutation succeeds. */
  onChanged: () => void;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseCategoryManager({
  open,
  categories,
  isLoading,
  error,
  canManage,
  onRetry,
  onChanged,
  onOpenChange,
}: ExpenseCategoryManagerProps) {
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reset transient state whenever the dialog is (re)opened (render-phase
  // state adjustment - the lint-safe alternative to setState-in-effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setAddFormOpen(false);
      setAddName("");
      setAddDescription("");
      setEditingId(null);
      setDeactivateConfirmId(null);
      setActionError(null);
    }
  }

  const extractFieldError = (err: unknown, field: string): string | undefined => {
    if (err instanceof ApiError && err.errors) {
      return err.errors[field]?.[0];
    }
    return undefined;
  };

  const handleAdd = async () => {
    const nameError = !addName.trim()
      ? "Name is required"
      : addName.trim().length > 100
        ? "Name must be at most 100 characters"
        : undefined;
    const descriptionError =
      addDescription.trim().length > 1000
        ? "Description must be at most 1000 characters"
        : undefined;
    if (nameError || descriptionError) {
      setActionError(nameError ?? descriptionError ?? null);
      return;
    }

    setBusy(true);
    setActionError(null);
    try {
      await expenseCategoryService.createCategory({
        name: addName.trim(),
        description: addDescription.trim() || undefined,
      });
      setAddName("");
      setAddDescription("");
      setAddFormOpen(false);
      onChanged();
    } catch (err) {
      setActionError(
        extractFieldError(err, "name") ??
          extractFieldError(err, "description") ??
          (err instanceof Error ? err.message : "Unable to create category.")
      );
    } finally {
      setBusy(false);
    }
  };

  const handleStartEdit = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description ?? "");
    setDeactivateConfirmId(null);
    setActionError(null);
  };

  const handleSaveEdit = async (category: ExpenseCategory) => {
    const nameError = !editName.trim()
      ? "Name is required"
      : editName.trim().length > 100
        ? "Name must be at most 100 characters"
        : undefined;
    const descriptionError =
      editDescription.trim().length > 1000
        ? "Description must be at most 1000 characters"
        : undefined;
    if (nameError || descriptionError) {
      setActionError(nameError ?? descriptionError ?? null);
      return;
    }

    setBusy(true);
    setActionError(null);
    try {
      await expenseCategoryService.updateCategory(category.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setActionError(
        extractFieldError(err, "name") ??
          extractFieldError(err, "description") ??
          (err instanceof Error ? err.message : "Unable to update category.")
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivateClick = (category: ExpenseCategory) => {
    if (deactivateConfirmId === category.id) {
      setDeactivateConfirmId(null);
      void runDeactivate(category);
    } else {
      setDeactivateConfirmId(category.id);
      setActionError(null);
    }
  };

  const runDeactivate = async (category: ExpenseCategory) => {
    setBusy(true);
    setActionError(null);
    try {
      await expenseCategoryService.deactivateCategory(category.id);
      onChanged();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to deactivate category."
      );
      setDeactivateConfirmId(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Expense categories</DialogTitle>
          <DialogDescription>
            Organise expenses by category. Deactivated categories stay on
            history but can&apos;t be used for new expenses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {canManage && (
            <div className="rounded-md border border-border p-3">
              {addFormOpen ? (
                <div className="space-y-3">
                  <Input
                    id="expense-category-new-name"
                    label="Name"
                    required
                    value={addName}
                    onChange={(event) => setAddName(event.target.value)}
                    placeholder="Category name"
                  />
                  <Textarea
                    id="expense-category-new-description"
                    label="Description"
                    value={addDescription}
                    onChange={(event) => setAddDescription(event.target.value)}
                    rows={2}
                    placeholder="Optional description"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAddFormOpen(false);
                        setAddName("");
                        setAddDescription("");
                      }}
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      isLoading={busy}
                      onClick={() => void handleAdd()}
                    >
                      <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                      Add category
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddFormOpen(true)}
                >
                  <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                  Add category
                </Button>
              )}
            </div>
          )}

          {actionError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {actionError}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
              <p className="text-muted-foreground">{error}</p>
              <button
                type="button"
                className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                onClick={onRetry}
              >
                Retry
              </button>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {categories.map((category) => (
                <li key={category.id} className="px-3 py-2.5">
                  {editingId === category.id ? (
                    <div className="space-y-3">
                      <Input
                        id={`expense-category-edit-name-${category.id}`}
                        label="Name"
                        required
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        placeholder="Category name"
                      />
                      <Textarea
                        id={`expense-category-edit-description-${category.id}`}
                        label="Description"
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        rows={2}
                        placeholder="Optional description"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          disabled={busy}
                        >
                          <X className="mr-1 h-4 w-4" aria-hidden="true" />
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          isLoading={busy}
                          onClick={() => void handleSaveEdit(category)}
                        >
                          <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{category.name}</span>
                          {category.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex flex-none items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit category ${category.name}`}
                            onClick={() => handleStartEdit(category)}
                            disabled={busy}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          {category.isActive && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={
                                deactivateConfirmId === category.id
                                  ? `Confirm deactivating category ${category.name}`
                                  : `Deactivate category ${category.name}`
                              }
                              onClick={() => handleDeactivateClick(category)}
                              disabled={busy}
                              className={
                                deactivateConfirmId === category.id
                                  ? "text-destructive hover:text-destructive"
                                  : "text-muted-foreground hover:text-destructive"
                              }
                            >
                              <Ban className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}