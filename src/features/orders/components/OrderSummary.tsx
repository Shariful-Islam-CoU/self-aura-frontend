"use client";

import { formatCurrency } from "@/lib/currency";
import type { Order } from "../types";

interface OrderTotals {
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
}

interface OrderSummaryProps {
  /** Authoritative backend values (order details view). */
  order?: Order;
  /** Informational estimate for the creation form (items only). */
  estimate?: OrderTotals;
}

export function OrderSummary({ order, estimate }: OrderSummaryProps) {
  const isAuthoritative = Boolean(order);
  const totals: OrderTotals = order
    ? {
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryCharge: order.deliveryCharge,
        total: order.total,
      }
    : estimate ?? { subtotal: 0, discount: 0, deliveryCharge: 0, total: 0 };

  // The authoritative view can show which zone the charge came from, so staff
  // can explain a historical order even after the zone is edited.
  const deliveryZone = order?.delivery;

  return (
    <div className="rounded-md border border-border p-4">
      <h4 className="text-sm font-semibold text-foreground">
        {isAuthoritative ? "Order summary" : "Order summary (estimated)"}
      </h4>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium text-foreground">{formatCurrency(totals.subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Discount</dt>
          <dd
            className={`font-medium ${totals.discount > 0 ? "text-success" : "text-foreground"}`}
          >
            −{formatCurrency(totals.discount)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">
            Delivery charge
            {deliveryZone?.freeDeliveryApplied ? " (free)" : ""}
          </dt>
          <dd className="font-medium text-foreground">
            {isAuthoritative
              ? formatCurrency(totals.deliveryCharge)
              : "Calculated by server"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
          <dt className="font-medium text-foreground">Total</dt>
          <dd className="text-base font-bold text-foreground">
            {formatCurrency(totals.total)}
          </dd>
        </div>
      </dl>
      {deliveryZone && (
        <p className="mt-3 text-xs text-muted-foreground">
          Delivered via {deliveryZone.name}
          {deliveryZone.district ? ` (${deliveryZone.district})` : ""} —{" "}
          {deliveryZone.estimatedMinDays}–{deliveryZone.estimatedMaxDays} days.
        </p>
      )}
      {!isAuthoritative && (
        <p className="mt-3 text-xs text-muted-foreground">
          Estimated items total only. The server resolves the delivery zone and
          calculates the discount, delivery charge and final total when the order
          is created.
        </p>
      )}
    </div>
  );
}
