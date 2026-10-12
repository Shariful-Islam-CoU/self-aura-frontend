"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/LoadingState";
import { useAuth } from "@/providers/AuthProvider";
import {
  OrderDetails,
  OrderCancelDialog,
  ORDER_STATUS_LABELS,
} from "@/features/orders/components";
import { orderService } from "@/features/orders/services/orderService";
import type { Order, OrderStatus } from "@/features/orders/types";
import { ArrowLeft, ShoppingCart, X } from "lucide-react";

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { canAccess } = useAuth();
  const canCancel = canAccess("orders.cancel");
  const canOverrideCharge = canAccess("orders.overrideDeliveryCharge");

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isMutating, setIsMutating] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      // Missing/falsy id (e.g. visiting /orders/undefined) shows the
      // not-found state instead of an eternal loading skeleton.
      if (!id) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await orderService.getOrder(id);
        if (!cancelled) {
          setOrder(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load the order.");
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  const handleAdvanceStatus = async (next: OrderStatus) => {
    if (!order) return;
    setIsMutating(true);
    setFeedback(null);
    try {
      const updated = await orderService.updateOrderStatus(order.id, next);
      setOrder(updated);
      setFeedback({
        type: "success",
        message: `Order ${updated.orderNumber} marked as ${ORDER_STATUS_LABELS[next]}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update the order status.",
      });
    } finally {
      setIsMutating(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!order) return;
    setIsMutating(true);
    try {
      const updated = await orderService.cancelOrder(order.id);
      setOrder(updated);
      setFeedback({
        type: "success",
        message: `Order ${updated.orderNumber} cancelled. Stock was restored by the server.`,
      });
    } finally {
      setIsMutating(false);
    }
  };

  // Delivery-charge override (owner/manager). Rejects on failure so the inline
  // editor in OrderDetails can surface the error; the backend recomputes totals.
  const handleOverrideCharge = async (finalCharge: number, reason?: string) => {
    if (!order) return;
    try {
      const updated = await orderService.overrideDeliveryCharge(order.id, {
        finalCharge,
        reason,
      });
      setOrder(updated);
      setFeedback({
        type: "success",
        message: `Order ${updated.orderNumber} delivery charge set to ${finalCharge}.`,
      });
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error("Failed to override the delivery charge.");
    }
  };

  const feedbackStyle =
    feedback?.type === "success"
      ? "border-success/30 bg-success/10 text-success-foreground"
      : "border-destructive/30 bg-destructive/10 text-destructive";

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/orders">Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{order?.orderNumber ?? "Order"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to orders
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Order {order?.orderNumber ?? ""}
          </h1>
        </div>
      </div>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${feedbackStyle}`}
        >
          <span>{feedback.message}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load the order."
          description={error}
          onRetry={() => setRefreshKey((key) => key + 1)}
          retryLabel="Try again"
        />
      ) : order ? (
        <>
          <OrderDetails
            order={order}
            canCancel={canCancel}
            isUpdatingStatus={isMutating}
            onAdvanceStatus={(next) => void handleAdvanceStatus(next)}
            onRequestCancel={() => setCancelOpen(true)}
            canOverrideCharge={canOverrideCharge}
            onOverrideCharge={handleOverrideCharge}
          />
          <OrderCancelDialog
            open={cancelOpen}
            order={order}
            isSubmitting={isMutating}
            onConfirm={handleCancelConfirm}
            onOpenChange={setCancelOpen}
          />
        </>
      ) : (
        <EmptyState
          title="Order not found."
          description="The order you are looking for may have been removed."
          icon={<ShoppingCart className="h-12 w-12" aria-hidden="true" />}
          action={
            <Link href="/orders">
              <Button type="button" variant="outline">
                Back to orders
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}