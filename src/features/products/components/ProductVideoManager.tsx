"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MediaUploadProgress, ProductImageFrame } from "@/components/media";
import { productService } from "../services/productService";
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_VIDEO_UPLOAD_LABEL,
  formatDuration,
  moveItem,
  normalizeOrder,
  resolveMediaUrl,
  sameMediaList,
  VIDEO_INPUT_ACCEPT,
} from "../lib/media";
import type { ManagedProductVideo } from "../types";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Film,
  Loader2,
  Play,
  Trash2,
  Upload,
} from "lucide-react";

/**
 * Formats the picker filters on, mirroring the server's allow-list.
 *
 * This is a convenience filter only: the server sniffs the container bytes, so a
 * file that slips past here is still validated properly. The size ceiling is
 * NOT duplicated - it is configurable server-side, so the server's message is
 * the one that is always correct.
 */
const ACCEPTED_TYPES = ACCEPTED_VIDEO_TYPES;

/** A product may hold at most this many videos. */
const MAX_VIDEOS = 5;

export interface ProductVideoManagerProps {
  productId: string;
  productName: string;
  /** Fired after every successful server-side change, with the saved list. */
  onSaved?: (videos: ManagedProductVideo[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Product video manager: upload, reorder, retitle and remove.
 *
 * Interaction model mirrors the image manager on purpose - staff learn one
 * control set and use it for both media kinds - with two deliberate differences:
 *
 *   - there is no "make primary": a video never becomes the product card image,
 *     so offering a promote action would imply a behaviour that does not exist
 *   - a video previews through its Cloudinary poster frame, never autoplaying.
 *     Autoplaying video with sound in a form dialog is hostile, and a 100 MB
 *     file has no business starting to download the moment the dialog opens.
 */
export function ProductVideoManager({
  productId,
  productName,
  onSaved,
  disabled = false,
  className,
}: ProductVideoManagerProps) {
  const headingId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videos, setVideos] = useState<ManagedProductVideo[]>([]);
  const [savedVideos, setSavedVideos] = useState<ManagedProductVideo[]>([]);
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

  // Load on mount and whenever the bound product changes. State is written only
  // after the await resolves, and a `cancelled` guard drops a response that
  // arrived after the product id moved on.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const result = await productService.listProductVideos(productId);
        if (cancelled) return;
        const ordered = normalizeOrder(result.videos ?? []);
        setVideos(ordered);
        setSavedVideos(ordered);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Unable to load product videos.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const isDirty = !sameMediaList(videos, savedVideos);
  const atLimit = videos.length >= MAX_VIDEOS;

  const applyServerResult = (result: { videos: ManagedProductVideo[] }) => {
    const ordered = normalizeOrder(result.videos ?? []);
    setVideos(ordered);
    setSavedVideos(ordered);
    onSaved?.(ordered);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setSuccess(null);

    const all = Array.from(files);
    const rejected = all.filter(
      (file) => !(ACCEPTED_TYPES as readonly string[]).includes(file.type)
    );
    const accepted = all.filter((file) =>
      (ACCEPTED_TYPES as readonly string[]).includes(file.type)
    );

    if (accepted.length === 0) {
      setError("Only MP4, MOV and WebM videos can be uploaded.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // The ceiling is the SAVED count, not the staged count: a staged removal that
    // has not been committed must not let an upload over the limit through.
    const remaining = MAX_VIDEOS - savedVideos.length;
    const queue = accepted.slice(0, Math.max(0, remaining));

    if (rejected.length > 0 || queue.length < accepted.length) {
      setError(
        [
          rejected.length > 0
            ? `${rejected.length} file${rejected.length > 1 ? "s were" : " was"} skipped: only MP4, MOV and WebM are supported.`
            : "",
          queue.length < accepted.length
            ? `A product may have at most ${MAX_VIDEOS} videos; ${accepted.length - queue.length} file(s) were not uploaded.`
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
      // Sequential on purpose: each upload is its own transaction, so one
      // rejected file must not abort the rest, and a 100 MB video does not have
      // to compete with another for the same connection.
      for (let index = 0; index < queue.length; index += 1) {
        const file = queue[index];
        setProgress({ current: index + 1, total: queue.length, fileName: file.name, percent: 0 });
        try {
          const result = await productService.uploadProductVideo(
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
          `${uploaded} video${uploaded > 1 ? "s" : ""} uploaded and stored in the media library.`
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
      const result = await productService.updateProductVideos(
        productId,
        videos.map((video) => ({ key: video.key, alt: video.alt }))
      );
      applyServerResult(result);
      setSuccess("Video order and descriptions saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save videos.");
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => setVideos(savedVideos);

  const updateAlt = (index: number, alt: string) =>
    setVideos((prev) => prev.map((video, i) => (i === index ? { ...video, alt } : video)));

  const move = (from: number, to: number) => setVideos((prev) => moveItem(prev, from, to));

  const remove = (index: number) => setVideos((prev) => prev.filter((_, i) => i !== index));

  const busy = disabled || isUploading || isSaving;

  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 id={headingId} className="flex items-center gap-1.5 text-sm font-label text-foreground">
            <Film className="h-4 w-4" aria-hidden="true" />
            Videos
          </h3>
          <span className="text-xs text-muted-foreground">
            {videos.length}/{MAX_VIDEOS}
            {isDirty && <span className="ml-1 text-warning-foreground">· unsaved</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={VIDEO_INPUT_ACCEPT}
            multiple
            className="sr-only"
            aria-label="Choose product videos to upload"
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
            Upload video
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

      {success && !isUploading && (
        <p
          role="status"
          className="mb-2 flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 flex-none animate-spin" aria-hidden="true" />
          ) : null}
          {success}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2" aria-busy="true" data-testid="product-videos-loading">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-md border border-border bg-muted"
            />
          ))}
        </div>
      ) : loadError ? (
        // The alert above already explains the failure. "No videos yet" here
        // would assert a falsehood: the product may well have videos, we simply
        // could not read them.
        null
      ) : videos.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No videos yet. Upload a short clip to show the fabric, the drape or how
          a piece is worn.
        </p>
      ) : (
        <ul className="space-y-2">
          {videos.map((video, index) => {
            const facts = [
              video.mimeType,
              formatDuration(video.duration),
            ].filter(Boolean);
            return (
              <li
                key={video.key}
                className="flex gap-3 rounded-md border border-border bg-background p-2"
              >
                <div className="relative w-20 flex-none">
                  <ProductImageFrame
                    src={resolveMediaUrl(video.thumbnailUrl ?? null)}
                    alt=""
                    sizes="80px"
                    aspectRatio="1 / 1"
                    className="w-20"
                    fallbackLabel="No preview"
                  />
                  {/* Decorative affordance: the row is already labelled "Video n"
                      and the poster carries no information of its own. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <Play className="h-5 w-5 fill-foreground/80 text-foreground drop-shadow" />
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-label uppercase tracking-[0.12em] text-muted-foreground">
                      Video {index + 1}
                    </span>
                    {facts.length > 0 && (
                      <span className="truncate text-[11px] text-muted-foreground">
                        {facts.join(" · ")}
                      </span>
                    )}
                    {!video.managed && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-label uppercase tracking-[0.12em] text-muted-foreground">
                        External
                      </span>
                    )}
                  </div>

                  <Input
                    aria-label={`Description for video ${index + 1}`}
                    value={video.alt}
                    onChange={(event) => updateAlt(index, event.target.value)}
                    placeholder="Describe the video for screen readers"
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
                      <span className="sr-only">Move video {index + 1} up</span>
                      <span aria-hidden="true">Up</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => move(index, index + 1)}
                      disabled={busy || index === videos.length - 1}
                    >
                      <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">Move video {index + 1} down</span>
                      <span aria-hidden="true">Down</span>
                    </Button>
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
                        Remove video {index + 1}
                        {video.alt ? `, ${video.alt}` : ""}
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
          Save videos
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        MP4, MOV or WebM, up to {MAX_VIDEO_UPLOAD_LABEL} each. Videos play on the
        product page after the shopper chooses to play them, and are never
        autoplayed. Order, description edits and removals are saved together so
        the whole list is validated before anything changes.
      </p>
    </section>
  );
}

/** Description a staff member would otherwise have to type for every file. */
function defaultAlt(productName: string): string {
  return `${productName} product video`;
}
