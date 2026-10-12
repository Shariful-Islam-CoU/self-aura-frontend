import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { PaymentMethodBadge } from "@/features/payments/components/PaymentMethodBadge";
import { PaymentStatusBadge } from "@/features/payments/components/PaymentStatusBadge";
import { formatAmount, formatDate } from "@/features/payments/utils";
import type { LedgerEntry } from "../types";
import { LedgerTypeBadge } from "./LedgerTypeBadge";

interface LedgerTableProps {
  entries: LedgerEntry[];
  onView: (id: string) => void;
}

function partyOf(entry: LedgerEntry): string {
  const customer = entry.customer;
  if (customer && typeof customer === "object") {
    return customer.name || customer.phone || customer.id;
  }
  return "-";
}

// Chronological financial register rows straight from GET /payments.
// The sign suffix only reflects the backend's paymentType field (refund);
// no totals or balances are computed in the frontend.
export function LedgerTable({ entries, onView }: LedgerTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Party</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[70px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{formatDate(entry.paymentDate)}</TableCell>
              <TableCell className="font-medium">{entry.paymentNumber}</TableCell>
              <TableCell>
                <LedgerTypeBadge type={entry.paymentType} />
              </TableCell>
              <TableCell>{partyOf(entry)}</TableCell>
              <TableCell>{entry.order.orderNumber ?? entry.order.id}</TableCell>
              <TableCell>
                <PaymentMethodBadge method={entry.paymentMethod} />
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={entry.paymentStatus} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.paymentType === "refund"
                  ? `- ${formatAmount(entry.amount)}`
                  : formatAmount(entry.amount)}
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(entry.id)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}