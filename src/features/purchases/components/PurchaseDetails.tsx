"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { formatCurrency } from "@/lib/currency";
import type { Purchase } from "../types";
import { PurchaseStatusBadge, PURCHASE_STATUS_LABELS } from "./PurchaseStatusBadge";

interface PurchaseDetailRowProps {
  label: string;
  children: ReactNode;
}

function PurchaseDetailRow({ label, children }: PurchaseDetailRowProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold sm:text-right">{children}</dd>
    </div>
  );
}

interface PurchaseDetailsProps {
  purchase: Purchase;
  canManage: boolean;
  isMutating: boolean;
  onRequestReceive: () => void;
  onRequestCancel: () => void;
  onRequestEdit: () => void;
}

export function PurchaseDetails({
  purchase,
  canManage,
  isMutating,
  onRequestReceive,
  onRequestCancel,
  onRequestEdit,
}: PurchaseDetailsProps) {
  const canMutate =
    canManage && purchase.status === "draft" && !isMutating;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Purchase {purchase.purchaseNumber}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {purchase.status === "draft"
              ? "Draft purchase — not yet received."
              : PURCHASE_STATUS_LABELS[purchase.status]}
          </p>
        </div>
        <PurchaseStatusBadge status={purchase.status} />
      </div>

      <dl className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
        <PurchaseDetailRow label="Purchase date">
          {formatDate(purchase.purchaseDate)}
        </PurchaseDetailRow>
        <PurchaseDetailRow label="Supplier">{purchase.supplier.name ?? purchase.supplier.id}</PurchaseDetailRow>
        <PurchaseDetailRow label="Created by">
          {purchase.createdBy.username ?? purchase.createdBy.id}
        </PurchaseDetailRow>
        <PurchaseDetailRow label="Ordered on">
          {formatDateTime(purchase.createdAt)}
        </PurchaseDetailRow>
      </dl>

      <div className="divide-y overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className="col-span-3">Product</span>
          <span className="col-span-3">SKU</span>
          <span className="col-span-2 text-right">Cost</span>
          <span className="col-span-2 text-right">Qty</span>
          <span className="col-span-2 text-right">Subtotal</span>
        </div>
        {purchase.items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm">
            <span className="col-span-3 font-medium">{item.productName}</span>
            <span className="col-span-3 text-muted-foreground">{item.sku}</span>
            <span className="col-span-2 text-right">{formatCurrency(item.unitCost)}</span>
            <span className="col-span-2 text-right">{item.quantity}</span>
            <span className="col-span-2 text-right font-medium">{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <div className="w-full sm:w-80 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(purchase.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Additional cost</span>
            <span className="font-medium">{formatCurrency(purchase.additionalCost)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(purchase.total)}</span>
          </div>
        </div>
      </div>

      {purchase.note && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Note</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{purchase.note}</p>
        </div>
      )}

      {canMutate && (
        <div className="flex flex-wrap gap-3">
          <Button variant="default" onClick={onRequestReceive}>
            Mark as received
          </Button>
          <Button variant="outline" onClick={onRequestEdit}>
            Edit draft
          </Button>
          <Button variant="destructive" onClick={onRequestCancel}>
            Cancel purchase
          </Button>
        </div>
      )}
    </div>
  );
}
