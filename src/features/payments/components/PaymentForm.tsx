import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { DialogClose } from "@/components/ui/Dialog";
import { orderService } from "@/features/orders/services/orderService";
import type { Order } from "@/features/orders/types";
import { PAYMENT_METHODS } from "../constants";
import type { CreatePaymentInput, Payment, UpdatePaymentInput } from "../types";
import { formatAmount, getPaymentMethodLabel, toDateInputValue } from "../utils";

export interface PaymentFormProps {
  mode: "create" | "edit";
  payment?: Payment | null;
  isSubmitting: boolean;
  onSubmit: (values: CreatePaymentInput | UpdatePaymentInput) => Promise<void>;
}

const todayInputValue = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Field validation mirrors the backend schemas (amount > 0 and <= 1e11,
// reference <= 200, note <= 2000, order required on create, date required);
// the backend remains the authority and its 422s are surfaced on failure.
export function PaymentForm({
  mode,
  payment,
  isSubmitting,
  onSubmit,
}: PaymentFormProps) {
  const isCreate = mode === "create";

  const [orderId, setOrderId] = useState(payment?.order.id ?? "");
  const [amount, setAmount] = useState(payment ? String(payment.amount) : "");
  const [paymentMethod, setPaymentMethod] = useState(
    payment?.paymentMethod ?? PAYMENT_METHODS[0]
  );
  const [paymentDate, setPaymentDate] = useState(
    payment ? toDateInputValue(payment.paymentDate) : todayInputValue()
  );
  const [reference, setReference] = useState(payment?.reference ?? "");
  const [note, setNote] = useState(payment?.note ?? "");

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");

  // Order picker for create (GET /orders, server-side search).
  useEffect(() => {
    if (!isCreate) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const init = async () => {
        setOrdersLoading(true);
        try {
          const data = await orderService.listOrders({
            limit: 50,
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
            setOrdersError("Unable to load orders.");
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string | undefined> = {};
    if (isCreate) {
      if (!orderId) nextErrors.order = "Select an order.";
      const parsed = Number(amount);
      if (!amount.trim()) {
        nextErrors.amount = "Amount is required.";
      } else if (Number.isNaN(parsed) || parsed <= 0) {
        nextErrors.amount = "Amount must be greater than zero.";
      } else if (parsed > 100000000000) {
        nextErrors.amount = "Amount is too large.";
      }
    }
    if (!paymentDate) nextErrors.paymentDate = "Payment date is required.";
    if (reference.trim().length > 200) {
      nextErrors.reference = "Reference must be at most 200 characters.";
    }
    if (note.trim().length > 2000) {
      nextErrors.note = "Note must be at most 2000 characters.";
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitError(null);
    try {
      if (isCreate) {
        await onSubmit({
          order: orderId,
          amount: Number(amount),
          paymentMethod,
          paymentDate,
          reference: reference.trim() || undefined,
          note: note.trim() || undefined,
        });
      } else {
        await onSubmit({
          paymentMethod,
          paymentDate,
          reference: reference.trim() || undefined,
          note: note.trim() || undefined,
        });
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to save payment.");
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

      {isCreate && (
        <>
          <div className="space-y-1.5">
            <label
              htmlFor="payment-order"
              className="block text-sm font-label text-foreground"
            >
              Order <span className="text-destructive">*</span>
            </label>
            <Input
              id="payment-order-search"
              aria-label="Search orders"
              placeholder="Search by order number..."
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              disabled={ordersLoading}
            />
            <select
              id="payment-order"
              className={selectClassName}
              value={orderId}
              onChange={(event) => {
                setOrderId(event.target.value);
                setErrors((prev) => ({ ...prev, order: undefined }));
              }}
              aria-invalid={errors.order ? "true" : "false"}
              aria-describedby={errors.order ? "payment-order-error" : undefined}
            >
              <option value="">
                {ordersLoading ? "Loading orders..." : "Select an order"}
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
              <p id="payment-order-error" className="text-sm text-destructive" role="alert">
                {errors.order}
              </p>
            )}
          </div>

          <Input
            label="Amount"
            id="payment-amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setErrors((prev) => ({ ...prev, amount: undefined }));
            }}
            error={errors.amount}
          />
        </>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="payment-method"
          className="block text-sm font-label text-foreground"
        >
          Payment method <span className="text-destructive">*</span>
        </label>
        <select
          id="payment-method"
          className={selectClassName}
          value={paymentMethod}
          onChange={(event) =>
            setPaymentMethod(
              event.target.value as (typeof PAYMENT_METHODS)[number]
            )
          }
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {getPaymentMethodLabel(method)}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Payment date"
        id="payment-date"
        type="date"
        required
        value={paymentDate}
        onChange={(event) => {
          setPaymentDate(event.target.value);
          setErrors((prev) => ({ ...prev, paymentDate: undefined }));
        }}
        error={errors.paymentDate}
      />

      <Input
        label="Reference"
        id="payment-reference"
        maxLength={200}
        placeholder="Optional transaction reference"
        value={reference}
        onChange={(event) => {
          setReference(event.target.value);
          setErrors((prev) => ({ ...prev, reference: undefined }));
        }}
        error={errors.reference}
      />

      <Textarea
        label="Note"
        id="payment-note"
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
          {isSubmitting
            ? "Saving..."
            : isCreate
              ? "Record payment"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
