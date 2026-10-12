import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import type { CourierListData } from "../types";
import { formatDate, toWebsiteHref } from "../utils";
import { CourierStatusBadge } from "./CourierStatusBadge";

export interface CourierTableProps {
  data: CourierListData;
  onView: (courierId: string) => void;
  renderActions?: (courierId: string) => React.ReactNode;
}

export function CourierTable({ data, onView, renderActions }: CourierTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Courier</TableHead>
            <TableHead>Contact person</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[60px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.couriers.map((courier) => {
            const websiteHref = toWebsiteHref(courier.website);
            return (
              <TableRow key={courier.id}>
                <TableCell className="font-medium">{courier.name}</TableCell>
                <TableCell>{courier.contactPerson ?? "—"}</TableCell>
                <TableCell>{courier.phone ?? "—"}</TableCell>
                <TableCell>
                  {websiteHref ? (
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {courier.website?.trim() ?? websiteHref}
                    </a>
                  ) : courier.website ? (
                    courier.website
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <CourierStatusBadge isActive={courier.isActive} />
                </TableCell>
                <TableCell>{formatDate(courier.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(courier.id)}
                    >
                      View
                    </Button>
                    {renderActions?.(courier.id)}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}