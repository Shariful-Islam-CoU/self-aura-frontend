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
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { formatCurrency } from "@/lib/currency";
import { EXPENSE_PAYMENT_METHOD_LABELS } from "../types";
import type {
  Expense,
  ExpenseSortBy,
  ExpenseSortOrder,
} from "../types";

export type ExpenseAction = "view" | "edit" | "delete";

interface SortIconProps {
  column: ExpenseSortBy;
  sortBy: ExpenseSortBy;
  sortOrder: ExpenseSortOrder;
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

interface ExpenseTableProps {
  expenses: Expense[];
  canManage: boolean;
  sortBy: ExpenseSortBy;
  sortOrder: ExpenseSortOrder;
  onSortChange: (column: ExpenseSortBy) => void;
  onAction: (expense: Expense, action: ExpenseAction) => void;
}

export function ExpenseTable({
  expenses,
  canManage,
  sortBy,
  sortOrder,
  onSortChange,
  onAction,
}: ExpenseTableProps) {
  const handleSort = (column: ExpenseSortBy) => onSortChange(column);

  const sortableHead = (column: ExpenseSortBy, label: string) => (
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
        <TableCaption>Expenses</TableCaption>
        <TableHeader>
          <TableRow>
            {sortableHead("expenseNumber", "Expense #")}
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Payment method</TableHead>
            {sortableHead("expenseDate", "Date")}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="whitespace-nowrap">
                <button
                  type="button"
                  className="font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  onClick={() => onAction(expense, "view")}
                >
                  {expense.expenseNumber}
                </button>
              </TableCell>
              <TableCell className="max-w-[14rem]">
                <span className="block truncate text-sm text-foreground">
                  {expense.title}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {expense.category.name ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-medium text-foreground">
                {formatCurrency(expense.amount)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant="secondary">
                  {EXPENSE_PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(expense.expenseDate)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Actions for expense ${expense.expenseNumber}`}
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{expense.expenseNumber}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onAction(expense, "view")}>
                      <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                      View details
                    </DropdownMenuItem>
                    {canManage && (
                      <>
                        <DropdownMenuItem onClick={() => onAction(expense, "edit")}>
                          <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                          Edit expense
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onAction(expense, "delete")}
                        >
                          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Delete expense
                        </DropdownMenuItem>
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

export function ExpenseTableSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-9 rounded-md border border-border" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}