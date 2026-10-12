"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Trash2, Boxes } from "lucide-react";
import { SearchableListbox } from "@/features/orders/components/SearchableListbox";
import type { ListboxOption } from "@/features/orders/components/SearchableListbox";
import { formatCurrency } from "@/lib/currency";
import type { Product } from "@/features/products/types";
import type { DraftPurchaseItem } from "../types";

interface PurchaseItemsEditorProps {
  items: DraftPurchaseItem[];
  errors: Record<string, string | undefined>;
  products: Product[];
  productQuery: string;
  onProductQueryChange: (query: string) => void;
  isSearchingProducts: boolean;
  onAddProduct: (product: Product) => void;
  onRemoveItem: (key: string) => void;
  onUnitCostChange: (key: string, value: string) => void;
  onQuantityChange: (key: string, value: string) => void;
  isSubmitting: boolean;
}

export function PurchaseItemsEditor({
  items,
  errors,
  products,
  productQuery,
  onProductQueryChange,
  isSearchingProducts,
  onAddProduct,
  onRemoveItem,
  onUnitCostChange,
  onQuantityChange,
  isSubmitting,
}: PurchaseItemsEditorProps) {
  const addedProductIds = new Set(items.map((item) => item.productId));
  const availableProducts = products.filter((product) => !addedProductIds.has(product.id));

  const options: ListboxOption[] = availableProducts.map((product) => ({
    id: product.id,
    label: product.name,
    description: product.sku,
    hint: `Stock ${product.stock}`,
  }));

  const emptyText =
    products.length > 0 && availableProducts.length === 0
      ? "All matching products are already in the purchase."
      : "No matching products found.";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-label text-foreground">
          Purchase items
          <span className="ml-0.5 text-destructive">*</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {items.length} of 100 maximum
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
          No items yet. Search for a product below to add it to the purchase.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const cost = Number(item.unitCost) || 0;
            const quantity = Number(item.quantity) || 0;
            const lineTotal = cost > 0 && quantity > 0 ? cost * quantity : 0;
            return (
              <li key={item.key} className="rounded-md border border-border p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.productName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{item.sku}</p>
                  </div>
                  {errors[item.key] && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors[item.key]}
                    </p>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                  <div>
                    <Input
                      aria-label={`Unit cost for ${item.productName}`}
                      type="number"
                      min="0"
                      step="any"
                      value={item.unitCost}
                      onChange={(event) => onUnitCostChange(item.key, event.target.value)}
                      disabled={isSubmitting}
                      label="Unit cost"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Input
                      aria-label={`Quantity for ${item.productName}`}
                      type="number"
                      min="1"
                      max="999999"
                      step="1"
                      value={item.quantity}
                      onChange={(event) => onQuantityChange(item.key, event.target.value)}
                      disabled={isSubmitting}
                      label="Qty"
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 sm:self-center">
                    <p className="text-sm text-muted-foreground">
                      Line total{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(lineTotal)}
                      </span>{" "}
                      <span className="text-xs">(estimated)</span>
                    </p>
                  </div>
                  <div className="col-span-2 flex justify-end sm:col-span-1 sm:self-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.key)}
                      disabled={isSubmitting}
                      aria-label={`Remove ${item.productName} from purchase`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SearchableListbox
        id="purchases-product-picker"
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
        helperText="Only active products can be purchased."
      />
    </div>
  );
}