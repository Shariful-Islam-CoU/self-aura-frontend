"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { ApiError } from "@/lib/api";
import { customerService } from "@/features/customers/services/customerService";
import { productService } from "@/features/products/services/productService";
import { SearchableListbox } from "./SearchableListbox";
import { OrderItemsEditor } from "./OrderItemsEditor";
import { OrderSummary } from "./OrderSummary";
import { PAYMENT_METHOD_LABELS, ORDER_SOURCE_LABELS } from "./OrderStatusBadge";
import type { Customer } from "@/features/customers/types";
import type { Product } from "@/features/products/types";
import { PAYMENT_METHODS, ORDER_SOURCES } from "../types";
import type {
  CreateOrderInput,
  DraftOrderItem,
  OrderSource,
  PaymentMethod,
} from "../types";

const PHONE_DIGITS_MIN = 7;

interface ShippingFormValues {
  recipientName: string;
  phone: string;
  addressLine: string;
  area: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
}

interface OrderFormValues {
  paymentMethod: PaymentMethod;
  source: OrderSource;
  shippingAddress: ShippingFormValues;
  note: string;
}

interface OrderFormErrors {
  customer?: string;
  items?: string;
  note?: string;
  addressLine?: string;
  district?: string;
  city?: string;
  phone?: string;
  recipientName?: string;
  area?: string;
  postalCode?: string;
  country?: string;
}

interface OrderFormProps {
  isSubmitting: boolean;
  onSubmit: (values: CreateOrderInput) => Promise<void>;
  onCancel: () => void;
}

const isValidPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 0 || digits.length >= PHONE_DIGITS_MIN;
};

const emptyShippingAddress = (): ShippingFormValues => ({
  recipientName: "",
  phone: "",
  addressLine: "",
  area: "",
  district: "",
  city: "",
  postalCode: "",
  country: "Bangladesh",
});

let itemKeyCounter = 0;
const nextItemKey = (): string => `item-${++itemKeyCounter}`;

export function OrderForm({ isSubmitting, onSubmit, onCancel }: OrderFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [productSearching, setProductSearching] = useState(false);

  const [items, setItems] = useState<DraftOrderItem[]>([]);
  const [values, setValues] = useState<OrderFormValues>({
    paymentMethod: "cash_on_delivery",
    source: "manual",
    shippingAddress: emptyShippingAddress(),
    note: "",
  });
  const [errors, setErrors] = useState<OrderFormErrors & Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Server-side customer search (active customers only - the backend rejects
  // inactive customers at order creation).
  useEffect(() => {
    const query = customerQuery.trim();
    if (!query) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setCustomerSearching(true);
      try {
        const data = await customerService.listCustomers({
          search: query,
          limit: 8,
          isActive: true,
        });
        if (!cancelled) setCustomers(data.customers);
      } catch {
        if (!cancelled) setCustomers([]);
      } finally {
        if (!cancelled) setCustomerSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [customerQuery]);

  // Server-side product search (active products only).
  useEffect(() => {
    const query = productQuery.trim();
    if (!query) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setProductSearching(true);
      try {
        const data = await productService.listProducts({
          search: query,
          limit: 8,
          isActive: true,
        });
        if (!cancelled) setProducts(data.items);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setProductSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [productQuery]);

  const applyCustomerAddress = (customer: Customer) => {
    const address = customer.addresses?.find((entry) => entry.isDefault) ?? customer.addresses?.[0];
    if (!address) return;
    // Only prefill when the user has not already typed a shipping address.
    const current = values.shippingAddress;
    if (current.addressLine.trim() || current.city.trim()) return;
    setValues((prev) => ({
      ...prev,
      shippingAddress: {
        recipientName: address.recipientName ?? "",
        phone: address.phone ?? "",
        addressLine: address.addressLine,
        area: address.area ?? "",
        // Customer records do not carry a district, and delivery can only be
        // resolved from one - never guess it from the area or city.
        district: prev.shippingAddress.district,
        city: address.city,
        postalCode: address.postalCode ?? "",
        country: address.country ?? "Bangladesh",
      },
    }));
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name);
    setErrors((prev) => ({ ...prev, customer: undefined }));
    setFormError(null);
    applyCustomerAddress(customer);
  };

  const handleCustomerQueryChange = (query: string) => {
    setCustomerQuery(query);
    if (query.trim() === "") setCustomers([]);
    if (query !== selectedCustomer?.name) {
      setSelectedCustomer(null);
      setErrors((prev) => ({ ...prev, customer: undefined }));
    }
  };

  const handleProductQueryChange = (query: string) => {
    setProductQuery(query);
    if (query.trim() === "") setProducts([]);
  };

  const handleAddProduct = (product: Product) => {
    if (items.some((item) => item.productId === product.id)) return;
    if (items.length >= 50) {
      setErrors((prev) => ({ ...prev, items: "An order may have at most 50 line items" }));
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        key: nextItemKey(),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice: product.sellingPrice,
        stock: product.stock,
        quantity: "1",
      },
    ]);
    setProductQuery("");
    setErrors((prev) => ({ ...prev, items: undefined }));
    setFormError(null);
  };

  const handleRemoveItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleQuantityChange = (key: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity: value } : item))
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      next.items = undefined;
      return next;
    });
    setFormError(null);
  };

  const updateField = <K extends keyof OrderFormValues>(
    field: K,
    value: OrderFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const updateShippingField = (field: keyof ShippingFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, [field]: value },
    }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const validate = (): boolean => {
    const next: OrderFormErrors & Record<string, string | undefined> = {};

    if (!selectedCustomer) {
      next.customer = "Select a customer for the order";
    }

    if (items.length === 0) {
      next.items = "At least one item is required";
    } else {
      const productIds = new Set(items.map((item) => item.productId));
      if (productIds.size !== items.length) {
        next.items = "Duplicate products in the same order are not allowed";
      }
      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
          next[item.key] = "Quantity must be a whole number from 1 to 9999";
        }
      }
    }

    const address = values.shippingAddress;
    if (!address.addressLine.trim()) {
      next.addressLine = "Address line is required";
    } else if (address.addressLine.trim().length > 200) {
      next.addressLine = "Address line must be at most 200 characters";
    }
    // Delivery is priced by a zone the backend matches from the structured
    // location, so a district is mandatory - the backend rejects the order
    // without one, and guessing it from the city would be wrong.
    if (!address.district.trim()) {
      next.district = "District is required so delivery can be priced";
    } else if (address.district.trim().length > 100) {
      next.district = "District must be at most 100 characters";
    }
    if (!address.city.trim()) {
      next.city = "City is required";
    } else if (address.city.trim().length > 100) {
      next.city = "City must be at most 100 characters";
    }
    if (address.recipientName.trim().length > 100) {
      next.recipientName = "Recipient name must be at most 100 characters";
    }
    if (address.phone.trim() && address.phone.trim().length > 32) {
      next.phone = "Phone must be at most 32 characters";
    } else if (address.phone.trim() && !isValidPhone(address.phone.trim())) {
      next.phone = "Phone must contain a valid phone number";
    }
    if (address.area.trim().length > 100) {
      next.area = "Area must be at most 100 characters";
    }
    if (address.postalCode.trim().length > 20) {
      next.postalCode = "Postal code must be at most 20 characters";
    }
    if (address.country.trim().length > 100) {
      next.country = "Country must be at most 100 characters";
    }
    if (values.note.trim().length > 2000) {
      next.note = "Note must be at most 2000 characters";
    }

    setErrors(next);
    return Object.values(next).every((value) => value === undefined);
  };

  const estimateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      return sum + (Number.isFinite(quantity) && quantity > 0 ? item.unitPrice * quantity : 0);
    }, 0);
    // Delivery is resolved and priced by the backend from the structured
    // location; the form deliberately cannot guess it. The estimate therefore
    // covers the item subtotal only and the UI labels it as approximate.
    return {
      subtotal,
      discount: 0,
      deliveryCharge: 0,
      total: subtotal,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const address = values.shippingAddress;

    const payload: CreateOrderInput = {
      customer: selectedCustomer!.id,
      items: items.map((item) => ({
        product: item.productId,
        quantity: Number(item.quantity),
      })),
      paymentMethod: values.paymentMethod,
      source: values.source,
      shippingAddress: {
        recipientName: address.recipientName.trim() || undefined,
        phone: address.phone.trim() || undefined,
        addressLine: address.addressLine.trim(),
        area: address.area.trim() || undefined,
        district: address.district.trim(),
        city: address.city.trim(),
        postalCode: address.postalCode.trim() || undefined,
        country: address.country.trim() || undefined,
      },
      note: values.note.trim() || undefined,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const serverErrors = err.errors;
        const next: OrderFormErrors & Record<string, string | undefined> = {};
        if (serverErrors.customer) next.customer = serverErrors.customer[0];
        if (serverErrors.note) next.note = serverErrors.note[0];
        if (serverErrors["shippingAddress.addressLine"])
          next.addressLine = serverErrors["shippingAddress.addressLine"][0];
        if (serverErrors["shippingAddress.district"])
          next.district = serverErrors["shippingAddress.district"][0];
        if (serverErrors["shippingAddress.city"])
          next.city = serverErrors["shippingAddress.city"][0];
        const phoneError =
          serverErrors["shippingAddress.phone"]?.[0] ?? serverErrors.phone?.[0];
        if (phoneError) next.phone = phoneError;
        const recipientError = serverErrors["shippingAddress.recipientName"]?.[0];
        if (recipientError) next.recipientName = recipientError;
        if (serverErrors.items) {
          next.items = serverErrors.items[0];
        } else {
          for (const [key, messages] of Object.entries(serverErrors)) {
            const fieldsMatch = /^items\.(\d+)\./.exec(key);
            if (!fieldsMatch) continue;
            const index = Number(fieldsMatch[1]);
            const item = items[index];
            if (item) next[item.key] = messages[0];
          }
        }
        setErrors(next);
        return;
      }
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setFormError(`Could not create the order: ${message}.`);
    }
  };

  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    label: customer.name,
    description: customer.phone,
    hint: customer.email,
  }));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <SearchableListbox
        id="orders-customer-picker"
        label="Customer"
        required
        placeholder="Search customers by name or phone..."
        query={customerQuery}
        onQueryChange={handleCustomerQueryChange}
        options={customerOptions}
        selected={
          selectedCustomer
            ? {
                id: selectedCustomer.id,
                label: selectedCustomer.name,
                description: selectedCustomer.phone,
              }
            : null
        }
        onSelect={(option) => {
          const customer = customers.find((candidate) => candidate.id === option.id);
          if (customer) handleSelectCustomer(customer);
        }}
        isSearching={customerSearching}
        disabled={isSubmitting}
        error={errors.customer}
        emptyText="No customers found. Add the customer in the Customers module first."
        helperText="Only active customers can be selected."
      />

      <OrderItemsEditor
        items={items}
        errors={errors}
        products={products}
        productQuery={productQuery}
        onProductQueryChange={handleProductQueryChange}
        isSearchingProducts={productSearching}
        onAddProduct={handleAddProduct}
        onRemoveItem={handleRemoveItem}
        onQuantityChange={handleQuantityChange}
        isSubmitting={isSubmitting}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="order-payment-method"
          label="Payment method"
          value={values.paymentMethod}
          onChange={(event) =>
            updateField("paymentMethod", event.target.value as PaymentMethod)
          }
          disabled={isSubmitting}
          options={PAYMENT_METHODS.map((method) => ({
            value: method,
            label: PAYMENT_METHOD_LABELS[method],
          }))}
        />
        <Select
          id="order-source"
          label="Source"
          value={values.source}
          onChange={(event) => updateField("source", event.target.value as OrderSource)}
          disabled={isSubmitting}
          options={ORDER_SOURCES.map((source) => ({
            value: source,
            label: ORDER_SOURCE_LABELS[source],
          }))}
        />
      </div>

      <fieldset className="space-y-3 rounded-md border border-border p-3">
        <legend className="px-1 text-sm font-label text-foreground">
          Shipping address
          <span className="ml-0.5 text-destructive">*</span>
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              id="order-address-line"
              label="Address line"
              required
              value={values.shippingAddress.addressLine}
              onChange={(event) => updateShippingField("addressLine", event.target.value)}
              error={errors.addressLine}
              placeholder="Street address"
            />
          </div>
          <Input
            id="order-recipient"
            label="Recipient name"
            value={values.shippingAddress.recipientName}
            onChange={(event) => updateShippingField("recipientName", event.target.value)}
            error={errors.recipientName}
            placeholder="Optional"
          />
          <Input
            id="order-phone"
            label="Phone"
            type="tel"
            value={values.shippingAddress.phone}
            onChange={(event) => updateShippingField("phone", event.target.value)}
            error={errors.phone}
            placeholder="Optional"
          />
          <Input
            id="order-district"
            label="District"
            required
            value={values.shippingAddress.district}
            onChange={(event) => updateShippingField("district", event.target.value)}
            error={errors.district}
            placeholder="District"
          />
          <Input
            id="order-area"
            label="Area / locality"
            value={values.shippingAddress.area}
            onChange={(event) => updateShippingField("area", event.target.value)}
            error={errors.area}
            placeholder="Optional"
          />
          <Input
            id="order-city"
            label="City"
            required
            value={values.shippingAddress.city}
            onChange={(event) => updateShippingField("city", event.target.value)}
            error={errors.city}
            placeholder="City"
          />
          <Input
            id="order-postal-code"
            label="Postal code"
            value={values.shippingAddress.postalCode}
            onChange={(event) => updateShippingField("postalCode", event.target.value)}
            error={errors.postalCode}
            placeholder="Optional"
          />
          <Input
            id="order-country"
            label="Country"
            value={values.shippingAddress.country}
            onChange={(event) => updateShippingField("country", event.target.value)}
            error={errors.country}
            placeholder="Country"
          />
        </div>
      </fieldset>

      <Textarea
        id="order-note"
        label="Note"
        value={values.note}
        onChange={(event) => updateField("note", event.target.value)}
        error={errors.note}
        placeholder="Optional internal note (max 2000 characters)"
        rows={3}
      />

      <OrderSummary estimate={estimateTotals()} />

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Create order
        </Button>
      </div>
    </form>
  );
}