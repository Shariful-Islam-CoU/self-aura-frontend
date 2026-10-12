"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { ProductImageFrame } from "@/components/media/ProductImageFrame";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dateUtils";
import { normalizeOrder, resolveMediaUrl } from "../lib/media";
import type { Product } from "../types";

interface ProductDetailsProps {
  open: boolean;
  product?: Product | null;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetails({ open, product, onOpenChange }: ProductDetailsProps) {
  if (!product) return null;

  // The API already returns a densely ordered list; normalising defensively
  // means a hand-crafted response can never render out of order.
  const images = normalizeOrder(product.images ?? []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            SKU: <span className="font-mono">{product.sku}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {images.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <li key={image.url || index} className="relative">
                  <ProductImageFrame
                    src={resolveMediaUrl(image.url)}
                    alt={image.alt || `${product.name} image ${index + 1}`}
                    aspectRatio="1 / 1"
                    sizes="(min-width: 640px) 160px, 50vw"
                    imageClassName="object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-background/85 px-1.5 py-0.5 text-[10px] font-label uppercase tracking-[0.12em] text-muted-foreground backdrop-blur">
                      Primary
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="relative h-32">
              <ProductImageFrame
                src={null}
                alt=""
                aspectRatio="3 / 1"
                sizes="320px"
                fallbackLabel="No images yet"
              />
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-foreground">Description</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.description || "No description provided."}
            </p>
          </div>

          <Separator />

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Category</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {product.category.name ?? product.category.id}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <Badge variant={product.isActive ? "success" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
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
              <dt className="text-sm font-medium text-muted-foreground">Stock (read-only)</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {product.stock} units{" "}
                <Link
                  href="/inventory"
                  className="ml-1 text-sm font-normal text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Manage inventory
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Low stock threshold</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {product.lowStockThreshold} units
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatDateTime(product.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Last updated</dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatDateTime(product.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}