"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Trash2, Boxes } from "lucide-react";
import { SearchableListbox } from "./SearchableListbox";
import type { ListboxOption } from "./SearchableListbox";
import { formatCurrency } from "@/lib/currency";
import type { Product } from "@/features/products/types";
import type { DraftOrderItem } from "../types";

interface OrderItemsEditorProps {
  items: DraftOrderItem[];
  errors: Record<string, string | undefined>;
  products: Product[];
  productQuery: string;
  onProductQueryChange: (query: string) => void;
  isSearchingProducts: boolean;
  onAddProduct: (product: Product) => void;
  onRemoveItem: (key: string) => void;
  onQuantityChange: (key: string, value: string) => void;
  isSubmitting: boolean;
}

export function OrderItemsEditor({
  items,
  errors,
  products,
  productQuery,
  onProductQueryChange,
  isSearchingProducts,
  onAddProduct,
  onRemoveItem,
  onQuantityChange,
  isSubmitting,
}: OrderItemsEditorProps) {
  const addedProductIds = new Set(items.map((item) => item.productId));
  const availableProducts = products.filter((product) => !addedProductIds.has(product.id));

  const options: ListboxOption[] = availableProducts.map((product) => ({
    id: product.id,
    label: product.name,
    description: product.sku,
    hint: product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock",
    disabled: product.stock <= 0,
  }));

  const emptyText =
    products.length > 0 && availableProducts.length === 0
      ? "All matching products are already in the order."
      : "No matching products found.";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-label text-foreground">
          Order items
          <span className="ml-0.5 text-destructive">*</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {items.length} of 50 maximum
        </span>
      </div>

      {errors.items && (
        <p role="alert" className="text-sm text-destructive">
          {errors.items}
        </p>
      )}

      {items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          <Boxes className="h-4 w-4 flex-none" aria-hidden="true" />
          No items yet. Search for a product below to add it to the order.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const lineTotal = item.quantity
              ? item.unitPrice * Number(item.quantity)
              : 0;
            return (
              <li
                key={item.key}
                className="rounded-md border border-border p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.productName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.sku} · {formatCurrency(item.unitPrice)} each
                      {item.stock > 0 ? ` · Stock ${item.stock}` : " · Out of stock"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label={`Quantity for ${item.productName}`}
                      type="number"
                      min={1}
                      max={9999}
                      value={item.quantity}
                      onChange={(event) =>
                        onQuantityChange(item.key, event.target.value)
                      }
                      disabled={isSubmitting}
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.key)}
                      disabled={isSubmitting}
                      aria-label={`Remove ${item.productName} from order`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(lineTotal)} (estimated)
                  </p>
                  {errors[item.key] && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors[item.key]}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SearchableListbox
        id="orders-product-picker"
        label="Add product"
        placeholder="Search products by name or SKU..."
        query={productQuery}
        onQueryChange={onProductQueryChange}
        options={options}
        selected={null}
        onSelect={(option) => {
          const product = availableProducts.find(
            (candidate) => candidate.id === option.id
          );
          if (product) onAddProduct(product);
        }}
        isSearching={isSearchingProducts}
        disabled={isSubmitting}
        emptyText={emptyText}
        helperText="Only active products with stock can be ordered."
      />
    </div>
  );
}