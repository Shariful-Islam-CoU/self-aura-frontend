"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/providers/AuthProvider";
import {
  CategoryTable,
  CategoryTableSkeleton,
  CategoryDialog,
  CategoryDeleteDialog,
} from "@/features/categories/components";
import { categoryService } from "@/features/categories/services/categoryService";
import type {
  Category,
  CategoryThumbnail,
  CreateCategoryInput,
} from "@/features/categories/types";
import { Boxes, Plus, X } from "lucide-react";

type DialogMode = "create" | "edit";

export default function CategoriesPage() {
  const { canAccess } = useAuth();
  const canManage = canAccess("categories.create") || canAccess("categories.edit") || canAccess("categories.delete");

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
  }, []);

  const loadCategories = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);
    try {
      const data = await categoryService.listCategories();
      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load categories."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await categoryService.listCategories();
        if (!cancelled) setCategories(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load categories.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => {
    setSuccessMessage(null);
    setEditingCategory(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setSuccessMessage(null);
    setEditingCategory(category);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const openDelete = (category: Category) => {
    setSuccessMessage(null);
    setCategoryToDelete(category);
    setDeleteOpen(true);
  };

  /**
   * Resolves with the saved category so the dialog can continue to the
   * thumbnail step. On failure it returns the caller's previous value: the
   * dialog closes on nothing, and an id that was never stored must never be
   * used to address a media folder.
   */
  const handleSubmit = async (
    values: CreateCategoryInput & { isActive?: boolean }
  ): Promise<Category> => {
    setIsSubmitting(true);
    try {
      const saved =
        dialogMode === "edit" && editingCategory
          ? await categoryService.updateCategory(editingCategory.id, values)
          : await categoryService.createCategory(values);
      showSuccess(
        dialogMode === "edit"
          ? "Category updated successfully."
          : "Category created successfully."
      );
      await loadCategories({ silent: true });
      return saved;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Re-reads the categories after a thumbnail change rather than patching local
   * state: the backend response is the authority on what was stored, and a
   * local guess could leave the table showing a URL the server never accepted.
   */
  const handleThumbnailChange = useCallback(
    (categoryId: string, thumbnail: CategoryThumbnail | null) => {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === categoryId ? { ...category, thumbnail } : category
        )
      );
    },
    []
  );

  const handleBannerChange = useCallback(
    (categoryId: string, banner: any | null) => {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === categoryId ? { ...category, banner } : category
        )
      );
    },
    []
  );

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      showSuccess("Category deactivated successfully.");
      await loadCategories({ silent: true });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product categories.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Add category
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

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <CategoryTableSkeleton />
          ) : error ? (
            <ErrorState
              title="Unable to load categories."
              description={error}
              onRetry={() => void loadCategories()}
              retryLabel="Try again"
            />
          ) : categories.length === 0 ? (
            <EmptyState
              title="No categories found."
              description="Create your first category to organize your products."
              icon={<Boxes className="h-12 w-12" aria-hidden="true" />}
              action={
                canManage ? (
                  <Button onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                    Add category
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <CategoryTable
              categories={categories}
              canManage={canManage}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          )}
        </CardContent>
      </Card>

      <CategoryDialog
        open={dialogOpen}
        mode={dialogMode}
        category={editingCategory}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onOpenChange={setDialogOpen}
        onThumbnailChange={handleThumbnailChange}
        onBannerChange={handleBannerChange}
      />

      <CategoryDeleteDialog
        open={deleteOpen}
        category={categoryToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}