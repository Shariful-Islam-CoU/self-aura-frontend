"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/providers/AuthProvider";
import {
  PurchaseDetails,
  PurchaseDialog,
  PurchaseReceiveDialog,
  PurchaseCancelDialog,
} from "@/features/purchases/components";
import { purchaseService } from "@/features/purchases/services/purchaseService";
import type {
  Purchase,
  CreatePurchaseInput,
  UpdatePurchaseInput,
} from "@/features/purchases/types";
import {
  ChevronLeft,
  CheckCircle2,
  ShoppingCart,
  X,
} from "lucide-react";

export default function PurchaseDetailsPage() {
  const params = useParams<{ id: string }>();
  const { canAccess } = useAuth();
  // Receive/cancel/edit on a purchase map to the purchase permission keys
  // (backend enforced); all authenticated roles can view purchase details.
  const canManage =
    canAccess("purchases.edit") || canAccess("purchases.receive") || canAccess("purchases.cancel");

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load the single purchase (GET /purchases/:id). The retry state bumps a
  // load key so a failed fetch can re-run the request.
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await purchaseService.getPurchase(params.id);
        if (!cancelled) {
          setPurchase(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this purchase."
          );
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [params.id, loadKey]);

  const openEdit = () => {
    setSuccessMessage(null);
    setEditOpen(true);
  };

  const openReceive = () => {
    setSuccessMessage(null);
    setReceiveOpen(true);
  };

  const openCancel = () => {
    setSuccessMessage(null);
    setCancelOpen(true);
  };

  const handleCreateOrUpdate = async (
    values: CreatePurchaseInput | UpdatePurchaseInput
  ) => {
    if (!purchase) return;
    setIsSubmitting(true);
    try {
      // Draft-only edit (backend rejects non-draft edits with 409).
      const updated = await purchaseService.updatePurchase(
        purchase.id,
        values as UpdatePurchaseInput
      );
      setPurchase(updated);
      setSuccessMessage(
        `Purchase ${updated.purchaseNumber} updated. Purchase number and totals were reassigned by the server.`
      );
      setEditOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiveConfirm = async () => {
    if (!purchase) return;
    setIsSubmitting(true);
    try {
      const received = await purchaseService.receivePurchase(purchase.id);
      setPurchase(received);
      setSuccessMessage(
        `Purchase ${received.purchaseNumber} received. Inventory was updated by the server.`
      );
      setReceiveOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!purchase) return;
    setIsSubmitting(true);
    try {
      const cancelled = await purchaseService.cancelPurchase(purchase.id);
      setPurchase(cancelled);
      setSuccessMessage(
        `Purchase ${cancelled.purchaseNumber} cancelled.`
      );
      setCancelOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/purchases">
          <Button variant="ghost" type="button">
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Back to purchases
          </Button>
        </Link>
        {purchase?.status === "draft" && canManage && (
          <Button type="button" variant="outline" onClick={openEdit}>
            Edit draft
          </Button>
        )}
      </div>

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success-foreground"
        >
          <span className="inline-flex items-center">
            <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
            {successMessage}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-full max-w-md animate-pulse rounded-md bg-muted" />
            <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      ) : error ? (
        <ErrorState
          title="Unable to load this purchase."
          description={error}
          onRetry={() => setLoadKey((key) => key + 1)}
          retryLabel="Try again"
        />
      ) : !purchase ? (
        <EmptyState
          title="Purchase not found."
          description="The purchase you are looking for may have been removed."
          icon={<ShoppingCart className="h-12 w-12" aria-hidden="true" />}
          action={
            <Link href="/purchases">
              <Button type="button" variant="outline">
                Back to purchases
              </Button>
            </Link>
          }
        />
      ) : (
        <PurchaseDetails
          purchase={purchase}
          canManage={canManage}
          isMutating={isSubmitting}
          onRequestReceive={openReceive}
          onRequestCancel={openCancel}
          onRequestEdit={openEdit}
        />
      )}

      <PurchaseDialog
        mode="edit"
        open={editOpen}
        purchase={purchase}
        isSubmitting={isSubmitting}
        onSubmit={handleCreateOrUpdate}
        onOpenChange={setEditOpen}
      />

      <PurchaseReceiveDialog
        open={receiveOpen}
        purchase={purchase}
        isSubmitting={isSubmitting}
        onConfirm={handleReceiveConfirm}
        onOpenChange={setReceiveOpen}
      />

      <PurchaseCancelDialog
        open={cancelOpen}
        purchase={purchase}
        isSubmitting={isSubmitting}
        onConfirm={handleCancelConfirm}
        onOpenChange={setCancelOpen}
      />
    </div>
  );
}
