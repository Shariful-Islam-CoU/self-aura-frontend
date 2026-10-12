"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import type { UserRecord, CreateUserInput, UpdateUserInput } from "../types";

const MIN_PASSWORD_LENGTH = 6;

interface FieldErrors {
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
}

interface UserFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  user: UserRecord | null;
  roleOptions: { value: string; label: string }[];
  isSubmitting: boolean;
  onSubmit: (values: CreateUserInput | UpdateUserInput) => void;
  onOpenChange: (open: boolean) => void;
}

export function UserFormDialog({
  open,
  mode,
  user,
  roleOptions,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: UserFormDialogProps) {
  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Add user" : `Edit ${user?.username ?? "user"}`}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Admin-created accounts are active immediately and skip the pending approval flow."
              : "Update profile details. Roles and status are managed with the dedicated actions."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <UserForm
            key={isCreate ? "create" : `edit-${user?.id ?? "none"}`}
            mode={mode}
            user={isCreate ? null : user}
            roleOptions={roleOptions}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface UserFormProps {
  mode: "create" | "edit";
  user: UserRecord | null;
  roleOptions: { value: string; label: string }[];
  isSubmitting: boolean;
  onSubmit: (values: CreateUserInput | UpdateUserInput) => void;
  onCancel: () => void;
}

// Mounted via a `key` from UserFormDialog so its state always initializes from
// the current target (the lint-safe alternative to setState-in-effect).
function UserForm({ mode, user, roleOptions, isSubmitting, onSubmit, onCancel }: UserFormProps) {
  const isCreate = mode === "create";

  const [username, setUsername] = useState(user?.username ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearField = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleApiError = (err: unknown) => {
    if (err instanceof ApiError && err.errors) {
      const next: FieldErrors = {};
      const keys: (keyof FieldErrors)[] = ["username", "name", "email", "phone", "password", "role"];
      for (const key of keys) {
        if (err.errors[key] && err.errors[key].length > 0) next[key] = err.errors[key][0];
      }
      setFieldErrors(next);
      if (Object.values(next).some(Boolean)) return;
    }
    setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isCreate) {
      const errors: FieldErrors = {};
      if (!username.trim()) errors.username = "Username is required";
      else if (username.trim().length < 3) errors.username = "Username must be at least 3 characters";
      if (!name.trim()) errors.name = "Name is required";
      if (!email.trim()) errors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address";
      if (!phone.trim()) errors.phone = "Phone number is required";
      if (!password) errors.password = "Password is required";
      else if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
      if (!role.trim()) errors.role = "Role is required";
      setFieldErrors(errors);
      if (Object.values(errors).some(Boolean)) return;

      try {
        await onSubmit({
          username: username.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role: role.trim().toLowerCase(),
        } satisfies CreateUserInput);
      } catch (err) {
        handleApiError(err);
      }
    } else if (user) {
      const errors: FieldErrors = {};
      if (!username.trim()) errors.username = "Username is required";
      if (!name.trim()) errors.name = "Name is required";
      if (!email.trim()) errors.email = "Email is required";
      setFieldErrors(errors);
      if (Object.values(errors).some(Boolean)) return;

      try {
        await onSubmit({
          username: username.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        } satisfies UpdateUserInput);
      } catch (err) {
        handleApiError(err);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          <span>{formError}</span>
        </div>
      )}

      <Input
        label="Username"
        type="text"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          clearField("username");
        }}
        error={fieldErrors.username}
        disabled={isSubmitting}
        required
      />

      <Input
        label="Full name"
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          clearField("name");
        }}
        error={fieldErrors.name}
        disabled={isSubmitting}
        required
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          clearField("email");
        }}
        error={fieldErrors.email}
        disabled={isSubmitting}
        required
      />

      <Input
        label="Phone"
        type="tel"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          clearField("phone");
        }}
        error={fieldErrors.phone}
        disabled={isSubmitting}
        required
      />

      {isCreate && (
        <>
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearField("password");
            }}
            error={fieldErrors.password}
            helperText={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            disabled={isSubmitting}
            required
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              clearField("role");
            }}
            options={roleOptions}
            error={fieldErrors.role}
            disabled={isSubmitting}
            required
          />
        </>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {isCreate ? "Create user" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}