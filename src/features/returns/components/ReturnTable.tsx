import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import type { ReturnListData } from "../types";
import { formatAmount, formatDate, getReturnReasonLabel } from "../utils";
import { RefundStatusBadge, ReturnStatusBadge } from "./ReturnStatusBadge";

export interface ReturnTableProps {
  data: ReturnListData;
  onView: (returnId: string) => void;
  renderActions?: (returnId: string) => React.ReactNode;
}

function toDisplayCustomer(returnRecord: ReturnListData["returns"][number]): string {
  const customer = returnRecord.customer;
  if (customer && typeof customer === "object") {
    return customer.name || customer.phone || customer.id;
  }
  return "-";
}

export function ReturnTable({ data, onView, renderActions }: ReturnTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Return no.</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Return date</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="text-right">Refund amount</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Refund</TableHead>
            <TableHead>Created by</TableHead>
            <TableHead className="w-[60px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.returns.map((returnRecord) => (
            <TableRow key={returnRecord.id}>
              <TableCell className="font-medium">{returnRecord.returnNumber}</TableCell>
              <TableCell>{returnRecord.order.orderNumber ?? returnRecord.order.id}</TableCell>
              <TableCell>{toDisplayCustomer(returnRecord)}</TableCell>
              <TableCell>{formatDate(returnRecord.returnDate)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {returnRecord.items.length}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(returnRecord.refundAmount)}
              </TableCell>
              <TableCell>{getReturnReasonLabel(returnRecord.reason)}</TableCell>
              <TableCell>
                <ReturnStatusBadge status={returnRecord.status} />
              </TableCell>
              <TableCell>
                <RefundStatusBadge status={returnRecord.refundStatus} />
              </TableCell>
              <TableCell>
                {returnRecord.createdBy.username ?? returnRecord.createdBy.id}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(returnRecord.id)}
                  >
                    View
                  </Button>
                  {renderActions?.(returnRecord.id)}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}