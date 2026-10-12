"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "@/features/auth/services/authService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { ApiError } from "@/lib/api";
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";

const MIN_PASSWORD_LENGTH = 6;

interface FieldErrors {
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * One-time principal Owner setup.
 * The backend only allows this while no Owner exists (race-safe backend claim),
 * so a 409 here means an Owner was already created.
 */
export function BootstrapOwnerForm() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  const clearField = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (formError) setFormError(null);
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!username.trim()) errors.username = "Username is required";
    else if (username.trim().length < 3) errors.username = "Username must be at least 3 characters";
    if (!name.trim()) errors.name = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address";
    if (!phone.trim()) errors.phone = "Phone number is required";
    else if (phone.trim().length < 7) errors.phone = "Phone number must be at least 7 characters";
    if (!password) errors.password = "Password is required";
    else if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match";

    setFieldErrors(errors);
    setFormError(null);
    return Object.values(errors).every((value) => !value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await authService.bootstrapOwner({
        username: username.trim(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const next: FieldErrors = {};
        const keys: (keyof FieldErrors)[] = ["username", "name", "email", "phone", "password"];
        for (const key of keys) {
          if (err.errors[key] && err.errors[key].length > 0) next[key] = err.errors[key][0];
        }
        setFieldErrors(next);
        if (Object.values(next).some(Boolean)) return;
      }
      setFormError(err instanceof Error ? err.message : "Owner setup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md" data-testid="bootstrap-success">
        <CardContent className="pt-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Owner account created</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your principal Owner account is ready. As Owner you have full access
            and can manage users, roles and permissions from Settings.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Sign in as Owner
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <KeyRound className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set up your Owner account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create the principal Owner account. This is the only way to create
            the Owner role, and it is available only once per installation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {formError && (
            <div
              className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Username"
            type="text"
            placeholder="owner"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              clearField("username");
            }}
            autoComplete="username"
            error={fieldErrors.username}
            disabled={isSubmitting}
            required
          />

          <Input
            label="Full name"
            type="text"
            placeholder="Self Aura Owner"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearField("name");
            }}
            autoComplete="name"
            error={fieldErrors.name}
            disabled={isSubmitting}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="owner@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearField("email");
            }}
            autoComplete="email"
            error={fieldErrors.email}
            disabled={isSubmitting}
            required
          />

          <Input
            label="Phone"
            type="tel"
            placeholder="8801XXXXXXXXX"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearField("phone");
            }}
            autoComplete="tel"
            error={fieldErrors.phone}
            disabled={isSubmitting}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearField("password");
            }}
            autoComplete="new-password"
            error={fieldErrors.password}
            disabled={isSubmitting}
            required
          />

          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearField("confirmPassword");
            }}
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            disabled={isSubmitting}
            required
          />

          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Create Owner account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already signed in?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Go to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}