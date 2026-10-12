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
import { Badge } from "@/components/ui/Badge";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Ban,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import type {
  Supplier,
  SupplierSortBy,
  SupplierSortOrder,
} from "../types";

export type SupplierAction = "view" | "edit" | "deactivate";

interface SortIconProps {
  column: SupplierSortBy;
  sortBy: SupplierSortBy;
  sortOrder: SupplierSortOrder;
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

interface SupplierTableProps {
  suppliers: Supplier[];
  canManage: boolean;
  sortBy: SupplierSortBy;
  sortOrder: SupplierSortOrder;
  onSortChange: (column: SupplierSortBy) => void;
  onAction: (supplier: Supplier, action: SupplierAction) => void;
}

export function SupplierTable({
  suppliers,
  canManage,
  sortBy,
  sortOrder,
  onSortChange,
  onAction,
}: SupplierTableProps) {
  const handleSort = (column: SupplierSortBy) => onSortChange(column);

  const sortableHead = (column: SupplierSortBy, label: string) => (
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
        <TableCaption>Suppliers</TableCaption>
        <TableHeader>
          <TableRow>
            {sortableHead("name", "Name")}
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
            {sortableHead("createdAt", "Created")}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="whitespace-nowrap">
                <button
                  type="button"
                  className="font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  onClick={() => onAction(supplier, "view")}
                >
                  {supplier.name}
                </button>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {supplier.phone}
              </TableCell>
              <TableCell className="max-w-[12rem] whitespace-nowrap">
                {supplier.email ? (
                  <span className="block truncate text-muted-foreground">{supplier.email}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="max-w-[12rem]">
                {supplier.address ? (
                  <span className="block truncate text-sm text-muted-foreground">
                    {supplier.address}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {supplier.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(supplier.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Actions for supplier ${supplier.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{supplier.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onAction(supplier, "view")}>
                      <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                      View details
                    </DropdownMenuItem>
                    {canManage && (
                      <>
                        <DropdownMenuItem onClick={() => onAction(supplier, "edit")}>
                          <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                          Edit supplier
                        </DropdownMenuItem>
                        {supplier.isActive && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onAction(supplier, "deactivate")}
                            >
                              <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
                              Deactivate supplier
                            </DropdownMenuItem>
                          </>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function SupplierTableSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-9 rounded-md border border-border" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}