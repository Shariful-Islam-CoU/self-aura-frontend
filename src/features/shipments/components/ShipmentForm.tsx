import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { DialogClose } from "@/components/ui/Dialog";
import { orderService } from "@/features/orders";
import type { Order } from "@/features/orders/types";
import { courierService } from "@/features/couriers";
import type { Courier } from "@/features/couriers/types";
import { SHIPPABLE_ORDER_STATUSES } from "../constants";
import type {
  CreateShipmentData,
  Shipment,
  UpdateShipmentData,
} from "../types";
import { formatAmount } from "../utils";

export interface ShipmentFormProps {
  mode: "create" | "edit";
  shipment?: Shipment | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateShipmentData | UpdateShipmentData) => Promise<void>;
}

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const orderStatusLabel = (status: Order["orderStatus"]): string => {
  const labels: Record<Order["orderStatus"], string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    ready_to_ship: "Ready to ship",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
  };
  return labels[status] ?? status;
};

// Create/edit shipment form. Validation mirrors createShipmentSchema /
// updateShipmentSchema. The order is pickable only from the backend-defined
// shippable order statuses and is NOT editable on update (backend rule); the
// courier list is the real active-courier API response (never hardcoded); the
// tracking number is user-provided only - the backend never generates one.
export function ShipmentForm({
  mode,
  shipment,
  isSubmitting,
  onSubmit,
}: ShipmentFormProps) {
  const [courierId, setCourierId] = useState(mode === "edit" && shipment ? shipment.courier.id : "");
  const [trackingNumber, setTrackingNumber] = useState(
    mode === "edit" && shipment ? (shipment.trackingNumber ?? "") : ""
  );
  const [deliveryCharge, setDeliveryCharge] = useState(
    mode === "edit" && shipment ? String(shipment.deliveryCharge) : ""
  );
  const [note, setNote] = useState(
    mode === "edit" && shipment ? (shipment.note ?? "") : ""
  );

  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [couriersLoading, setCouriersLoading] = useState(true);
  const [couriersError, setCouriersError] = useState<string | null>(null);

  const [orderSearch, setOrderSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Active couriers only - inactive couriers are rejected by the backend.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setCouriersLoading(true);
      setCouriersError(null);
      try {
        const data = await courierService.listCouriers({
          limit: 100,
          isActive: true,
          sortBy: "name",
          sortOrder: "asc",
        });
        if (!cancelled) {
          setCouriers(data.couriers);
          setCouriersLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setCouriersError(
            err instanceof Error ? err.message : "Unable to load couriers."
          );
          setCouriersLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Eligible order picker: only the backend-defined shippable order statuses
  // are offered (one list call per status, merged and de-duplicated). The
  // server re-validates eligibility on submit.
  useEffect(() => {
    if (mode !== "create") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const load = async () => {
        setOrdersLoading(true);
        setOrdersError(null);
        try {
          const results = await Promise.all(
            SHIPPABLE_ORDER_STATUSES.map((status) =>
              orderService.listOrders({
                page: 1,
                limit: 50,
                search: orderSearch.trim() || undefined,
                status,
                sortBy: "createdAt",
                sortOrder: "desc",
              })
            )
          );
          if (cancelled) return;
          const seen = new Set<string>();
          const merged: Order[] = [];
          for (const result of results) {
            for (const order of result.orders) {
              if (!seen.has(order.id)) {
                seen.add(order.id);
                merged.push(order);
              }
            }
          }
          merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setOrders(merged);
          setOrdersLoading(false);
        } catch (err) {
          if (!cancelled) {
            setOrdersError(
              err instanceof Error ? err.message : "Unable to load eligible orders."
            );
            setOrdersLoading(false);
          }
        }
      };
      void load();
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mode, orderSearch]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    // Backend uses the order's delivery charge when none is provided; prefill
    // it as a hint (the submitted value is still validated by the server).
    setDeliveryCharge(String(order.deliveryCharge));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string | undefined> = {};
    if (mode === "create" && !selectedOrder) {
      nextErrors.order = "Select an order to ship.";
    }
    if (!courierId) {
      nextErrors.courier = "Select a courier.";
    }
    const chargeText = deliveryCharge.trim();
    if (chargeText) {
      const parsed = Number(chargeText);
      if (!Number.isFinite(parsed)) {
        nextErrors.deliveryCharge = "Must be a number.";
      } else if (parsed < 0) {
        nextErrors.deliveryCharge = "Must be at least 0.";
      } else if (parsed > 99999999) {
        nextErrors.deliveryCharge = "Must be at most 99999999.";
      }
    }
    if (trackingNumber.trim().length > 100) {
      nextErrors.trackingNumber = "Must be at most 100 characters.";
    }
    if (note.trim().length > 2000) {
      nextErrors.note = "Must be at most 2000 characters.";
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const payload: CreateShipmentData | UpdateShipmentData = {
      courier: courierId,
      trackingNumber: trackingNumber.trim() || undefined,
      deliveryCharge: chargeText ? Number(chargeText) : undefined,
      note: note.trim() || undefined,
      ...(mode === "create" && selectedOrder ? { order: selectedOrder.id } : {}),
    };

    setSubmitError(null);
    try {
      await onSubmit(payload);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to save shipment.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {submitError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {submitError}
        </div>
      )}

      {mode === "create" && (
        <div className="space-y-2">
          <label htmlFor="shipment-order-search" className="block text-sm font-label text-foreground">
            Order
          </label>
          <Input
            id="shipment-order-search"
            placeholder="Search by order number"
            value={orderSearch}
            onChange={(event) => setOrderSearch(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Only orders in shippable statuses are offered (server-defined list).
            The server re-validates eligibility when you save.
          </p>

          {ordersLoading ? (
            <div className="space-y-2">
              <div className="h-9 animate-pulse rounded-md bg-muted" />
              <div className="h-9 animate-pulse rounded-md bg-muted" />
              <div className="h-9 animate-pulse rounded-md bg-muted" />
            </div>
          ) : ordersError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {ordersError}
            </div>
          ) : orders.length === 0 ? (
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {orderSearch.trim()
                ? "No eligible orders match that search."
                : "No shippable orders found."}
            </p>
          ) : (
            <div
              role="radiogroup"
              aria-label="Select order"
              className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-border p-2"
            >
              {orders.map((order) => (
                <label
                  key={order.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-2 transition-colors ${
                    selectedOrder?.id === order.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="shipment-order"
                    value={order.id}
                    checked={selectedOrder?.id === order.id}
                    onChange={() => handleSelectOrder(order)}
                    className="mt-1"
                  />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate font-medium">
                      {order.orderNumber} — {order.customer.name ?? order.customer.id}
                    </span>
                    <span className="block truncate text-muted-foreground">
                      {orderStatusLabel(order.orderStatus)} · {formatAmount(order.total)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {selectedOrder && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{selectedOrder.orderNumber}</p>
              <p className="text-muted-foreground">
                {selectedOrder.customer.name ?? "Customer"} —{" "}
                {formatAmount(selectedOrder.total)} ·{" "}
                {orderStatusLabel(selectedOrder.orderStatus)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Backend copies the order&apos;s shipping address; it cannot be
                changed here.
              </p>
            </div>
          )}
          {errors.order && (
            <p className="text-sm text-destructive" role="alert">
              {errors.order}
            </p>
          )}
        </div>
      )}

      {mode === "edit" && shipment && (
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <p className="font-medium">{shipment.shipmentNumber}</p>
          <p className="text-muted-foreground">
            Order {shipment.order.orderNumber ?? shipment.order.id} ·{" "}
            {shipment.customer.name ?? shipment.customer.id} ·{" "}
            {formatAmount(shipment.order.total ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The linked order cannot be changed on an existing shipment (backend
            rule).
          </p>
        </div>
      )}

      <div>
        <label htmlFor="shipment-courier" className="block text-sm font-label text-foreground mb-1.5">
          Courier
        </label>
        <select
          id="shipment-courier"
          className={selectClassName}
          value={courierId}
          onChange={(event) => {
            setCourierId(event.target.value);
            setErrors((prev) => ({ ...prev, courier: undefined }));
          }}
        >
          <option value="" disabled>
            {couriersLoading ? "Loading couriers..." : "Select courier"}
          </option>
          {couriers.map((courier) => (
            <option key={courier.id} value={courier.id}>
              {courier.name}
            </option>
          ))}
        </select>
        {couriersError && (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {couriersError}
          </p>
        )}
        {errors.courier && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {errors.courier}
          </p>
        )}
      </div>

      <Input
        label="Tracking number"
        id="shipment-tracking-input"
        maxLength={100}
        value={trackingNumber}
        onChange={(event) => {
          setTrackingNumber(event.target.value);
          setErrors((prev) => ({ ...prev, trackingNumber: undefined }));
        }}
        error={errors.trackingNumber}
        placeholder="Optional, entered manually"
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        Tracking numbers are never generated by the app - the backend stores
        exactly what you enter.
      </p>

      <Input
        label="Delivery charge"
        id="shipment-charge-input"
        type="number"
        min={0}
        max={99999999}
        step="0.01"
        value={deliveryCharge}
        onChange={(event) => {
          setDeliveryCharge(event.target.value);
          setErrors((prev) => ({ ...prev, deliveryCharge: undefined }));
        }}
        error={errors.deliveryCharge}
        placeholder="৳"
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        Leave empty to use the order&apos;s delivery charge (the server decides).
      </p>

      <Textarea
        label="Note"
        id="shipment-note-input"
        maxLength={2000}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        error={errors.note}
      />

      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : mode === "create" ? "Create shipment" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}