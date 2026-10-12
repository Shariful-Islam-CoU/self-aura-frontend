import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { DialogClose } from "@/components/ui/Dialog";
import type { Courier, CreateCourierData, UpdateCourierData } from "../types";

export interface CourierFormProps {
  mode: "create" | "edit";
  courier?: Courier | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateCourierData | UpdateCourierData) => Promise<void>;
}

interface CourierFormState {
  name: string;
  phone: string;
  website: string;
  contactPerson: string;
  address: string;
  notes: string;
}

const emptyState: CourierFormState = {
  name: "",
  phone: "",
  website: "",
  contactPerson: "",
  address: "",
  notes: "",
};

// Create/edit form. Validation mirrors courierValidators (name required and
// <= 100 chars; optional fields <= backend limits). Empty optional values are
// cleared like the backend's empty-to-undefined transform.
export function CourierForm({
  mode,
  courier,
  isSubmitting,
  onSubmit,
}: CourierFormProps) {
  const [values, setValues] = useState<CourierFormState>(() =>
    mode === "edit" && courier
      ? {
          name: courier.name,
          phone: courier.phone ?? "",
          website: courier.website ?? "",
          contactPerson: courier.contactPerson ?? "",
          address: courier.address ?? "",
          notes: courier.notes ?? "",
        }
      : emptyState
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setField = (patch: Partial<CourierFormState>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])) }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string | undefined> = {};
    const name = values.name.trim();
    if (!name) {
      nextErrors.name = "Name is required.";
    } else if (name.length > 100) {
      nextErrors.name = "Name must be at most 100 characters.";
    }
    if (values.contactPerson.trim().length > 100) {
      nextErrors.contactPerson = "Must be at most 100 characters.";
    }
    if (values.phone.trim().length > 32) {
      nextErrors.phone = "Must be at most 32 characters.";
    }
    if (values.website.trim().length > 200) {
      nextErrors.website = "Must be at most 200 characters.";
    }
    if (values.address.trim().length > 500) {
      nextErrors.address = "Must be at most 500 characters.";
    }
    if (values.notes.trim().length > 2000) {
      nextErrors.notes = "Must be at most 2000 characters.";
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const payload: CreateCourierData = {
      name,
      phone: values.phone.trim() || undefined,
      website: values.website.trim() || undefined,
      contactPerson: values.contactPerson.trim() || undefined,
      address: values.address.trim() || undefined,
      notes: values.notes.trim() || undefined,
    };

    setSubmitError(null);
    try {
      await onSubmit(payload);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to save courier.");
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

      <Input
        label="Name"
        id="courier-name-input"
        required
        maxLength={100}
        value={values.name}
        onChange={(event) => setField({ name: event.target.value })}
        error={errors.name}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Contact person"
          id="courier-contact-input"
          maxLength={100}
          value={values.contactPerson}
          onChange={(event) => setField({ contactPerson: event.target.value })}
          error={errors.contactPerson}
        />
        <Input
          label="Phone"
          id="courier-phone-input"
          type="tel"
          maxLength={32}
          value={values.phone}
          onChange={(event) => setField({ phone: event.target.value })}
          error={errors.phone}
        />
      </div>

      <Input
        label="Website"
        id="courier-website-input"
        type="url"
        maxLength={200}
        placeholder="https://example.com"
        value={values.website}
        onChange={(event) => setField({ website: event.target.value })}
        error={errors.website}
      />

      <Textarea
        label="Address"
        id="courier-address-input"
        maxLength={500}
        value={values.address}
        onChange={(event) => setField({ address: event.target.value })}
        error={errors.address}
      />

      <Textarea
        label="Notes"
        id="courier-notes-input"
        maxLength={2000}
        value={values.notes}
        onChange={(event) => setField({ notes: event.target.value })}
        error={errors.notes}
      />

      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : mode === "create" ? "Create courier" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}