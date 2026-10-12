"use client";

// Reusable, responsive report table with loading, empty, and error states.
// Rows come straight from the backend - no sorting or ranking is applied here.

import type { ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/LoadingState";

export type ReportColumnAlign = "left" | "right" | "center";

export interface ReportColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: ReportColumnAlign;
  className?: string;
}

export interface ReportTableProps<T> {
  columns: ReportColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

const ALIGN_CLASSES: Record<ReportColumnAlign, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function ReportTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  loading,
  error,
  onRetry,
  emptyTitle = "No data for this period",
  emptyDescription = "No records match the current filters.",
}: ReportTableProps<T>) {
  if (error && rows.length === 0) {
    return (
      <ErrorState
        title="Unable to load the report data"
        description={error}
        onRetry={onRetry}
      />
    );
  }

  if (!loading && rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.header}
                className={column.align ? ALIGN_CLASSES[column.align] : undefined}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && rows.length === 0 ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell key={column.header}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            rows.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.header}
                    className={column.align ? ALIGN_CLASSES[column.align] : undefined}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}