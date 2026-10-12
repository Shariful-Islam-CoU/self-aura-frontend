"use client";

import { PageContainer } from "@/components/layout";
import { SettingsLayout } from "@/features/settings/components/SettingsLayout";

export default function SettingsPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account, appearance, and business configuration
          </p>
        </div>
        <SettingsLayout />
      </div>
    </PageContainer>
  );
}