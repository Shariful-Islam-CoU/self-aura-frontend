"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { InventoryStatusBadge } from "./InventoryStatusBadge";
import { StockMovementTable } from "./StockMovementTable";
import { SlidersHorizontal } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dateUtils";
import { ProductImageFrame } from "@/components/media/ProductImageFrame";
import { getPrimaryImage, resolveMediaUrl } from "@/features/products/lib/media";
import type { Product } from "@/features/products/types";

interface InventoryDetailsProps {
  open: boolean;
  product: Product | null;
  canManage: boolean;
  movementRefreshKey: number;
  onAdjust: (product: Product) => void;
  onOpenChange: (open: boolean) => void;
}

export function InventoryDetails({
  open,
  product,
  canManage,
  movementRefreshKey,
  onAdjust,
  onOpenChange,
}: InventoryDetailsProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            SKU: <span className="font-mono">{product.sku}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <ProductImageFrame
                src={resolveMediaUrl(getPrimaryImage(product.images)?.url)}
                alt=""
                sizes="56px"
                aspectRatio="1 / 1"
                className="h-14 w-14 flex-none"
                imageClassName="object-cover"
                fallbackLabel="No image"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {product.category.name ?? "—"}
                </p>
              </div>
            </div>
            {canManage && (
              <Button type="button" onClick={() => onAdjust(product)}>
                <SlidersHorizontal className="mr-1 h-4 w-4" aria-hidden="true" />
                Adjust stock
              </Button>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Current stock (read-only)</dt>
              <dd className="mt-1 text-lg font-bold text-foreground">{product.stock} units</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Stock status</dt>
              <dd className="mt-1">
                <InventoryStatusBadge
                  stock={product.stock}
                  lowStockThreshold={product.lowStockThreshold}
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Low stock threshold</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {product.lowStockThreshold} units
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Cost price</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {formatCurrency(product.costPrice)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Selling price</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {formatCurrency(product.sellingPrice)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Last updated</dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatDateTime(product.updatedAt)}
              </dd>
            </div>
          </dl>

          <Separator />

          <StockMovementTable product={product} refreshKey={movementRefreshKey} />
        </div>
      </DialogContent>
    </Dialog>
  );
}