"use client";

/**
 * Media upload progress.
 *
 * A product video is up to 100 MB. "Uploading 2 of 3..." says nothing for the
 * forty seconds a single large file takes, so the bar reports the percentage of
 * the CURRENT file as well as the position in the queue. Two numbers, because a
 * user needs both: where they are in the batch, and whether the current file is
 * moving.
 *
 * `role="progressbar"` with `aria-valuenow` means a screen reader announces the
 * percentage too, and the surrounding `role="status"` means the change is
 * announced without stealing focus.
 */

export interface MediaUploadProgressProps {
  /** 1-based index of the file being uploaded. */
  current: number;
  /** Total files in this batch. */
  total: number;
  /** Filename of the current file, shown so a multi-file selection is trackable. */
  fileName: string;
  /** Bytes sent for the current file, 0-100. */
  percent: number;
  className?: string;
}

export function MediaUploadProgress({
  current,
  total,
  fileName,
  percent,
  className,
}: MediaUploadProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const label =
    total > 1 ? `Uploading ${current} of ${total}: ${fileName}` : `Uploading ${fileName}`;

  return (
    <div className={className}>
      <p
        role="status"
        className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
      >
        <span className="truncate">
          {total > 1 ? `Uploading ${current} of ${total}: ` : "Uploading "}
          <span className="font-medium text-foreground">{fileName}</span>
        </span>
        <span className="flex-none tabular-nums">{clamped}%</span>
      </p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
