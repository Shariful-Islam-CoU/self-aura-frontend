"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MediaUploadProgress, ProductImageFrame } from "@/components/media";
import { productService } from "../services/productService";
import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_INPUT_ACCEPT,
  MAX_IMAGE_UPLOAD_LABEL,
  formatDimensions,
  moveItem,
  moveToFront,
  normalizeOrder,
  resolveMediaUrl,
  sameImageList,
} from "../lib/media";
import type { ManagedProductImage } from "../types";
import { AlertCircle, ArrowDown, ArrowUp, Check, Star, Trash2, Upload } from "lucide-react";

/**
 * Formats the picker filters on, mirroring the server's allow-list, which is the
 * authority. This only avoids a pointless round trip and gives a clearer
 * message. The size ceiling is deliberately NOT duplicated here: it is
 * configurable server-side, so the server's message is the correct one to show.
 */
const ACCEPTED_TYPES = ACCEPTED_IMAGE_TYPES;

/** A product may hold at most this many images. */
const MAX_IMAGES = 10;

export interface ProductImageManagerProps {
  productId: string;
  productName: string;
  /** Fired after every successful server-side change, with the saved list. */
  onSaved?: (images: ManagedProductImage[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Product image manager: upload, reorder, promote, retitle and remove.
 *
 * Interaction model
 * -----------------
 * Uploads are applied immediately (each file is one request, so one bad file
 * cannot poison the batch), while reordering, alt-text edits and removals are
 * staged and committed with a single "Save changes" action. That commit is one
 * atomic `PUT .../images/order` that the server validates as a whole, which is
 * what guarantees a rejected entry can never leave a partially updated product.
 *
 * Ordering is the only definition of "primary": promoting an image moves it to
 * position 0. There is no second flag to fall out of sync.
 */
export function ProductImageManager({
  productId,
  productName,
  onSaved,
  disabled = false,
  className,
}: ProductImageManagerProps) {
  const headingId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ManagedProductImage[]>([]);
  const [savedImages, setSavedImages] = useState<ManagedProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    fileName: string;
    percent: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Load the product's images on mount, and again if the bound product changes.
  // Same shape as the other data-loading effects in this app: the request is
  // fired, state is only written after the await resolves, and a `cancelled`
  // guard drops a response that arrived after the product id moved on.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const result = await productService.listProductImages(productId);
        if (cancelled) return;
        const ordered = normalizeOrder(result.images ?? []);
        setImages(ordered);
        setSavedImages(ordered);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Unable to load product images."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const isDirty = !sameImageList(images, savedImages);
  const atLimit = images.length >= MAX_IMAGES;

  const applyServerResult = (result: { images: ManagedProductImage[] }) => {
    const ordered = normalizeOrder(result.images ?? []);
    setImages(ordered);
    setSavedImages(ordered);
    onSaved?.(ordered);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setSuccess(null);

    const rejected = Array.from(files).filter(
      (file) => !(ACCEPTED_TYPES as readonly string[]).includes(file.type)
    );
    const accepted = Array.from(files).filter((file) =>
      (ACCEPTED_TYPES as readonly string[]).includes(file.type)
    );

    if (accepted.length === 0) {
      setError("Only JPEG, PNG and WebP images can be uploaded.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // The ceiling is the SAVED count, not the staged count: a staged removal that
    // has not been committed must not let an upload over the limit through.
    const remaining = MAX_IMAGES - savedImages.length;
    const queue = accepted.slice(0, Math.max(0, remaining));

    if (rejected.length > 0 || queue.length < accepted.length) {
      setError(
        [
          rejected.length > 0
            ? `${rejected.length} file${rejected.length > 1 ? "s were" : " was"} skipped: only JPEG, PNG and WebP are supported.`
            : "",
          queue.length < accepted.length
            ? `A product may have at most ${MAX_IMAGES} images; ${accepted.length - queue.length} file(s) were not uploaded.`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      );
    }

    if (queue.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    let uploaded = 0;

    try {
      // Sequential on purpose: each upload is its own transaction, and one
      // rejected file must not abort the rest.
      for (let index = 0; index < queue.length; index += 1) {
        const file = queue[index];
        setProgress({ current: index + 1, total: queue.length, fileName: file.name, percent: 0 });
        try {
          const result = await productService.uploadProductImage(
            productId,
            file,
            defaultAlt(productName),
            (percent) =>
              setProgress((prev) =>
                prev && prev.fileName === file.name ? { ...prev, percent } : prev
              )
          );
          applyServerResult(result);
          uploaded += 1;
        } catch (err) {
          setError(
            err instanceof Error ? `${file.name}: ${err.message}` : `Could not upload ${file.name}.`
          );
        }
      }

      if (uploaded > 0) {
        setSuccess(
          `${uploaded} image${uploaded > 1 ? "s" : ""} uploaded and stored in the media library.`
        );
      }
    } finally {
      setIsUploading(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const result = await productService.updateProductImages(
        productId,
        images.map((image) => ({ key: image.key, alt: image.alt }))
      );
      applyServerResult(result);
      setSuccess("Image order and alt text saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save images.");
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => setImages(savedImages);

  const updateAlt = (index: number, alt: string) =>
    setImages((prev) =>
      prev.map((image, i) => (i === index ? { ...image, alt } : image))
    );

  const move = (from: number, to: number) =>
    setImages((prev) => moveItem(prev, from, to));

  const promote = (index: number) => setImages((prev) => moveToFront(prev, index));

  const remove = (index: number) =>
    setImages((prev) => prev.filter((_, i) => i !== index));

  const busy = disabled || isUploading || isSaving;

  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 id={headingId} className="text-sm font-label text-foreground">
            Images
          </h3>
          <span className="text-xs text-muted-foreground">
            {images.length}/{MAX_IMAGES}
            {isDirty && <span className="ml-1 text-warning-foreground">· unsaved</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_INPUT_ACCEPT}
            multiple
            className="sr-only"
            aria-label="Choose product images to upload"
            disabled={busy || atLimit}
            onChange={(event) => {
              void handleFiles(event.target.files);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy || atLimit}
            isLoading={isUploading}
          >
            <Upload className="mr-1 h-4 w-4" aria-hidden="true" />
            Upload image
          </Button>
        </div>
      </div>

      {progress && (
        <MediaUploadProgress
          className="mb-2"
          current={progress.current}
          total={progress.total}
          fileName={progress.fileName}
          percent={progress.percent}
        />
      )}

      {loadError && (
        <p
          role="alert"
          className="mb-2 flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 flex-none" aria-hidden="true" />
          {loadError}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mb-2 flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {success && !isSaving && (
        <p
          role="status"
          className="mb-2 flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent"
        >
          <Check className="h-4 w-4 flex-none" aria-hidden="true" />
          {success}
        </p>
      )}

      {isLoading ? (
        <div
          className="space-y-2"
          aria-busy="true"
          data-testid="product-images-loading"
        >
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-md border border-border bg-muted"
            />
          ))}
        </div>
      ) : loadError ? (
        // The alert above already explains the failure. Rendering "No images
        // yet" here would assert a falsehood - the product may well have images,
        // we simply could not read them.
        null
      ) : images.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No images yet. Upload a photo so this product appears with imagery in
          the storefront.
        </p>
      ) : (
        <ul className="space-y-2">
          {images.map((image, index) => {
            const isPrimary = index === 0;
            const facts = [
              image.mimeType,
              formatDimensions(image.width, image.height),
            ].filter(Boolean);
            return (
              <li
                key={image.key}
                className="flex gap-3 rounded-md border border-border bg-background p-2"
              >
                <div className="w-20 flex-none">
                  <ProductImageFrame
                    src={resolveMediaUrl(image.url)}
                    alt={image.alt || `${productName} image ${index + 1}`}
                    sizes="80px"
                    aspectRatio="1 / 1"
                    className="w-20"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    {isPrimary ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-label uppercase tracking-[0.12em] text-accent">
                        <Star className="h-3 w-3" aria-hidden="true" />
                        Primary
                      </span>
                    ) : (
                      <span className="text-[11px] font-label uppercase tracking-[0.12em] text-muted-foreground">
                        Image {index + 1}
                      </span>
                    )}
                    {facts.length > 0 && (
                      <span className="truncate text-[11px] text-muted-foreground">
                        {facts.join(" · ")}
                      </span>
                    )}
                  </div>

                  <Input
                    aria-label={`Alt text for image ${index + 1}`}
                    value={image.alt}
                    onChange={(event) => updateAlt(index, event.target.value)}
                    placeholder="Describe the image for screen readers"
                    maxLength={200}
                    disabled={busy}
                  />
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => move(index, index - 1)}
                      disabled={busy || index === 0}
                    >
                      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">
                        Move image {index + 1} up
                      </span>
                      <span aria-hidden="true">Up</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => move(index, index + 1)}
                      disabled={busy || index === images.length - 1}
                    >
                      <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">
                        Move image {index + 1} down
                      </span>
                      <span aria-hidden="true">Down</span>
                    </Button>
                    {!isPrimary && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => promote(index)}
                        disabled={busy}
                      >
                        <Star className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only">Make image {index + 1} </span>
                        <span aria-hidden="true">Make primary</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                      disabled={busy}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {/* Position in the accessible name, so the row is
                          identifiable when several are listed on screen. */}
                      <span className="sr-only">
                        Remove image {index + 1}
                        {image.alt ? `, ${image.alt}` : ""}
                      </span>
                      <span aria-hidden="true">Remove</span>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={discardChanges}
          disabled={!isDirty || isSaving}
        >
          Discard changes
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isSaving || isUploading}
          isLoading={isSaving}
        >
          Save images
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        JPEG, PNG or WebP, up to {MAX_IMAGE_UPLOAD_LABEL} each. The first image is
        the primary image used in the product list and the storefront card.
        Reorder, alt-text edits and removals are saved together so the whole list
        is validated before anything changes.
      </p>
    </section>
  );
}

/** Alt text a staff member would otherwise have to type for every file. */
function defaultAlt(productName: string): string {
  return `${productName} product image`;
}

/** Re-exported for the form, which renders an optimistic preview strip. */
export { defaultAlt as defaultProductImageAlt };
