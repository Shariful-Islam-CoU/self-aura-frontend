"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/LoadingState";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { InventoryStatusBadge } from "./InventoryStatusBadge";
import {
  MoreHorizontal,
  Eye,
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dateUtils";
import { ProductImageFrame } from "@/components/media/ProductImageFrame";
import { getPrimaryImage, resolveMediaUrl } from "@/features/products/lib/media";
import type { Product, ProductSortBy, ProductSortOrder } from "../types";

interface SortIconProps {
  column: ProductSortBy;
  sortBy: ProductSortBy;
  sortOrder: ProductSortOrder;
}

function SortIcon({ column, sortBy, sortOrder }: SortIconProps) {
  if (sortBy !== column) {
    return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />;
  }
  return sortOrder === "asc" ? (
    <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" aria-hidden="true" />
  ) : (
    <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" aria-hidden="true" />
  );
}

/**
 * Row thumbnail built from the canonical primary image the products endpoint
 * already returned - no extra image request. `alt=""` because the product name
 * sits in the very next cell; a missing or broken file renders the shared
 * styled fallback instead of a broken-image glyph.
 */
function ProductThumb({ product }: { product: Product }) {
  const primary = getPrimaryImage(product.images);
  return (
    <ProductImageFrame
      src={resolveMediaUrl(primary?.url)}
      alt=""
      sizes="40px"
      aspectRatio="1 / 1"
      className="h-10 w-10 flex-none"
      imageClassName="object-cover"
      fallbackLabel="No image"
    />
  );
}

export type InventoryAction =
  | "view"
  | "add"
  | "remove"
  | "adjust";

interface InventoryTableProps {
  products: Product[];
  canManage: boolean;
  sortBy: ProductSortBy;
  sortOrder: ProductSortOrder;
  sortingEnabled: boolean;
  onSortChange: (column: ProductSortBy) => void;
  onAction: (product: Product, action: InventoryAction) => void;
}

export function InventoryTable({
  products,
  canManage,
  sortBy,
  sortOrder,
  sortingEnabled,
  onSortChange,
  onAction,
}: InventoryTableProps) {
  const handleSort = (column: ProductSortBy) => {
    if (sortingEnabled) onSortChange(column);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption>Current inventory levels</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" aria-label="Image" />
            <TableHead
              className={sortingEnabled ? "cursor-pointer select-none hover:bg-accent" : undefined}
              onClick={() => handleSort("name")}
              aria-sort={sortBy === "name" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              <span className="inline-flex items-center">
                Product
                {sortingEnabled && <SortIcon column="name" sortBy={sortBy} sortOrder={sortOrder} />}
              </span>
            </TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead
              className={`text-right ${sortingEnabled ? "cursor-pointer select-none hover:bg-accent" : ""}`}
              onClick={() => handleSort("stock")}
              aria-sort={sortBy === "stock" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              <span className="inline-flex items-center">
                Current stock
                {sortingEnabled && <SortIcon column="stock" sortBy={sortBy} sortOrder={sortOrder} />}
              </span>
            </TableHead>
            <TableHead>Stock status</TableHead>
            <TableHead className="text-right">Cost price</TableHead>
            <TableHead>Last updated</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <ProductThumb product={product} />
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onAction(product, "view")}
                  className="font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm text-left"
                >
                  {product.name}
                </button>
              </TableCell>
              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
              <TableCell className="text-muted-foreground">
                {product.category.name ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <span className="font-medium">{product.stock}</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  / min {product.lowStockThreshold}
                </span>
              </TableCell>
              <TableCell>
                <InventoryStatusBadge
                  stock={product.stock}
                  lowStockThreshold={product.lowStockThreshold}
                />
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(product.costPrice)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(product.updatedAt)}
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Inventory actions for ${product.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Inventory</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onAction(product, "view")}>
                        <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction(product, "add")}>
                        <PackagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
                        Add stock
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction(product, "remove")}>
                        <PackageMinus className="mr-2 h-4 w-4" aria-hidden="true" />
                        Remove stock
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction(product, "adjust")}>
                        <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
                        Adjust stock
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function InventoryTableSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-9 rounded-md border border-border" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-3">
          <Skeleton variant="rectangular" className="h-10 w-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 text-right" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}