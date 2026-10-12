"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { CategoryForm } from "./CategoryForm";
import { CategoryThumbnailManager } from "./CategoryThumbnailManager";
import { CategoryBannerManager } from "./CategoryBannerManager";
import type {
  Category,
  CategoryThumbnail,
  CategoryBanner,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types";

interface CategoryDialogProps {
  open: boolean;
  mode: "create" | "edit";
  category?: Category | null;
  isSubmitting: boolean;
  onSubmit: (
    values: CreateCategoryInput & { isActive?: boolean }
  ) => Promise<Category>;
  onOpenChange: (open: boolean) => void;
  /** Fired after the thumbnail changes, so the table and storefront re-read it. */
  onThumbnailChange?: (categoryId: string, thumbnail: CategoryThumbnail | null) => void;
  onBannerChange?: (categoryId: string, banner: CategoryBanner | null) => void;
}

/**
 * Add/edit category dialog.
 *
 * Same two-step shape as the product dialog, for the same reason: an upload
 * needs a stable id to address the media folder, and a category only has one
 * once it is created.
 *
 *   1. "Details"   - name, description, active.
 *   2. "Thumbnail" - the single optional category image.
 *
 * Editing shows the thumbnail control inline, since the id already exists. The
 * thumbnail step is dismissible with "Skip" rather than forced: a thumbnail is
 * genuinely optional (the storefront has a branded fallback), and a mandatory
 * second dialog for an optional field trains staff to click through dialogs
 * without reading them.
 */
export function CategoryDialog({
  open,
  mode,
  category,
  isSubmitting,
  onSubmit,
  onOpenChange,
  onThumbnailChange,
  onBannerChange,
}: CategoryDialogProps) {
  const isEdit = mode === "edit";
  const [createdCategory, setCreatedCategory] = useState<Category | null>(null);

  // Mirrors the product dialog: the dialog is only ever closed through
  // `onOpenChange`, so clearing the wizard state here means a stale category id
  // can never be rendered in the thumbnail step.
  const handleOpenChange = (next: boolean) => {
    if (!next) setCreatedCategory(null);
    onOpenChange(next);
  };

  const handleSubmit = async (
    values: CreateCategoryInput & Partial<UpdateCategoryInput>
  ): Promise<Category> => {
    const saved = await onSubmit(values);
    if (isEdit) {
      handleOpenChange(false);
    } else {
      // Stay open so the new category can get a thumbnail.
      setCreatedCategory(saved);
    }
    return saved;
  };

  const thumbnailProduct = createdCategory ?? (isEdit ? (category ?? null) : null);
  const showThumbnailStep = !isEdit && createdCategory !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="md" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showThumbnailStep
              ? "Add category thumbnail"
              : isEdit
                ? "Edit category"
                : "Add category"}
          </DialogTitle>
          <DialogDescription>
            {showThumbnailStep
              ? `${createdCategory.name} was created. A thumbnail is optional - the storefront shows a branded placeholder without one.`
              : isEdit
                ? "Update the category details and thumbnail below."
                : "Create a new product category."}
          </DialogDescription>
        </DialogHeader>

        {showThumbnailStep && thumbnailProduct ? (
          <>
            <CategoryThumbnailManager
              categoryId={thumbnailProduct.id}
              categoryName={thumbnailProduct.name}
              thumbnail={thumbnailProduct.thumbnail ?? null}
              onChanged={(thumbnail) => onThumbnailChange?.(thumbnailProduct.id, thumbnail)}
            />
            <div className="border-t border-border pt-4">
              <CategoryBannerManager
                categoryId={thumbnailProduct.id}
                categoryName={thumbnailProduct.name}
                banner={(thumbnailProduct as any).banner ?? null}
                onChanged={(banner) => onBannerChange?.(thumbnailProduct.id, banner)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Skip for now
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <CategoryForm
            key={isEdit ? (category?.id ?? "edit") : "create"}
            initialValues={isEdit ? category : null}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => handleOpenChange(false)}
          >
            {isEdit && category && (
              <div className="border-t border-border pt-4 space-y-6">
                <CategoryThumbnailManager
                  categoryId={category.id}
                  categoryName={category.name}
                  thumbnail={category.thumbnail ?? null}
                  onChanged={(thumbnail) => onThumbnailChange?.(category.id, thumbnail)}
                />
                <CategoryBannerManager
                  categoryId={category.id}
                  categoryName={category.name}
                  banner={(category as any).banner ?? null}
                  onChanged={(banner) => onBannerChange?.(category.id, banner)}
                />
              </div>
            )}
          </CategoryForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
