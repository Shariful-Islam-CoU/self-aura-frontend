import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Select } from "./Select";

export interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      className,
      page,
      totalPages,
      totalItems,
      pageSize,
      pageSizeOptions = [10, 20, 50],
      onPageChange,
      onPageSizeChange,
      ...props
    },
    ref
  ) => {
    if (totalPages <= 1 && !onPageSizeChange) return null;

    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}
        {...props}
      >
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{start}</span>
          {" - "}
          <span className="font-medium text-foreground">{end}</span>
          {" of "}
          <span className="font-medium text-foreground">{totalItems}</span>{" "}
          items
        </p>
        <div className="flex items-center gap-3">
          {onPageSizeChange && pageSizeOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows</span>
              <Select
                aria-label="Rows per page"
                className="h-9 w-[4.5rem] py-0"
                value={String(pageSize)}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                options={pageSizeOptions.map((size) => ({
                  value: String(size),
                  label: String(size),
                }))}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Page{" "}
              <span className="font-medium text-foreground">{page}</span>
              {" of "}
              <span className="font-medium text-foreground">{Math.max(totalPages, 1)}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

Pagination.displayName = "Pagination";

export { Pagination };