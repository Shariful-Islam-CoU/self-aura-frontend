"use client";

import { BootstrapOwnerForm } from "@/features/auth/components/BootstrapOwnerForm";

export default function SetupOwnerPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <BootstrapOwnerForm />
    </div>
  );
}