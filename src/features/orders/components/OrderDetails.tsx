"use client";

import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderStatusBadge";
import {
  ORDER_SOURCE_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "./OrderStatusBadge";
import { OrderSummary } from "./OrderSummary";
import { CANCELLABLE_ORDER_STATUSES, ORDER_TRANSITIONS } from "../types";
import type { Order, OrderStatus } from "../types";
import {
  User,
  MapPin,
  StickyNote,
  RotateCcw,
  Ban,
  ArrowRightCircle,
  Calendar,
  Info,
  Package,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import { formatDateTime } from "@/lib/dateUtils";
import { formatCurrency } from "@/lib/currency";

interface OrderDetailsProps {
  order: Order;
  /** Backend allows owner/manager to cancel orders. */
  canCancel: boolean;
  isUpdatingStatus: boolean;
  onAdvanceStatus: (next: OrderStatus) => void;
  onRequestCancel: () => void;
  /** Backend allows owner/manager to override the delivery charge. */
  canOverrideCharge: boolean;
  /** Persists the override; the backend recomputes totals and audits the change. */
  onOverrideCharge: (finalCharge: number, reason?: string) => Promise<void>;
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-muted-foreground">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function OrderDetails({
  order,
  canCancel,
  isUpdatingStatus,
  onAdvanceStatus,
  onRequestCancel,
  canOverrideCharge,
  onOverrideCharge,
}: OrderDetailsProps) {
  const nextStatus = ORDER_TRANSITIONS[order.orderStatus][0];
  const cancellable =
    canCancel && CANCELLABLE_ORDER_STATUSES.includes(order.orderStatus);

  // Inline delivery-charge override editor (management only).
  const [overriding, setOverriding] = useState(false);
  const [overrideCharge, setOverrideCharge] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const submitOverride = async () => {
    const finalCharge = Number(overrideCharge);
    if (!Number.isFinite(finalCharge) || finalCharge < 0) {
      setOverrideError("Final charge must be a number of 0 or more.");
      return;
    }
    setOverrideSaving(true);
    setOverrideError(null);
    try {
      await onOverrideCharge(finalCharge, overrideReason.trim() || undefined);
      setOverriding(false);
      setOverrideCharge("");
      setOverrideReason("");
    } catch {
      setOverrideError("Could not save the override. The order may have been cancelled.");
    } finally {
      setOverrideSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Order items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-[16rem]">
                        <p className="truncate font-medium text-foreground">
                          {item.productName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{item.sku}</p>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 max-w-sm">
              <OrderSummary order={order} />
            </div>
          </CardContent>
        </Card>

        {order.note && (
          <SectionCard
            title="Note"
            icon={<StickyNote className="h-4 w-4" aria-hidden="true" />}
          >
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{order.note}</p>
          </SectionCard>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Order status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <OrderStatusBadge status={order.orderStatus} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>

            {nextStatus && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isUpdatingStatus}
                onClick={() => onAdvanceStatus(nextStatus)}
              >
                <ArrowRightCircle
                  className="mr-1 h-4 w-4"
                  aria-hidden="true"
                />
                Mark as {ORDER_STATUS_LABELS[nextStatus]}
              </Button>
            )}

            {order.orderStatus === "delivered" && (
              <p className="text-sm text-muted-foreground">
                This order has been delivered.
              </p>
            )}
            {order.orderStatus === "cancelled" && (
              <p className="text-sm text-muted-foreground">
                This order was cancelled. Stock has been restored by the server.
              </p>
            )}
            {order.orderStatus === "returned" && (
              <p className="text-sm text-muted-foreground">
                This order was returned.
              </p>
            )}

            {cancellable && (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={isUpdatingStatus}
                onClick={onRequestCancel}
              >
                <Ban className="mr-1 h-4 w-4" aria-hidden="true" />
                Cancel order
              </Button>
            )}
          </CardContent>
        </Card>

        <SectionCard title="Customer" icon={<User className="h-4 w-4" aria-hidden="true" />}>
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{order.customer.name ?? "—"}</p>
            {order.customer.phone && (
              <p className="text-muted-foreground">{order.customer.phone}</p>
            )}
            {order.customer.email && (
              <p className="truncate text-muted-foreground">{order.customer.email}</p>
            )}
            {order.customer.id && (
              <Link
                href="/customers"
                className="mt-1 inline-block text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                View customers
              </Link>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Shipping address"
          icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
        >
          <address className="text-sm not-italic text-muted-foreground">
            {order.shippingAddress.recipientName && (
              <p className="font-medium text-foreground">
                {order.shippingAddress.recipientName}
              </p>
            )}
            <p>{order.shippingAddress.addressLine}</p>
            {(order.shippingAddress.area ||
              order.shippingAddress.district ||
              order.shippingAddress.city) && (
              <p>
                {[
                  order.shippingAddress.area,
                  order.shippingAddress.district,
                  order.shippingAddress.city,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {(order.shippingAddress.postalCode || order.shippingAddress.country) && (
              <p>
                {[order.shippingAddress.postalCode, order.shippingAddress.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {order.shippingAddress.phone && (
              <p>{order.shippingAddress.phone}</p>
            )}
          </address>
        </SectionCard>

        {order.delivery && (
          <SectionCard
            title="Delivery"
            icon={<Package className="h-4 w-4" aria-hidden="true" />}
          >
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Zone</dt>
                <dd className="font-medium text-foreground">
                  {order.delivery.name} ({order.delivery.code})
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Matched by</dt>
                <dd className="font-medium text-foreground">
                  {order.delivery.matchedBy}
                </dd>
              </div>
              {order.delivery.isOverridden ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Calculated charge</dt>
                    <dd className="text-muted-foreground">
                      {formatCurrency(
                        order.delivery.calculatedCharge ?? order.delivery.charge
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Final charge</dt>
                    <dd className="font-semibold text-foreground">
                      {formatCurrency(
                        order.delivery.finalCharge ?? order.delivery.charge
                      )}
                    </dd>
                  </div>
                  {order.delivery.overrideReason && (
                    <div className="flex items-start justify-between gap-2">
                      <dt className="text-muted-foreground">Override reason</dt>
                      <dd className="text-right font-medium text-foreground">
                        {order.delivery.overrideReason}
                      </dd>
                    </div>
                  )}
                  {order.delivery.overriddenBy && (
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Overridden by</dt>
                      <dd className="font-medium text-foreground">
                        {order.delivery.overriddenBy}
                        {order.delivery.overriddenAt
                          ? ` · ${formatDateTime(order.delivery.overriddenAt)}`
                          : ""}
                      </dd>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Charge</dt>
                  <dd className="font-medium text-foreground">
                    {order.delivery.freeDeliveryApplied
                      ? "Free"
                      : formatCurrency(order.delivery.charge)}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Estimated delivery</dt>
                <dd className="font-medium text-foreground">
                  {order.delivery.estimatedMinDays}–{order.delivery.estimatedMaxDays} days
                </dd>
              </div>
              {order.transactionId && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Transaction ID</dt>
                  <dd className="font-medium text-foreground break-all text-right">
                    {order.transactionId}
                  </dd>
                </div>
              )}
              {order.senderPhone && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Sender phone</dt>
                  <dd className="font-medium text-foreground">
                    {order.senderPhone}
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Stored with the order when it was placed. Later changes to delivery
              zones never alter this order.
            </p>

            {canOverrideCharge && (
              <div className="mt-3 border-t pt-3">
                {overriding ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Changes the billed delivery fee and re-computes the order
                      total on the backend. The calculated (rule-based) charge is
                      kept for reference, and the change is audited.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium">Final charge</span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={overrideCharge}
                          onChange={(event) => setOverrideCharge(event.target.value)}
                          disabled={overrideSaving}
                          placeholder={String(
                            order.delivery.finalCharge ?? order.delivery.charge
                          )}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium">Reason</span>
                        <input
                          type="text"
                          value={overrideReason}
                          onChange={(event) => setOverrideReason(event.target.value)}
                          disabled={overrideSaving}
                          maxLength={500}
                          placeholder="e.g. Customer discount agreed"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                    </div>
                    {overrideError && (
                      <p role="alert" className="text-xs text-destructive">
                        {overrideError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void submitOverride()}
                        disabled={overrideSaving}
                      >
                        {overrideSaving ? "Saving…" : "Save override"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOverriding(false);
                          setOverrideError(null);
                        }}
                        disabled={overrideSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOverrideCharge("");
                      setOverrideReason("");
                      setOverrideError(null);
                      setOverriding(true);
                    }}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    {order.delivery.isOverridden ? "Change final charge" : "Override charge"}
                  </Button>
                )}
              </div>
            )}
          </SectionCard>
        )}

        <SectionCard
          title="Order details"
          icon={<Info className="h-4 w-4" aria-hidden="true" />}
        >
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Payment method</dt>
              <dd className="font-medium text-foreground">
                {PAYMENT_METHOD_LABELS[order.paymentMethod]}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Source</dt>
              <dd className="font-medium text-foreground">
                {ORDER_SOURCE_LABELS[order.source]}
              </dd>
            </div>
            {order.createdBy.username && (
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Created by</dt>
                <dd className="font-medium text-foreground">
                  {order.createdBy.username}
                </dd>
              </div>
            )}
          </dl>
          <Separator className="my-3" />
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                Created
              </dt>
              <dd className="text-foreground">{formatDateTime(order.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Updated
              </dt>
              <dd className="text-foreground">{formatDateTime(order.updatedAt)}</dd>
            </div>
          </dl>
        </SectionCard>
      </div>
    </div>
  );
}