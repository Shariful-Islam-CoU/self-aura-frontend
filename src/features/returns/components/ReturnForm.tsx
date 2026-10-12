import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { DialogClose } from "@/components/ui/Dialog";
import { orderService } from "@/features/orders/services/orderService";
import type { Order } from "@/features/orders/types";
import { RETURNABLE_ORDER_STATUS, RETURN_REASONS } from "../constants";
import type {
  CreateReturnData,
  Return,
  ReturnItemDraft,
  ReturnReason,
  UpdateReturnData,
} from "../types";
import { formatAmount, getReturnReasonLabel, toDateInputValue } from "../utils";
import { ReturnItemsEditor } from "./ReturnItemsEditor";

export interface ReturnFormProps {
  mode: "create" | "edit";
  returnRecord?: Return | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateReturnData | UpdateReturnData) => Promise<void>;
}

const todayInputValue = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const toDraft = (
  order: Order,
  seed?: Return["items"]
): ReturnItemDraft[] => {
  if (seed && seed.length > 0) {
    const byId = new Map(order.items.map((item) => [item.product.id, item]));
    return seed.map((item) => {
      const orderItem = byId.get(item.product.id);
      return {
        product: item.product.id,
        productName: orderItem?.productName ?? item.productName,
        sku: orderItem?.sku ?? item.sku,
        orderedQuantity: orderItem?.quantity ?? item.quantity,
        unitPrice: orderItem?.unitPrice ?? item.unitPrice,
        quantity: item.quantity,
        reason: item.reason,
        condition: item.condition,
        included: true,
      };
    });
  }
  return order.items.map((item) => ({
    product: item.product.id,
    productName: item.productName,
    sku: item.sku,
    orderedQuantity: item.quantity,
    unitPrice: item.unitPrice,
    quantity: 1,
    reason: "other",
    condition: "other",
    included: true,
  }));
};

// Create/edit form. All quantities are bounded only as UX hints; refund
// amounts and remaining returnable quantities are decided by the backend.
export function ReturnForm({
  mode,
  returnRecord,
  isSubmitting,
  onSubmit,
}: ReturnFormProps) {
  const isCreate = mode === "create";

  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");

  const [items, setItems] = useState<ReturnItemDraft[]>([]);
  const [orderInfo, setOrderInfo] = useState<Order | null>(null);
  const [orderDetailsError, setOrderDetailsError] = useState<string | null>(null);

  // The dialog remounts this form per record (key includes the return id), so
  // these initializers seed edit mode on mount and nothing leaks between opens.
  const [reason, setReason] = useState<ReturnReason>(
    returnRecord?.reason ?? "other"
  );
  const [note, setNote] = useState(returnRecord?.note ?? "");
  const [returnDate, setReturnDate] = useState(
    returnRecord ? toDateInputValue(returnRecord.returnDate) : todayInputValue()
  );

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Order picker: only delivered orders are returnable (backend rule).
  useEffect(() => {
    if (!isCreate) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const init = async () => {
        setOrdersLoading(true);
        try {
          const data = await orderService.listOrders({
            limit: 50,
            status: RETURNABLE_ORDER_STATUS,
            search: orderSearch.trim() || undefined,
            sortBy: "createdAt",
            sortOrder: "desc",
          });
          if (!cancelled) {
            setOrders(data.orders);
            setOrdersError(null);
            setOrdersLoading(false);
          }
        } catch {
          if (!cancelled) {
            setOrdersError("Unable to load delivered orders.");
            setOrdersLoading(false);
          }
        }
      };
      void init();
    }, orderSearch.trim() ? 350 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isCreate, orderSearch]);

  // Edit mode: the freshest order record gives ordered-quantity bounds; fall
  // back to the return's own item data. Field values themselves are seeded by
  // the state initializers (the dialog remounts the form per record).
  useEffect(() => {
    if (mode !== "edit" || !returnRecord) return;
    let cancelled = false;
    const init = async () => {
      try {
        const order = await orderService.getOrder(returnRecord.order.id);
        if (!cancelled) {
          setOrderInfo(order);
          setItems(toDraft(order, returnRecord.items));
          setOrderDetailsError(null);
        }
      } catch {
        if (!cancelled) {
          setItems(
            returnRecord.items.map((item) => ({
              product: item.product.id,
              productName: item.productName,
              sku: item.sku,
              orderedQuantity: item.quantity,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              reason: item.reason,
              condition: item.condition,
              included: true,
            }))
          );
          setOrderDetailsError("Order details unavailable; quantity limits reflect the current return only.");
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [mode, returnRecord]);

  const handleOrderSelect = async (selected: string) => {
    setOrderId(selected);
    setItems([]);
    setOrderInfo(null);
    setOrderDetailsError(null);
    setErrors((prev) => ({ ...prev, order: undefined, items: undefined }));
    if (!selected) return;
    try {
      const order = await orderService.getOrder(selected);
      setOrderInfo(order);
      setItems(toDraft(order));
    } catch {
      setOrderDetailsError("Unable to load that order's items.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string | undefined> = {};
    const included = items.filter((item) => item.included);

    if (isCreate && !orderId) {
      nextErrors.order = "Select an order to return against.";
    }
    if (included.length === 0) {
      nextErrors.items = "Select at least one item to return.";
    }
    for (const item of included) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        nextErrors[item.product] = "Quantity must be a whole number, at least 1.";
      } else if (item.quantity > 9999) {
        nextErrors[item.product] = "Quantity must be at most 9999.";
      } else if (item.quantity > item.orderedQuantity) {
        nextErrors[item.product] = `Cannot exceed the ordered quantity (${item.orderedQuantity}).`;
      }
    }
    if (!returnDate) {
      nextErrors.returnDate = "Return date is required.";
    }
    if (note.trim().length > 2000) {
      nextErrors.note = "Note must be at most 2000 characters.";
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const payloadItems = included.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      reason: item.reason,
      condition: item.condition,
    }));

    setSubmitError(null);
    try {
      if (isCreate) {
        await onSubmit({
          order: orderId,
          items: payloadItems,
          reason,
          note: note.trim() || undefined,
          returnDate: returnDate || undefined,
        });
      } else {
        await onSubmit({
          reason,
          note: note.trim() || undefined,
          returnDate: returnDate || undefined,
          items: payloadItems,
        });
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to save return.");
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

      {isCreate ? (
        <>
          <div className="space-y-1.5">
            <label htmlFor="return-order" className="block text-sm font-label text-foreground">
              Order <span className="text-destructive">*</span>
            </label>
            <Input
              id="return-order-search"
              aria-label="Search delivered orders"
              placeholder="Search delivered order numbers..."
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              disabled={ordersLoading}
            />
            <select
              id="return-order"
              className={selectClassName}
              value={orderId}
              onChange={(event) => void handleOrderSelect(event.target.value)}
              aria-invalid={errors.order ? "true" : "false"}
              aria-describedby={errors.order ? "return-order-error" : undefined}
            >
              <option value="">
                {ordersLoading ? "Loading delivered orders..." : "Select a delivered order"}
              </option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customer.name ?? "Customer"} -{" "}
                  {formatAmount(order.total)}
                </option>
              ))}
            </select>
            {ordersError && (
              <p className="text-sm text-destructive" role="alert">
                {ordersError}
              </p>
            )}
            {errors.order && (
              <p id="return-order-error" className="text-sm text-destructive" role="alert">
                {errors.order}
              </p>
            )}
            {orderDetailsError && (
              <p className="text-sm text-destructive" role="alert">
                {orderDetailsError}
              </p>
            )}
          </div>

          {orderInfo && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <span className="font-medium">{orderInfo.orderNumber}</span>
              <span className="text-muted-foreground">
                {" "}
                · {orderInfo.customer.name ?? "Customer"} ·{" "}
                {orderInfo.orderStatus} · {formatAmount(orderInfo.total)}
              </span>
            </div>
          )}
        </>
      ) : (
        returnRecord && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            <span className="font-medium">{returnRecord.returnNumber}</span>
            <span className="text-muted-foreground">
              {" "}
              · order {returnRecord.order.orderNumber ?? returnRecord.order.id}
            </span>
          </div>
        )
      )}

      {items.length > 0 ? (
        <ReturnItemsEditor items={items} onChange={setItems} errors={errors} disabled={isSubmitting} />
      ) : (
        <p className="text-sm text-muted-foreground" role="status">
          {isCreate ? "Select an order to load its items." : "Loading return items..."}
        </p>
      )}
      {errors.items && (
        <p className="text-sm text-destructive" role="alert">
          {errors.items}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="return-reason" className="block text-sm font-label text-foreground">
          Reason <span className="text-destructive">*</span>
        </label>
        <select
          id="return-reason"
          className={selectClassName}
          value={reason}
          onChange={(event) => setReason(event.target.value as ReturnReason)}
        >
          {RETURN_REASONS.map((option) => (
            <option key={option} value={option}>
              {getReturnReasonLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Return date"
        id="return-date-input"
        type="date"
        required
        value={returnDate}
        onChange={(event) => {
          setReturnDate(event.target.value);
          setErrors((prev) => ({ ...prev, returnDate: undefined }));
        }}
        error={errors.returnDate}
      />

      <Textarea
        label="Note"
        id="return-note-input"
        maxLength={2000}
        placeholder="Optional note"
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          setErrors((prev) => ({ ...prev, note: undefined }));
        }}
        error={errors.note}
      />

      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isCreate ? "Create return" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}