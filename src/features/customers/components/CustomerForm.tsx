"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { ApiError } from "@/lib/api";
import { MapPinPlus, Trash2 } from "lucide-react";
import type {
  CreateCustomerInput,
  Customer,
  CustomerAddressInput,
  UpdateCustomerInput,
} from "../types";

const MAX_ADDRESSES = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AddressFormValues {
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  area: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface CustomerFormValues {
  name: string;
  phone: string;
  alternatePhone: string;
  email: string;
  facebookName: string;
  facebookProfileUrl: string;
  tags: string;
  notes: string;
  addresses: AddressFormValues[];
}

interface FieldErrors {
  name?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  facebookName?: string;
  facebookProfileUrl?: string;
  tags?: string;
  notes?: string;
  addresses?: string;
}

interface CustomerFormProps {
  mode: "create" | "edit";
  initialValues?: Customer | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateCustomerInput | UpdateCustomerInput) => Promise<void>;
  onCancel: () => void;
}

const emptyAddress = (): AddressFormValues => ({
  label: "Home",
  recipientName: "",
  phone: "",
  addressLine: "",
  area: "",
  city: "",
  postalCode: "",
  country: "",
  isDefault: false,
});

const phoneDigits = (value: string): string => value.replace(/\D/g, "");
const isValidPhone = (value: string): boolean => {
  const digits = phoneDigits(value);
  return digits.length >= 7 && digits.length <= 15;
};

const splitTags = (raw: string): string[] =>
  raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const isBlankAddress = (address: AddressFormValues): boolean =>
  !address.recipientName.trim() &&
  !address.phone.trim() &&
  !address.addressLine.trim() &&
  !address.area.trim() &&
  !address.city.trim() &&
  !address.postalCode.trim() &&
  !address.country.trim();

export function CustomerForm({
  mode,
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [values, setValues] = useState<CustomerFormValues>({
    name: initialValues?.name ?? "",
    phone: initialValues?.phone ?? "",
    alternatePhone: initialValues?.alternatePhone ?? "",
    email: initialValues?.email ?? "",
    facebookName: (initialValues as any)?.facebookName ?? "",
    facebookProfileUrl: (initialValues as any)?.facebookProfileUrl ?? "",
    tags: initialValues?.tags.join(", ") ?? "",
    notes: initialValues?.notes ?? "",
    addresses: initialValues?.addresses?.length
      ? initialValues.addresses.map((address) => ({
          label: address.label,
          recipientName: address.recipientName ?? "",
          phone: address.phone ?? "",
          addressLine: address.addressLine,
          area: address.area ?? "",
          city: address.city,
          postalCode: address.postalCode ?? "",
          country: address.country ?? "",
          isDefault: address.isDefault,
        }))
      : [],
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [addressErrors, setAddressErrors] = useState<(string | null)[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = <K extends keyof CustomerFormValues>(
    field: K,
    value: CustomerFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const updateAddress = (index: number, field: keyof AddressFormValues, value: string | boolean) => {
    setValues((prev) => ({
      ...prev,
      addresses: prev.addresses.map((address, addressIndex) =>
        addressIndex === index ? { ...address, [field]: value } : address
      ),
    }));
    setAddressErrors((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setFieldErrors((prev) => ({ ...prev, addresses: undefined }));
    setFormError(null);
  };

  const setDefaultAddress = (index: number, checked: boolean) => {
    setValues((prev) => ({
      ...prev,
      addresses: prev.addresses.map((address, addressIndex) => ({
        ...address,
        isDefault: addressIndex === index ? checked : checked ? false : address.isDefault,
      })),
    }));
  };

  const addAddress = () => {
    setValues((prev) =>
      prev.addresses.length >= MAX_ADDRESSES
        ? prev
        : { ...prev, addresses: [...prev.addresses, emptyAddress()] }
    );
    setAddressErrors((prev) => [...prev, null]);
  };

  const removeAddress = (index: number) => {
    setValues((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((_, addressIndex) => addressIndex !== index),
    }));
    setAddressErrors((prev) => prev.filter((_, addressIndex) => addressIndex !== index));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const name = values.name.trim();
    const phone = values.phone.trim();
    const alternatePhone = values.alternatePhone.trim();
    const email = values.email.trim();
    const tags = splitTags(values.tags);

    if (!name) {
      errors.name = "Customer name is required";
    } else if (name.length > 100) {
      errors.name = "Customer name must be at most 100 characters";
    }

    if (!phone) {
      errors.phone = "Phone is required";
    } else if (phone.length > 32) {
      errors.phone = "Phone must be at most 32 characters";
    } else if (!isValidPhone(phone)) {
      errors.phone = "Phone must contain a valid phone number (7-15 digits)";
    }

    if (alternatePhone) {
      if (alternatePhone.length > 32) {
        errors.alternatePhone = "Alternate phone must be at most 32 characters";
      } else if (!isValidPhone(alternatePhone)) {
        errors.alternatePhone = "Alternate phone must contain a valid phone number (7-15 digits)";
      }
    }

    if (email) {
      if (email.length > 254) {
        errors.email = "Email must be at most 254 characters";
      } else if (!EMAIL_PATTERN.test(email)) {
        errors.email = "Email must be a valid email address";
      }
    }

    if (values.facebookName.trim().length > 120) {
      errors.facebookName = "Facebook name must be at most 120 characters";
    }

    const fbUrl = values.facebookProfileUrl.trim();
    if (fbUrl) {
      try {
        const url = new URL(fbUrl);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          errors.facebookProfileUrl = "Facebook profile URL must be a valid HTTP/HTTPS URL";
        }
      } catch {
        errors.facebookProfileUrl = "Facebook profile URL must be a valid HTTP/HTTPS URL";
      }
    }

    if (values.notes.trim().length > 2000) {
      errors.notes = "Notes must be at most 2000 characters";
    }

    if (tags.length > 20) {
      errors.tags = "A customer may have at most 20 tags";
    } else if (tags.some((tag) => tag.length > 30)) {
      errors.tags = "Tag must be at most 30 characters";
    }

    const newAddressErrors: (string | null)[] = values.addresses.map((address, index) => {
      if (isBlankAddress(address)) return null;
      let message: string | null = null;
      if (address.recipientName.trim().length > 100) {
        message = "Recipient name must be at most 100 characters";
      } else if (address.phone.trim() && !isValidPhone(address.phone.trim())) {
        message = "Address phone must contain a valid phone number (7-15 digits)";
      } else if (!address.addressLine.trim()) {
        message = "Address line is required";
      } else if (address.addressLine.trim().length > 200) {
        message = "Address line must be at most 200 characters";
      } else if (address.area.trim().length > 100) {
        message = "Area must be at most 100 characters";
      } else if (!address.city.trim()) {
        message = "City is required";
      } else if (address.city.trim().length > 100) {
        message = "City must be at most 100 characters";
      } else if (address.postalCode.trim().length > 20) {
        message = "Postal code must be at most 20 characters";
      } else if (address.country.trim().length > 100) {
        message = "Country must be at most 100 characters";
      }
      if (message) {
        errors.addresses = "Please review the address details below.";
        return `Address ${index + 1}: ${message}`;
      }
      return null;
    });

    setAddressErrors(newAddressErrors);

    if (values.addresses.length > MAX_ADDRESSES) {
      errors.addresses = "A customer may have at most 20 addresses";
    } else if (values.addresses.filter((address) => address.isDefault).length > 1) {
      errors.addresses = "Only one address can be the default address";
    }

    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const errors = validate();
    if (
      errors.name ||
      errors.phone ||
      errors.alternatePhone ||
      errors.email ||
      errors.tags ||
      errors.notes ||
      errors.addresses
    ) {
      setFieldErrors(errors);
      return;
    }

    const filledAddresses = values.addresses.filter((address) => !isBlankAddress(address));
    const addressesPayload: CustomerAddressInput[] = filledAddresses.map((address) => ({
      label: address.label,
      recipientName: address.recipientName.trim() || undefined,
      phone: address.phone.trim() || undefined,
      addressLine: address.addressLine.trim(),
      area: address.area.trim() || undefined,
      city: address.city.trim(),
      postalCode: address.postalCode.trim() || undefined,
      country: address.country.trim() || undefined,
      isDefault: address.isDefault,
    }));

    const isEdit = mode === "edit";
    const payload: CreateCustomerInput | UpdateCustomerInput = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      alternatePhone:
        values.alternatePhone.trim() || (isEdit ? null : undefined),
      email: values.email.trim().toLowerCase() || (isEdit ? null : undefined),
      facebookName: values.facebookName.trim() || (isEdit ? null : undefined),
      facebookProfileUrl: values.facebookProfileUrl.trim() || (isEdit ? null : undefined),
      addresses: addressesPayload.length
        ? addressesPayload
        : isEdit
          ? null
          : undefined,
      notes: values.notes.trim() || (isEdit ? null : undefined),
      tags: splitTags(values.tags),
    } as any;

    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const serverErrors = err.errors;
        const next: FieldErrors = {};
        if (serverErrors.name) next.name = serverErrors.name[0];
        if (serverErrors.phone) next.phone = serverErrors.phone[0];
        if (serverErrors.alternatePhone) next.alternatePhone = serverErrors.alternatePhone[0];
        if (serverErrors.email) next.email = serverErrors.email[0];
        if (serverErrors.facebookName) next.facebookName = serverErrors.facebookName[0];
        if (serverErrors.facebookProfileUrl) next.facebookProfileUrl = serverErrors.facebookProfileUrl[0];
        if (serverErrors.notes) next.notes = serverErrors.notes[0];
        if (serverErrors.tags) next.tags = serverErrors.tags[0];
        setAddressErrors(
          values.addresses.map((_, index) =>
            serverErrors[`addresses.${index}.addressLine`]?.[0] ??
            serverErrors[`addresses.${index}.city`]?.[0] ??
            serverErrors[`addresses.${index}.label`]?.[0] ??
            serverErrors[`addresses.${index}.phone`]?.[0] ??
            null
          )
        );
        const addressTopError = serverErrors.addresses?.[0];
        if (Object.values(next).some(Boolean) || addressTopError) {
          if (addressTopError) next.addresses = addressTopError;
          setFieldErrors(next);
          return;
        }
        const addressFieldError = Object.entries(serverErrors).find(([key]) =>
          key.startsWith("addresses.")
        )?.[1]?.[0];
        if (addressFieldError) {
          setFieldErrors({ addresses: addressFieldError });
          return;
        }
      }
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      if (message.toLowerCase().includes("phone number already exists")) {
        setFieldErrors((prev) => ({ ...prev, phone: message }));
      } else {
        setFormError(message);
      }
    }
  };

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="customer-name"
          label="Customer name"
          required
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={fieldErrors.name}
          placeholder="Full name"
          autoFocus
        />
        <Input
          id="customer-phone"
          label="Phone"
          required
          type="tel"
          value={values.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          error={fieldErrors.phone}
          placeholder="e.g. +880 1712 345 678"
          helperText="7-15 digits"
        />
        <Input
          id="customer-alternate-phone"
          label="Alternate phone"
          type="tel"
          value={values.alternatePhone}
          onChange={(event) => updateField("alternatePhone", event.target.value)}
          error={fieldErrors.alternatePhone}
          placeholder="Optional"
        />
        <Input
          id="customer-email"
          label="Email"
          type="email"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          error={fieldErrors.email}
          placeholder="name@example.com"
        />
        <Input
          id="customer-tags"
          label="Tags"
          value={values.tags}
          onChange={(event) => updateField("tags", event.target.value)}
          error={fieldErrors.tags}
          placeholder="comma, separated, tags"
          helperText="Up to 20 tags, comma separated (max 30 characters each)"
        />
        <Input
          id="customer-facebook-name"
          label="Facebook Name (Optional)"
          value={values.facebookName}
          onChange={(event) => updateField("facebookName", event.target.value)}
          error={fieldErrors.facebookName}
          placeholder="Customer's Facebook name"
        />
        <Input
          id="customer-facebook-url"
          label="Facebook Profile URL (Optional)"
          value={values.facebookProfileUrl}
          onChange={(event) => updateField("facebookProfileUrl", event.target.value)}
          error={fieldErrors.facebookProfileUrl}
          placeholder="https://facebook.com/..."
        />
      </div>

      <Textarea
        id="customer-notes"
        label="Notes"
        value={values.notes}
        onChange={(event) => updateField("notes", event.target.value)}
        error={fieldErrors.notes}
        placeholder="Optional internal notes (max 2000 characters)"
        rows={3}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-label text-foreground">Addresses</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAddress}
            disabled={values.addresses.length >= MAX_ADDRESSES}
          >
            <MapPinPlus className="mr-1 h-4 w-4" aria-hidden="true" />
            Add address
          </Button>
        </div>
        {fieldErrors.addresses && (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.addresses}
          </p>
        )}
        {values.addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No addresses added. Addresses are optional.
          </p>
        ) : (
          <ul className="space-y-3">
            {values.addresses.map((address, index) => (
              <li
                key={index}
                className="space-y-3 rounded-md border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Address {index + 1}
                  </span>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`address-default-${index}`}
                      label="Default"
                      checked={address.isDefault}
                      onChange={(event) => setDefaultAddress(index, event.target.checked)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAddress(index)}
                      aria-label={`Remove address ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                {addressErrors[index] && (
                  <p className="text-sm text-destructive" role="alert">
                    {addressErrors[index]}
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    id={`address-label-${index}`}
                    label="Label"
                    value={address.label}
                    onChange={(event) => updateAddress(index, "label", event.target.value)}
                    options={[
                      { value: "Home", label: "Home" },
                      { value: "Work", label: "Work" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                  <Input
                    aria-label={`Address ${index + 1} recipient name`}
                    label="Recipient name"
                    value={address.recipientName}
                    onChange={(event) =>
                      updateAddress(index, "recipientName", event.target.value)
                    }
                    placeholder="Optional"
                  />
                  <div className="sm:col-span-2">
                    <Input
                      aria-label={`Address ${index + 1} address line`}
                      label="Address line"
                      required
                      value={address.addressLine}
                      onChange={(event) =>
                        updateAddress(index, "addressLine", event.target.value)
                      }
                      placeholder="Street address"
                    />
                  </div>
                  <Input
                    aria-label={`Address ${index + 1} area`}
                    label="Area / locality"
                    value={address.area}
                    onChange={(event) => updateAddress(index, "area", event.target.value)}
                    placeholder="Optional"
                  />
                  <Input
                    aria-label={`Address ${index + 1} city`}
                    label="City"
                    required
                    value={address.city}
                    onChange={(event) => updateAddress(index, "city", event.target.value)}
                    placeholder="City"
                  />
                  <Input
                    aria-label={`Address ${index + 1} postal code`}
                    label="Postal code"
                    value={address.postalCode}
                    onChange={(event) =>
                      updateAddress(index, "postalCode", event.target.value)
                    }
                    placeholder="Optional"
                  />
                  <Input
                    aria-label={`Address ${index + 1} phone`}
                    label="Phone"
                    type="tel"
                    value={address.phone}
                    onChange={(event) => updateAddress(index, "phone", event.target.value)}
                    placeholder="Optional"
                  />
                  <Input
                    aria-label={`Address ${index + 1} country`}
                    label="Country"
                    value={address.country}
                    onChange={(event) =>
                      updateAddress(index, "country", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Up to {MAX_ADDRESSES} addresses. Only one can be the default address.
        </p>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === "edit" ? "Save changes" : "Create customer"}
        </Button>
      </div>
    </form>
  );
}