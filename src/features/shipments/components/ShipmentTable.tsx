import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import type { ShipmentListData } from "../types";
import { formatAmount, formatDate } from "../utils";
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";

export interface ShipmentTableProps {
  data: ShipmentListData;
  onView: (shipmentId: string) => void;
  renderActions?: (shipmentId: string) => React.ReactNode;
}

const orderLabel = (order: ShipmentListData["shipments"][number]["order"]): string =>
  order.orderNumber || order.id;

const customerLabel = (
  customer: ShipmentListData["shipments"][number]["customer"]
): string => customer.name || customer.phone || customer.email || customer.id;

export function ShipmentTable({ data, onView, renderActions }: ShipmentTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shipment</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Courier</TableHead>
            <TableHead>Tracking</TableHead>
            <TableHead className="text-right">Charge</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[60px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.shipments.map((shipment) => (
            <TableRow key={shipment.id}>
              <TableCell className="font-medium">{shipment.shipmentNumber}</TableCell>
              <TableCell>{orderLabel(shipment.order)}</TableCell>
              <TableCell>{customerLabel(shipment.customer)}</TableCell>
              <TableCell>{shipment.courier.name ?? "—"}</TableCell>
              <TableCell>{shipment.trackingNumber ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatAmount(shipment.deliveryCharge)}
              </TableCell>
              <TableCell>
                <ShipmentStatusBadge status={shipment.status} />
              </TableCell>
              <TableCell>{formatDate(shipment.createdAt)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(shipment.id)}
                  >
                    View
                  </Button>
                  {renderActions?.(shipment.id)}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}