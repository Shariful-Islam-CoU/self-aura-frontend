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
import { Badge } from "@/components/ui/Badge";
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
import { ProductImageFrame } from "@/components/media/ProductImageFrame";
import {
  MoreHorizontal,
  Pencil,
  Power,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dateUtils";
import { getPrimaryImage, resolveMediaUrl } from "../lib/media";
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
 * Row thumbnail.
 *
 * Reads the canonical primary image (`sortOrder === 0`) straight off the
 * product the table already has, so rendering a page of products costs zero
 * extra image API calls. `alt=""` is intentional: the product name is in the
 * next cell, so announcing the image again would be noise for a screen-reader
 * user. A missing or broken image degrades to the shared styled fallback
 * rather than a broken-image glyph.
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

interface ProductTableProps {
  products: Product[];
  canManage: boolean;
  sortBy: ProductSortBy;
  sortOrder: ProductSortOrder;
  onSortChange: (column: ProductSortBy) => void;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductTable({
  products,
  canManage,
  sortBy,
  sortOrder,
  onSortChange,
  onView,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const handleSort = (column: ProductSortBy) => onSortChange(column);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption>Products in your catalog</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" aria-label="Image" />
            <TableHead
              className="cursor-pointer select-none hover:bg-accent"
              onClick={() => handleSort("name")}
              aria-sort={sortBy === "name" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              <span className="inline-flex items-center">
                Name
                <SortIcon column="name" sortBy={sortBy} sortOrder={sortOrder} />
              </span>
            </TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Cost price</TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-accent"
              onClick={() => handleSort("sellingPrice")}
              aria-sort={sortBy === "sellingPrice" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              <span className="inline-flex items-center">
                Selling price
                <SortIcon column="sellingPrice" sortBy={sortBy} sortOrder={sortOrder} />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-accent"
              onClick={() => handleSort("stock")}
              aria-sort={sortBy === "stock" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              <span className="inline-flex items-center">
                Stock
                <SortIcon column="stock" sortBy={sortBy} sortOrder={sortOrder} />
              </span>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-accent"
              onClick={() => handleSort("createdAt")}
              aria-sort={sortBy === "createdAt" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              <span className="inline-flex items-center">
                Created
                <SortIcon column="createdAt" sortBy={sortBy} sortOrder={sortOrder} />
              </span>
            </TableHead>
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
                  onClick={() => onView(product)}
                  className="font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {product.name}
                </button>
              </TableCell>
              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
              <TableCell className="text-muted-foreground">
                {product.category.name ?? "—"}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(product.costPrice)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(product.sellingPrice)}
              </TableCell>
              <TableCell className="text-right">
                <span className="text-muted-foreground">in stock: </span>
                <span className="font-medium">{product.stock}</span>
              </TableCell>
              <TableCell>
                <Badge variant={product.isActive ? "success" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(product.createdAt)}
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${product.name}`}>
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onView(product)}>
                        <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(product)}>
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(product)}>
                        <Power className="mr-2 h-4 w-4" aria-hidden="true" />
                        {product.isActive ? "Deactivate" : "Reactivate"}
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

export function ProductTableSkeleton() {
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
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 text-right" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}