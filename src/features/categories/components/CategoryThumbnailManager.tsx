"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MediaUploadProgress, ProductImageFrame } from "@/components/media";
import { categoryService } from "../services/categoryService";
import type { CategoryThumbnail } from "../types";
import { AlertCircle, Check, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

/**
 * Client-side mirror of the server's image allow-list.
 *
 * A convenience filter only - the server sniffs the bytes, so a file that slips
 * past this check is still validated properly. The size ceiling is not
 * duplicated here because it is configurable server-side, and the server's
 * message is therefore always the correct one to show.
 */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(",");

export interface CategoryThumbnailManagerProps {
  categoryId: string;
  categoryName: string;
  /** Current thumbnail, or `null`. Passed in so the dialog and the form agree. */
  thumbnail: CategoryThumbnail | null;
  /** Fired after every successful server-side change, with the new thumbnail. */
  onChanged: (thumbnail: CategoryThumbnail | null) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Category thumbnail: one optional image, uploaded or replaced in place.
 *
 * A category has at most one thumbnail, so this is not a list and there is no
 * ordering. What it does have to get right:
 *
 *   - the current image is always visible, so "replace" is not a blind action
 *   - the alt text is editable, because a category card's image is announced by
 *     screen readers and an empty `alt` is a real accessibility defect
 *   - a legacy thumbnail is labelled as external, so nobody expects replacing it
 *     to delete a file this deployment does not own
 */
export function CategoryThumbnailManager({
  categoryId,
  categoryName,
  thumbnail,
  onChanged,
  disabled = false,
  className,
}: CategoryThumbnailManagerProps) {
  const headingId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ fileName: string; percent: number } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSavingAlt, setIsSavingAlt] = useState(false);
  const [altDraft, setAltDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const displayedAlt = altDraft ?? thumbnail?.alt ?? "";
  const isBusy = disabled || isUploading || isRemoving || isSavingAlt;

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);

    if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      setError("Only JPEG, PNG and WebP images can be uploaded.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setProgress({ fileName: file.name, percent: 0 });
    try {
      const updated = await categoryService.uploadCategoryThumbnail(
        categoryId,
        file,
        displayedAlt.trim() || undefined,
        (percent) =>
          setProgress((prev) => (prev && prev.fileName === file.name ? { ...prev, percent } : prev))
      );
      onChanged(updated.thumbnail ?? null);
      setAltDraft(null);
      setSuccess(
        thumbnail
          ? "Thumbnail replaced. The previous file was removed from the media library."
          : "Thumbnail uploaded to the media library."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload the thumbnail.");
    } finally {
      setIsUploading(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setError(null);
    setSuccess(null);
    setIsRemoving(true);
    try {
      const updated = await categoryService.deleteCategoryThumbnail(categoryId);
      onChanged(updated.thumbnail ?? null);
      setAltDraft(null);
      setSuccess("Thumbnail removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove the thumbnail.");
    } finally {
      setIsRemoving(false);
    }
  };

  /**
   * Saves the description of the existing thumbnail.
   *
   * A plain PATCH, not a re-upload: changing what a thumbnail is CALLED does not
   * move any bytes, and re-uploading to change a caption would delete and
   * re-store the asset for nothing.
   */
  const handleAltSave = async () => {
    if (altDraft === null) return;
    setError(null);
    setSuccess(null);
    setIsSavingAlt(true);
    try {
      const updated = await categoryService.updateCategoryThumbnailAlt(
        categoryId,
        altDraft.trim()
      );
      onChanged(updated.thumbnail ?? null);
      setAltDraft(null);
      setSuccess("Thumbnail description saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the description.");
    } finally {
      setIsSavingAlt(false);
    }
  };

  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3
          id={headingId}
          className="flex items-center gap-1.5 text-sm font-label text-foreground"
        >
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
          Category thumbnail
        </h3>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="sr-only"
            aria-label="Choose a category thumbnail to upload"
            disabled={isBusy}
            onChange={(event) => {
              void handleFile(event.target.files);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            isLoading={isUploading}
          >
            <Upload className="mr-1 h-4 w-4" aria-hidden="true" />
            {thumbnail ? "Replace" : "Upload"}
          </Button>
        </div>
      </div>

      {progress && (
        <MediaUploadProgress
          className="mb-2"
          current={1}
          total={1}
          fileName={progress.fileName}
          percent={progress.percent}
        />
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

      {success && !isUploading && !isRemoving && (
        <p
          role="status"
          className="mb-2 flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent"
        >
          <Check className="h-4 w-4 flex-none" aria-hidden="true" />
          {success}
        </p>
      )}

      {thumbnail ? (
        <div className="flex gap-3 rounded-md border border-border bg-background p-2">
          <div className="w-20 flex-none">
            <ProductImageFrame
              src={thumbnail.url}
              alt={displayedAlt || `${categoryName} category`}
              sizes="80px"
              aspectRatio="1 / 1"
              className="w-20"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              {thumbnail.managed ? (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-label uppercase tracking-[0.12em] text-accent">
                  Stored
                </span>
              ) : (
                <span
                  title="Uploaded before the media library existed. Replacing it will not delete the old file."
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-label uppercase tracking-[0.12em] text-muted-foreground"
                >
                  External
                </span>
              )}
            </div>

            <Input
              aria-label="Alt text for the category thumbnail"
              value={displayedAlt}
              onChange={(event) => setAltDraft(event.target.value)}
              placeholder="Describe the thumbnail for screen readers"
              maxLength={200}
              disabled={isBusy}
            />

            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAltSave}
                disabled={isBusy || altDraft === null || altDraft === (thumbnail.alt ?? "")}
                isLoading={isSavingAlt}
              >
                Save description
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={handleRemove}
                disabled={isBusy}
                isLoading={isRemoving}
              >
                {isRemoving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No thumbnail. Without one, the storefront falls back to a branded
          placeholder for this category.
        </p>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        JPEG, PNG or WebP. A category has at most one thumbnail; uploading a new
        one replaces it and removes the previous file from the media library.
      </p>
    </section>
  );
}
