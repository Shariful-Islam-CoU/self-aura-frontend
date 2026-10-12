"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/LoadingState";
import { Separator } from "@/components/ui/Separator";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { formatCurrency, formatNumber } from "@/lib/currency";
import { purchaseService } from "@/features/purchases/services/purchaseService";
import { PurchaseStatusBadge } from "@/features/purchases/components/PurchaseStatusBadge";
import type { Purchase, PurchaseStatsTotals } from "@/features/purchases/types";
import type { Supplier } from "../types";
import { Phone, Mail, MapPin, StickyNote, Clock } from "lucide-react";

interface SupplierDetailsProps {
  open: boolean;
  supplier: Supplier | null;
  /** Backend /reports/purchases is owner/manager only. */
  canViewStats: boolean;
  onOpenChange: (open: boolean) => void;
}

function StatBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-0.5 truncate text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

export function SupplierDetails({
  open,
  supplier,
  canViewStats,
  onOpenChange,
}: SupplierDetailsProps) {
  const [stats, setStats] = useState<PurchaseStatsTotals | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsKey, setStatsKey] = useState(0);

  const [history, setHistory] = useState<Purchase[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const id = supplier?.id;

  // Backend-computed purchase stats (owner/manager only).
  useEffect(() => {
    if (!open || !id || !canViewStats) return;
    let cancelled = false;
    const init = async () => {
      setStatsError(null);
      try {
        const data = await purchaseService.getPurchaseStats({ supplierId: id });
        if (!cancelled) setStats(data.totals);
      } catch (err) {
        if (!cancelled) {
          setStats(null);
          setStatsError(
            err instanceof Error ? err.message : "Unable to load purchase statistics."
          );
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [open, id, canViewStats, statsKey]);

  // Read-only purchase history for this supplier (any authenticated role).
  useEffect(() => {
    if (!open || !id) return;
    let cancelled = false;
    const init = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const data = await purchaseService.listPurchases({
          supplier: id,
          limit: 5,
          sortBy: "purchaseDate",
          sortOrder: "desc",
        });
        if (!cancelled) {
          setHistory(data.purchases);
          setHistoryLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setHistory([]);
          setHistoryError(
            err instanceof Error ? err.message : "Unable to load purchase history."
          );
          setHistoryLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [open, id, historyKey]);

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {supplier.name}
            {supplier.isActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Supplier detail – created {formatDate(supplier.createdAt)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                Phone
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{supplier.phone}</p>
              {supplier.alternatePhone && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Alt: {supplier.alternatePhone}
                </p>
              )}
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                Email
              </p>
              <p className="mt-1 break-all text-sm font-medium text-foreground">
                {supplier.email ?? "—"}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Address
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {supplier.address ?? "—"}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Details
              </p>
              <p className="mt-1 text-sm text-foreground">
                Updated {formatDateTime(supplier.updatedAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                Created {formatDateTime(supplier.createdAt)}
              </p>
            </div>
          </div>

          {supplier.notes && (
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {supplier.notes}
              </p>
            </div>
          )}

          {canViewStats && (
            <section aria-label="Purchase statistics">
              <h4 className="text-sm font-semibold text-foreground">
                Purchase statistics <span className="text-xs font-normal text-muted-foreground">this month</span>
              </h4>
              {statsError ? (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                  <p className="text-muted-foreground">{statsError}</p>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    onClick={() => setStatsKey((key) => key + 1)}
                  >
                    Retry
                  </button>
                </div>
              ) : stats ? (
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatBlock title="Purchases" value={formatNumber(stats.purchaseCount)} />
                  <StatBlock title="Received" value={formatNumber(stats.receivedCount)} />
                  <StatBlock title="Draft" value={formatNumber(stats.draftCount)} />
                  <StatBlock title="Cancelled" value={formatNumber(stats.cancelledCount)} />
                  <StatBlock title="Total spent" value={formatCurrency(stats.totalSpent)} />
                  <StatBlock title="Suppliers" value={formatNumber(stats.supplierCount)} />
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-16" />
                  ))}
                </div>
              )}
            </section>
          )}

          <Separator />

          <section aria-label="Purchase history">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground">Recent purchases</h4>
              <Link
                href="/purchases"
                className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                View all purchases
              </Link>
            </div>
            {historyLoading ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : historyError ? (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                <p className="text-muted-foreground">{historyError}</p>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  onClick={() => setHistoryKey((key) => key + 1)}
                >
                  Retry
                </button>
              </div>
            ) : history.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No purchases for this supplier yet.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border rounded-md border border-border">
                {history.map((purchase) => (
                  <li
                    key={purchase.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/purchases/${purchase.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        {purchase.purchaseNumber}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDate(purchase.purchaseDate)} · {purchase.items.length} item
                        {purchase.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex flex-none items-center gap-3">
                      <PurchaseStatusBadge status={purchase.status} />
                      <span className="font-medium text-foreground">
                        {formatCurrency(purchase.total)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}