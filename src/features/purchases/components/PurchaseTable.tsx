"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/LoadingState";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  PackageCheck,
  Ban,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import { formatCurrency } from "@/lib/currency";
import { PurchaseStatusBadge } from "./PurchaseStatusBadge";
import type { Purchase, PurchaseSortBy, PurchaseSortOrder } from "../types";

export type PurchaseAction = "view" | "edit" | "receive" | "cancel";

interface SortIconProps {
  column: PurchaseSortBy;
  sortBy: PurchaseSortBy;
  sortOrder: PurchaseSortOrder;
}

function SortIcon({ column, sortBy, sortOrder }: SortIconProps) {
  if (sortBy !== column) {
    return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />;
  }
  return sortOrder === "asc" ? (
    <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" aria-hidden="true" />
  ) : (
    <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" aria-hidden="true" />
  );
}

interface PurchaseTableProps {
  purchases: Purchase[];
  /** Backend create/update/receive/cancel are owner/manager only. */
  canManage: boolean;
  sortBy: PurchaseSortBy;
  sortOrder: PurchaseSortOrder;
  onSortChange: (column: PurchaseSortBy) => void;
  onAction: (purchase: Purchase, action: PurchaseAction) => void;
}

export function PurchaseTable({
  purchases,
  canManage,
  sortBy,
  sortOrder,
  onSortChange,
  onAction,
}: PurchaseTableProps) {
  const handleSort = (column: PurchaseSortBy) => onSortChange(column);

  const sortableHead = (column: PurchaseSortBy, label: string) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-accent"
      onClick={() => handleSort(column)}
      aria-sort={
        sortBy === column ? (sortOrder === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon column={column} sortBy={sortBy} sortOrder={sortOrder} />
      </span>
    </TableHead>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption>Purchases</TableCaption>
        <TableHeader>
          <TableRow>
            {sortableHead("purchaseNumber", "Purchase")}
            <TableHead>Supplier</TableHead>
            {sortableHead("purchaseDate", "Date")}
            <TableHead className="text-right">Items</TableHead>
            {sortableHead("total", "Total")}
            <TableHead>Status</TableHead>
            <TableHead>Created by</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => {
            const isDraft = purchase.status === "draft";
            const manageable = canManage && isDraft;
            return (
              <TableRow key={purchase.id}>
                <TableCell className="whitespace-nowrap">
                  <Link
                    href={`/purchases/${purchase.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {purchase.purchaseNumber}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[12rem]">
                  <p className="truncate text-sm">{purchase.supplier.name ?? "—"}</p>
                  {purchase.supplier.phone && (
                    <p className="truncate text-xs text-muted-foreground">
                      {purchase.supplier.phone}
                    </p>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(purchase.purchaseDate)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {purchase.items.length}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm font-medium">
                  {formatCurrency(purchase.total)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <PurchaseStatusBadge status={purchase.status} />
                </TableCell>
                <TableCell className="max-w-[10rem] whitespace-nowrap">
                  {purchase.createdBy.username ? (
                    <span className="block truncate text-sm text-muted-foreground">
                      {purchase.createdBy.username}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for purchase ${purchase.purchaseNumber}`}
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{purchase.purchaseNumber}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onAction(purchase, "view")}>
                        <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                        View details
                      </DropdownMenuItem>
                      {manageable && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onAction(purchase, "edit")}>
                            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                            Edit purchase
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAction(purchase, "receive")}>
                            <PackageCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                            Receive purchase
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onAction(purchase, "cancel")}
                          >
                            <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
                            Cancel purchase
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function PurchaseTableSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-9 rounded-md border border-border" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}