"use client";

import { formatCurrency } from "@/lib/currency";
import type { Purchase } from "../types";

interface PurchaseTotals {
  subtotal: number;
  additionalCost: number;
  total: number;
}

interface PurchaseSummaryProps {
  /** Authoritative backend values (purchase details view). */
  purchase?: Purchase;
  /** Informational estimate for the create/edit form. */
  estimate?: PurchaseTotals;
}

export function PurchaseSummary({ purchase, estimate }: PurchaseSummaryProps) {
  const isAuthoritative = Boolean(purchase);
  const totals: PurchaseTotals = purchase
    ? {
        subtotal: purchase.subtotal,
        additionalCost: purchase.additionalCost,
        total: purchase.total,
      }
    : estimate ?? { subtotal: 0, additionalCost: 0, total: 0 };

  return (
    <div className="rounded-md border border-border p-4">
      <h4 className="text-sm font-semibold text-foreground">
        {isAuthoritative ? "Purchase summary" : "Purchase summary (estimated)"}
      </h4>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium text-foreground">{formatCurrency(totals.subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Additional cost</dt>
          <dd className="font-medium text-foreground">
            {formatCurrency(totals.additionalCost)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
          <dt className="font-medium text-foreground">Total</dt>
          <dd className="text-base font-bold text-foreground">
            {formatCurrency(totals.total)}
          </dd>
        </div>
      </dl>
      {!isAuthoritative && (
        <p className="mt-3 text-xs text-muted-foreground">
          Estimated amounts. The server calculates the final totals when the
          purchase is saved.
        </p>
      )}
    </div>
  );
}