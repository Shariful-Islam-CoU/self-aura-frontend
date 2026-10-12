"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { supplierService } from "@/features/suppliers/services/supplierService";
import { productService } from "@/features/products/services/productService";
import { AlertCircle } from "lucide-react";
import { toDateInputValue } from "@/lib/dateInput";
import { SearchableListbox } from "@/features/orders/components/SearchableListbox";
import type { ListboxOption } from "@/features/orders/components/SearchableListbox";
import { PurchaseItemsEditor } from "./PurchaseItemsEditor";
import { PurchaseSummary } from "./PurchaseSummary";
import type {
  CreatePurchaseInput,
  DraftPurchaseItem,
  Purchase,
} from "../types";
import type { Supplier } from "../../suppliers/types";
import type { Product } from "../../products/types";
import {
  calcDraftTotals,
  nextDraftKey,
  toDraftPurchaseItem,
} from "../utils/purchaseDraft";

export interface PurchaseFormValues {
  supplierId: string;
  items: DraftPurchaseItem[];
  additionalCost: string;
  purchaseDate: string;
  note: string;
}

interface PurchaseFormErrors {
  supplierId?: string;
  items?: string;
  additionalCost?: string;
  purchaseDate?: string;
  note?: string;
  [key: string]: string | undefined;
}

interface PurchaseFormProps {
  mode: "create" | "edit";
  purchase: Purchase | null;
  isSubmitting: boolean;
  onSubmit: (values: {
    supplier: string;
    items: CreatePurchaseInput["items"];
    additionalCost?: number;
    purchaseDate: string;
    note?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function PurchaseForm({
  mode,
  purchase,
  isSubmitting,
  onSubmit,
  onCancel,
}: PurchaseFormProps) {
  const [supplierId, setSupplierId] = useState(purchase?.supplier.id ?? "");
  const [supplierLabel, setSupplierLabel] = useState(
    purchase?.supplier.name ?? ""
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [isSearchingSuppliers, setIsSearchingSuppliers] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [items, setItems] = useState<DraftPurchaseItem[]>(() =>
    purchase
      ? purchase.items.map((item, index) =>
          toDraftPurchaseItem(item, `edit-${index}`)
        )
      : []
  );
  const [additionalCost, setAdditionalCost] = useState(
    purchase ? String(purchase.additionalCost) : "0"
  );
  const [purchaseDate, setPurchaseDate] = useState(
    purchase
      ? toDateInputValue(purchase.purchaseDate)
      : toDateInputValue(new Date().toISOString())
  );
  const [note, setNote] = useState(purchase?.note ?? "");
  const [errors, setErrors] = useState<PurchaseFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Drop stale results the moment the query is cleared (render-phase state
  // adjustment - the lint-safe alternative to setState-in-effect).
  const [wasSupplierQuery, setWasSupplierQuery] = useState(supplierQuery);
  if (supplierQuery !== wasSupplierQuery) {
    setWasSupplierQuery(supplierQuery);
    if (supplierQuery.trim() === "") {
      setSuppliers([]);
    }
  }

  // Debounced supplier search against GET /suppliers.
  useEffect(() => {
    if (supplierQuery.trim() === "") return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsSearchingSuppliers(true);
      try {
        const data = await supplierService.listSuppliers({
          search: supplierQuery.trim(),
          isActive: true,
          limit: 8,
        });
        if (!cancelled) setSuppliers(data.suppliers);
      } catch {
        if (!cancelled) setSuppliers([]);
      } finally {
        if (!cancelled) setIsSearchingSuppliers(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [supplierQuery]);

  // Drop stale product results the moment the query is cleared (render-phase
  // state adjustment - the lint-safe alternative to setState-in-effect).
  const [wasProductQuery, setWasProductQuery] = useState(productQuery);
  if (productQuery !== wasProductQuery) {
    setWasProductQuery(productQuery);
    if (productQuery.trim() === "") {
      setProducts([]);
    }
  }

  // Debounced active-product search against GET /products for the picker.
  useEffect(() => {
    if (productQuery.trim() === "") return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        const data = await productService.listProducts({
          search: productQuery.trim(),
          isActive: true,
          limit: 8,
        });
        if (!cancelled) setProducts(data.items);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsSearchingProducts(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [productQuery]);

  const handleAddProduct = (product: Product) => {
    setItems((prev) => [
      ...prev,
      {
        key: nextDraftKey("purchase"),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitCost: product.costPrice > 0 ? String(product.costPrice) : "0",
        quantity: "1",
      },
    ]);
    setErrors((prev) => ({ ...prev, items: undefined }));
  };

  const handleRemoveItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleUnitCostChange = (key: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, unitCost: value } : item))
    );
  };

  const handleQuantityChange = (key: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity: value } : item))
    );
  };

  const supplierOptions: ListboxOption[] = suppliers.map((supplier) => ({
    id: supplier.id,
    label: supplier.name,
    description: supplier.phone,
  }));

  const handleSelectSupplier = (option: ListboxOption) => {
    setSupplierId(option.id);
    setSupplierLabel(option.label);
    setErrors((prev) => ({ ...prev, supplierId: undefined }));
  };

  // Draft estimate of the totals for display only. The backend computes and
  // returns the authoritative totals when the purchase is created/updated.
  const totals = calcDraftTotals(items, additionalCost);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const next: PurchaseFormErrors = {};
    if (!supplierId) next.supplierId = "Please select a supplier.";
    if (items.length === 0)
      next.items = "Add at least one product line to the purchase.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await onSubmit({
        supplier: supplierId,
        items: items.map((item) => ({
          product: item.productId,
          quantity: Number(item.quantity) || 0,
          unitCost: Number(item.unitCost) || 0,
        })),
        additionalCost: Number(additionalCost) || 0,
        purchaseDate,
        note: note.trim() || undefined,
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save the purchase."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {formError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {formError}
        </div>
      )}

      <SearchableListbox
        id="purchase-supplier"
        label="Supplier"
        placeholder="Search suppliers by name or phone..."
        query={supplierQuery}
        onQueryChange={setSupplierQuery}
        options={supplierOptions}
        selected={supplierId ? { id: supplierId, label: supplierLabel } : null}
        onSelect={handleSelectSupplier}
        isSearching={isSearchingSuppliers}
        disabled={isSubmitting}
        required
        error={errors.supplierId}
        helperText="Only active suppliers can be used for purchases."
        emptyText="No matching suppliers found."
      />

      <PurchaseItemsEditor
        items={items}
        errors={errors}
        products={products}
        productQuery={productQuery}
        onProductQueryChange={setProductQuery}
        isSearchingProducts={isSearchingProducts}
        onAddProduct={handleAddProduct}
        onRemoveItem={handleRemoveItem}
        onUnitCostChange={handleUnitCostChange}
        onQuantityChange={handleQuantityChange}
        isSubmitting={isSubmitting}
      />

      {errors.items && (
        <p role="alert" className="text-sm text-destructive">
          {errors.items}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            id="purchase-additional-cost"
            label="Additional cost"
            type="number"
            min="0"
            step="any"
            value={additionalCost}
            onChange={(event) => setAdditionalCost(event.target.value)}
            error={errors.additionalCost}
            disabled={isSubmitting}
            placeholder="0.00"
          />
        </div>
        <div>
          <Input
            id="purchase-date"
            label="Purchase date"
            type="date"
            value={purchaseDate}
            onChange={(event) => setPurchaseDate(event.target.value)}
            error={errors.purchaseDate}
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <PurchaseSummary estimate={totals} />

      <div>
        <Textarea
          id="purchase-note"
          label="Note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          error={errors.note}
          disabled={isSubmitting}
          rows={3}
          placeholder="Optional note for this purchase (max 2000 characters)."
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === "create" ? "Create purchase" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
