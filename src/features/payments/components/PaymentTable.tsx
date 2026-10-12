import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { MoreHorizontal } from "lucide-react";
import type { PaymentListData } from "../types";
import { formatAmount, formatDate } from "../utils";
import { PaymentMethodBadge } from "./PaymentMethodBadge";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PaymentTypeBadge } from "./PaymentTypeBadge";

interface PaymentTableProps {
  data: PaymentListData;
  onView: (paymentId: string) => void;
  renderActions?: (paymentId: string) => React.ReactNode;
}

function toDisplayCustomer(payment: PaymentListData["payments"][number]): string {
  const customer = payment.customer;
  if (customer && typeof customer === "object") {
    return customer.name || customer.phone || customer.id;
  }
  return "-";
}

export function PaymentTable({ data, onView, renderActions }: PaymentTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment no.</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
              <TableCell>{toDisplayCustomer(payment)}</TableCell>
              <TableCell>
                <PaymentTypeBadge type={payment.paymentType} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(payment.amount)}
              </TableCell>
              <TableCell>
                <PaymentMethodBadge method={payment.paymentMethod} />
              </TableCell>
              <TableCell>{formatDate(payment.paymentDate)}</TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.paymentStatus} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(payment.id)}
                  >
                    View
                  </Button>
                  {renderActions?.(payment.id) ?? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Actions for ${payment.paymentNumber}`}
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}