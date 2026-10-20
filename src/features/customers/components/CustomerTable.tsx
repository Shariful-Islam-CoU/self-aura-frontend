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
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
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
  UserX,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import type { Customer, CustomerSortBy, CustomerSortOrder } from "../types";

interface SortIconProps {
  column: CustomerSortBy;
  sortBy: CustomerSortBy;
  sortOrder: CustomerSortOrder;
}

function SortIcon({ column, sortBy, sortOrder }: SortIconProps) {
  if (sortBy !== column) {
    return (
      <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
    );
  }
  return sortOrder === "asc" ? (
    <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" aria-hidden="true" />
  ) : (
    <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" aria-hidden="true" />
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function primaryAddress(customer: Customer) {
  return customer.addresses.find((address) => address.isDefault) ?? customer.addresses[0];
}

export type CustomerAction = "view" | "edit" | "deactivate";

interface CustomerTableProps {
  customers: Customer[];
  canDeactivate: boolean;
  sortBy: CustomerSortBy;
  sortOrder: CustomerSortOrder;
  onSortChange: (column: CustomerSortBy) => void;
  onAction: (customer: Customer, action: CustomerAction) => void;
}

export function CustomerTable({
  customers,
  canDeactivate,
  sortBy,
  sortOrder,
  onSortChange,
  onAction,
}: CustomerTableProps) {
  const handleSort = (column: CustomerSortBy) => onSortChange(column);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption>Customer accounts</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none hover:bg-accent"
              onClick={() => handleSort("name")}
              aria-sort={sortBy === "name" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              <span className="inline-flex items-center">
                Customer
                <SortIcon column="name" sortBy={sortBy} sortOrder={sortOrder} />
              </span>
            </TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-accent"
              onClick={() => handleSort("createdAt")}
              aria-sort={sortBy === "createdAt" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              <span className="inline-flex items-center">
                Created
                <SortIcon column="createdAt" sortBy={sortBy} sortOrder={sortOrder} />
              </span>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const address = primaryAddress(customer);
            return (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar src={customer.avatarUrl} name={customer.name} size="sm" />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onAction(customer, "view")}
                        className="block max-w-[16rem] truncate font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm text-left"
                      >
                        {customer.name}
                      </button>
                      {customer.email && (
                        <p className="truncate text-xs text-muted-foreground">
                          {customer.email}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">{customer.phone}</TableCell>
                <TableCell className="max-w-[14rem]">
                  {address ? (
                    <>
                      <p className="truncate text-sm">{address.addressLine}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[address.district, address.area, address.city]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={customer.isActive ? "success" : "secondary"}>
                    {customer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(customer.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for ${customer.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Customer</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onAction(customer, "view")}>
                        <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction(customer, "edit")}>
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                        Edit customer
                      </DropdownMenuItem>
                      {canDeactivate && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onAction(customer, "deactivate")}
                          >
                            <UserX className="mr-2 h-4 w-4" aria-hidden="true" />
                            Deactivate
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

export function CustomerTableSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-9 rounded-md border border-border" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-3">
          <Skeleton variant="circular" className="h-9 w-9" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}