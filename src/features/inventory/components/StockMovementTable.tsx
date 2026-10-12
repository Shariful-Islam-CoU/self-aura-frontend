"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { inventoryService } from "../services/inventoryService";
import { formatDateTime } from "@/lib/dateUtils";
import { History, RotateCcw } from "lucide-react";
import type { Product } from "@/features/products/types";
import type { StockMovement, StockTransactionType } from "../types";

const TYPE_CONFIG: Record<
  StockTransactionType,
  { label: string; variant: "success" | "destructive" | "info" | "secondary" }
> = {
  stock_in: { label: "Stock In", variant: "success" },
  stock_out: { label: "Stock Out", variant: "destructive" },
  adjustment: { label: "Adjustment", variant: "info" },
  return_in: { label: "Return In", variant: "secondary" },
  return_out: { label: "Return Out", variant: "secondary" },
};

const REASON_LABELS: Record<string, string> = {
  initial_stock: "Initial stock",
  restock: "Restock",
  removal: "Removal",
  manual_adjustment: "Manual adjustment",
  damaged: "Damaged",
  lost: "Lost",
  returned: "Returned",
  correction: "Correction",
  purchase: "Purchase",
};

const quantityLabel = (movement: StockMovement): string => {
  if (movement.type === "stock_in" || movement.type === "return_in") {
    return `+${movement.quantity}`;
  }
  if (movement.type === "stock_out" || movement.type === "return_out") {
    return `-${movement.quantity}`;
  }
  return String(movement.quantity);
};

interface StockMovementTableProps {
  product: Product;
  refreshKey?: number;
}

export function StockMovementTable({ product, refreshKey = 0 }: StockMovementTableProps) {
  const [items, setItems] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getStockHistory(product.id, {
        page,
        limit: pageSize,
      });
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load stock movements.");
    } finally {
      setIsLoading(false);
    }
  }, [product.id, page, pageSize]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await inventoryService.getStockHistory(product.id, {
          page,
          limit: pageSize,
        });
        if (!cancelled) {
          setItems(data.items);
          setPagination(data.pagination);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load stock movements.");
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [product.id, page, pageSize, refreshKey]);

  const handlePageChange = (nextPage: number) => setPage(nextPage);
  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Stock movement history</h4>
        {error && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void loadHistory()}
          >
            <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        )}
      </div>

      {isLoading ? (
        <StockMovementTableSkeleton />
      ) : error ? (
        <ErrorState
          title="Unable to load stock movements."
          description={error}
          onRetry={() => void loadHistory()}
          retryLabel="Try again"
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No stock movements."
          description="Movements will appear here when stock is added, removed, or adjusted for this product."
          icon={<History className="h-12 w-12" aria-hidden="true" />}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                Stock movements for {product.name}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Previous → New</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((movement) => {
                  const typeConfig = TYPE_CONFIG[movement.type] ?? {
                    label: movement.type,
                    variant: "secondary" as const,
                  };
                  return (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(movement.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          movement.type === "stock_out" || movement.type === "return_out"
                            ? "text-destructive"
                            : movement.type === "stock_in" || movement.type === "return_in"
                              ? "text-success"
                              : ""
                        }`}
                      >
                        {quantityLabel(movement)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {movement.previousStock}
                        </span>
                        {" → "}
                        <span className="font-medium text-foreground">{movement.newStock}</span>
                      </TableCell>
                      <TableCell>{REASON_LABELS[movement.reason] ?? movement.reason}</TableCell>
                      <TableCell className="max-w-[10rem] truncate text-muted-foreground">
                        {movement.note || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {movement.createdBy.username ?? movement.createdBy.id.slice(0, 8)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            pageSizeOptions={[10, 20]}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  );
}

function StockMovementTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-9 rounded-md border border-border" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-12 text-right" />
          <Skeleton className="h-4 w-20 text-right" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}