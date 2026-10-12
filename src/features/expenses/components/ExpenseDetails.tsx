"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { formatCurrency } from "@/lib/currency";
import { EXPENSE_PAYMENT_METHOD_LABELS } from "../types";
import type { Expense } from "../types";
import { Hash, Tag, DollarSign, CalendarDays, CreditCard, Paperclip, Clock, AlignLeft, StickyNote } from "lucide-react";

interface ExpenseDetailsProps {
  open: boolean;
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseDetails({ open, expense, onOpenChange }: ExpenseDetailsProps) {
  if (!expense) return null;

  const detailItems = [
    {
      icon: Hash,
      label: "Expense number",
      value: expense.expenseNumber,
    },
    {
      icon: Tag,
      label: "Title",
      value: expense.title,
    },
    {
      icon: DollarSign,
      label: "Amount",
      value: formatCurrency(expense.amount),
    },
    {
      icon: CalendarDays,
      label: "Expense date",
      value: formatDate(expense.expenseDate),
    },
    {
      icon: CreditCard,
      label: "Payment method",
      value: EXPENSE_PAYMENT_METHOD_LABELS[expense.paymentMethod],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {expense.expenseNumber}
            <Badge variant="secondary">
              {expense.category.name ?? "Uncategorized"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Recorded {formatDateTime(expense.createdAt)}
            {expense.createdBy.username ? ` by ${expense.createdBy.username}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {detailItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-md border border-border p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                Reference
              </p>
              <p className="mt-1 break-words text-sm text-foreground">
                {expense.reference ?? "—"}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Updated
              </p>
              <p className="mt-1 text-sm text-foreground">{formatDateTime(expense.updatedAt)}</p>
            </div>
          </div>

          {expense.description && (
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlignLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Description
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {expense.description}
              </p>
            </div>
          )}

          {expense.note && (
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
                Note
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {expense.note}
              </p>
            </div>
          )}

          <Separator />

          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {expense.category.name ?? "Uncategorized"}
              {expense.category.isActive === false && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (inactive category)
                </span>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}