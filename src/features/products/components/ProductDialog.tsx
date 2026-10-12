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
import { LoadingSpinner } from "@/components/ui/LoadingState";
import { ProductForm } from "./ProductForm";
import { ProductImageManager } from "./ProductImageManager";
import { ProductVideoManager } from "./ProductVideoManager";
import type { Category } from "@/features/categories/types";
import type {
  CreateProductInput,
  ManagedProductImage,
  ManagedProductVideo,
  Product,
} from "../types";

interface ProductDialogProps {
  open: boolean;
  mode: "create" | "edit";
  product?: Product | null;
  categories: Category[];
  categoriesLoading: boolean;
  isSubmitting: boolean;
  /** Resolves with the saved product so the dialog can continue to step 2. */
  onSubmit: (values: CreateProductInput) => Promise<Product>;
  onOpenChange: (open: boolean) => void;
  /** Fired after images change so the caller can refresh the list/table. */
  onImagesChange?: (images: ManagedProductImage[]) => void;
  /** Fired after videos change, so a caller caching media stays consistent. */
  onVideosChange?: (videos: ManagedProductVideo[]) => void;
}

/**
 * Add/edit product dialog.
 *
 * A new product cannot have media attached in the same request, because an
 * upload has to be validated and stored before it can be referenced - and the
 * product only gets an id after it is created. So create is a two-step flow:
 *
 *   1. "Details" - the product record itself.
 *   2. "Media"   - the image and video managers for the product just created.
 *
 * Editing an existing product shows both managers inline in step 1, since the id
 * is already known and no second step is needed.
 *
 * The two managers sit in one "MEDIA" region with a subheading each, rather than
 * being split across two steps of their own: a product's photos and its clips
 * are one decision ("how does this look?"), and forcing a staff member through
 * two dialogs to complete it invites the second being skipped and forgotten.
 */
export function ProductDialog({
  open,
  mode,
  product,
  categories,
  categoriesLoading,
  isSubmitting,
  onSubmit,
  onOpenChange,
  onImagesChange,
  onVideosChange,
}: ProductDialogProps) {
  const isEdit = mode === "edit";
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

  /**
   * The dialog is only ever closed through `onOpenChange` (the page never sets
   * it to `false` itself), so clearing the create-wizard state here - rather
   * than in an effect watching `open` - means a stale product id can never be
   * shown, and there is no extra render on open.
   */
  const handleOpenChange = (next: boolean) => {
    if (!next) setCreatedProduct(null);
    onOpenChange(next);
  };

  const handleSubmit = async (values: CreateProductInput): Promise<Product> => {
    const saved = await onSubmit(values);
    if (isEdit) {
      handleOpenChange(false);
    } else {
      // Stay open and move to the media step for the product we just created.
      setCreatedProduct(saved);
    }
    return saved;
  };

  const mediaProduct = createdProduct ?? (isEdit ? (product ?? null) : null);
  const showMediaStep = !isEdit && createdProduct !== null;

  const media = mediaProduct ? (
    <div className="space-y-6">
      <ProductImageManager
        productId={mediaProduct.id}
        productName={mediaProduct.name}
        onSaved={onImagesChange}
      />
      <div className="border-t border-border pt-5">
        <ProductVideoManager
          productId={mediaProduct.id}
          productName={mediaProduct.name}
          onSaved={onVideosChange}
        />
      </div>
    </div>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showMediaStep
              ? "Add product media"
              : isEdit
                ? "Edit product"
                : "Add product"}
          </DialogTitle>
          <DialogDescription>
            {showMediaStep
              ? `${createdProduct.name} was created. Add its photos and videos - you can also do this later from the product list.`
              : isEdit
                ? "Update the product details and media below."
                : "Add a new product to your catalog."}
          </DialogDescription>
        </DialogHeader>

        {categoriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner aria-label="Loading categories" />
          </div>
        ) : showMediaStep && mediaProduct ? (
          <>
            {media}
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <ProductForm
            key={isEdit ? (product?.id ?? "edit") : "create"}
            initialValues={isEdit ? product : null}
            categories={categories}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => handleOpenChange(false)}
          >
            {isEdit && product && <div className="border-t border-border pt-4">{media}</div>}
          </ProductForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
