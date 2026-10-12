// Draft purchase form helpers. While drafting a purchase the user types cost
// and quantity values freely, so draft line items carry string inputs plus a
// stable client-side `key` for React reconciliation. The backend remains the
// authority: it stores the real unit costs, computes subtotals/additional
// cost/totals for every item and the purchase, and assigns the purchase
// number. These helpers only shape the form state and produce *draft-estimate*
// totals for display; create/update/receive responses always replace them.

import type { DraftPurchaseItem, PurchaseItem } from "../types";

let keyCounter = 0;

export function nextDraftKey(prefix = "draft"): string {
  keyCounter += 1;
  return `${prefix}-${keyCounter}`;
}

export function toDraftPurchaseItem(
  item: PurchaseItem,
  key: string = nextDraftKey()
): DraftPurchaseItem {
  return {
    key,
    productId: item.product.id,
    productName: item.productName,
    sku: item.sku,
    unitCost: String(item.unitCost),
    quantity: String(item.quantity),
  };
}

export interface DraftTotalsEstimate {
  subtotal: number;
  additionalCost: number;
  total: number;
}

/**
 * Estimate-only totals from the current draft inputs. This is explicitly NOT
 * authoritative — the backend computes and returns the real subtotal, total,
 * and per-item subtotals when the purchase is created/updated/received.
 */
export function calcDraftTotals(
  items: DraftPurchaseItem[],
  additionalCost: string
): DraftTotalsEstimate {
  const subtotal = items.reduce((sum, item) => {
    const unitCost = Number(item.unitCost);
    const quantity = Number(item.quantity);
    if (Number.isNaN(unitCost) || Number.isNaN(quantity)) return sum;
    return sum + unitCost * quantity;
  }, 0);
  const additional = Number(additionalCost);
  const parsedAdditional = Number.isNaN(additional) || additional < 0 ? 0 : additional;
  return {
    subtotal,
    additionalCost: parsedAdditional,
    total: subtotal + parsedAdditional,
  };
}
