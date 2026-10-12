import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OrderDetails } from "@/features/orders/components/OrderDetails";
import type { Order } from "@/features/orders/types";

/**
 * Delivery-charge override UI tests (Step 19A) - management web.
 *
 * The override is a management-only action: the button only renders for users
 * with the `orders.overrideDeliveryCharge` permission (`canOverrideCharge`),
 * the form sends only the fee (the backend recomputes the total and audits the
 * change), the snapshot keeps showing the original calculated charge, and a
 * rejected save surfaces inline instead of pretending the change landed.
 *
 * OrderDetails is rendered with real props; `onOverrideCharge` is a spy.
 */

const order = (overrides: Record<string, unknown> = {}): Order => ({
  id: "o1",
  orderNumber: "ORD-2026-0001",
  customer: { id: "c1", name: "Rahim Uddin", phone: "01812345678" },
  items: [
    {
      id: "i1",
      product: { id: "p1" },
      productName: "Black Saree",
      sku: "SA-001",
      quantity: 2,
      unitPrice: 250,
      costPrice: 150,
      subtotal: 500,
    },
  ],
  subtotal: 500,
  discount: 20,
  deliveryCharge: 60,
  total: 540,
  paymentMethod: "cash_on_delivery",
  paymentStatus: "paid",
  orderStatus: "processing",
  shippingAddress: {
    recipientName: "Rahim",
    phone: "01812345678",
    addressLine: "House 12, Road 5",
    area: "Mirpur",
    district: "Dhaka",
    city: "Dhaka",
    postalCode: "1216",
    country: "Bangladesh",
  },
  delivery: {
    id: "z1",
    code: "DHAKA",
    name: "Dhaka City",
    baseCharge: 60,
    charge: 60,
    freeDeliveryApplied: false,
    freeDeliveryThreshold: null,
    estimatedMinDays: 1,
    estimatedMaxDays: 3,
    matchedBy: "district",
    district: "Dhaka",
    area: "",
    postalCode: "",
    calculatedCharge: 60,
    finalCharge: 60,
    isOverridden: false,
    overrideHistory: [],
  },
  coupon: undefined,
  note: undefined,
  source: "facebook",
  createdBy: { id: "u1", username: "owner", role: "owner" },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

function renderDetails({
  orderOverride = order(),
  canOverrideCharge = true,
  onOverrideCharge = async () => {},
} = {}) {
  return render(
    <OrderDetails
      order={orderOverride}
      canCancel={false}
      isUpdatingStatus={false}
      onAdvanceStatus={() => {}}
      onRequestCancel={() => {}}
      canOverrideCharge={canOverrideCharge}
      onOverrideCharge={onOverrideCharge}
    />
  );
}

afterEach(() => {
  cleanup();
});

describe("OrderDetails deliver card — override UI", () => {
  it("hides the override button without the permission", () => {
    renderDetails({ canOverrideCharge: false });
    expect(screen.queryByRole("button", { name: /Override charge/ })).toBeNull();
  });

  it("shows a single Charge row for a rule-priced order", () => {
    renderDetails();
    expect(screen.getByText("Charge")).toBeTruthy();
    expect(screen.queryByText("Calculated charge")).toBeNull();
    expect(screen.getByRole("button", { name: /Override charge/ })).toBeTruthy();
  });

  it("submits only the fee + reason to the backend override handler", async () => {
    const onOverrideCharge = vi.fn(async () => {});
    renderDetails({ onOverrideCharge });

    fireEvent.click(screen.getByRole("button", { name: /Override charge/ }));

    fireEvent.change(screen.getByLabelText("Final charge"), {
      target: { value: "40" },
    });
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Agreed discount" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save override/ }));

    await waitFor(() => {
      expect(onOverrideCharge).toHaveBeenCalledTimes(1);
    });
    expect(onOverrideCharge).toHaveBeenCalledWith(40, "Agreed discount");
    // The form closes after a successful save.
    expect(screen.queryByLabelText("Final charge")).toBeNull();
  });

  it("rejects a negative fee without calling the backend", () => {
    const onOverrideCharge = vi.fn(async () => {});
    renderDetails({ onOverrideCharge });

    fireEvent.click(screen.getByRole("button", { name: /Override charge/ }));

    fireEvent.change(screen.getByLabelText("Final charge"), {
      target: { value: "-5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save override/ }));

    expect(onOverrideCharge).not.toHaveBeenCalled();
    expect(
      screen.getByText("Final charge must be a number of 0 or more.")
    ).toBeTruthy();
  });

  it("surfaces a failed save inline and keeps the form open", async () => {
    const onOverrideCharge = vi.fn(async () => {
      throw new Error("backend 400");
    });
    renderDetails({ onOverrideCharge });

    fireEvent.click(screen.getByRole("button", { name: /Override charge/ }));
    fireEvent.change(screen.getByLabelText("Final charge"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save override/ }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Could not save the override");
    expect(screen.getByLabelText("Final charge")).toBeTruthy();
  });

  it("shows calculated vs final charge for an overridden order", () => {
    renderDetails({
      orderOverride: order({
        delivery: {
          ...order().delivery,
          calculatedCharge: 60,
          finalCharge: 40,
          isOverridden: true,
          overrideReason: "Customer discount agreed",
          overriddenBy: "manager",
          overriddenAt: "2026-01-02T00:00:00.000Z",
          overrideHistory: [
            {
              previousCharge: 60,
              newCharge: 40,
              reason: "Customer discount agreed",
              by: "manager",
              at: "2026-01-02T00:00:00.000Z",
            },
          ],
        },
      }),
    });

    expect(screen.getByText("Calculated charge")).toBeTruthy();
    expect(screen.getByText("Final charge")).toBeTruthy();
    expect(screen.getByText("Override reason")).toBeTruthy();
    expect(screen.getByText(/Customer discount agreed/)).toBeTruthy();
    expect(screen.getByText(/manager/)).toBeTruthy();
    // Button label switches to editing the existing override.
    expect(screen.getByRole("button", { name: /Change final charge/ })).toBeTruthy();
  });
});