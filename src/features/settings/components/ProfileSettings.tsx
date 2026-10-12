"use client";

// Profile settings. Loads the current user from GET /auth/me (backend is the
// source of truth) and renders it read-only.
//
// Backend limitation (reported, not worked around): the user model has no
// email/name/phone/avatar fields, and there is NO self-service profile update
// endpoint - PATCH /users/:id is the owner-only user-management surface. So
// this section displays the profile but does not fake an edit form.

import { useCallback, useEffect, useState } from "react";
import { SettingsSection } from "./SettingsSection";
import { settingsClient } from "../services/settingsService";
import { settingsErrorMessage } from "../utils";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { getRoleDisplayName } from "@/lib/auth/authUtils";
import type { ProfileUser } from "../types";

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

function ProfileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

export function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await settingsClient.getCurrentUser();
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(settingsErrorMessage(err, "Unable to load your profile."));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    void load();
  }, [load]);

  useEffect(() => {
    // Invoked through a local async wrapper so the effect body performs no
    // synchronous state updates.
    const init = async () => {
      await load();
    };
    void init();
  }, [load]);

  return (
    <SettingsSection
      title="Profile"
      description="Your account details, loaded from the backend (GET /auth/me)."
    >
      {error && !profile ? (
        <ErrorState
          title="Unable to load your profile"
          description={error}
          onRetry={handleRetry}
        />
      ) : loading && !profile ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      ) : profile ? (
        <dl className="space-y-3 rounded-md border border-input p-4">
          <ProfileField label="Username">{profile.username}</ProfileField>
          <ProfileField label="Role">
            <Badge variant={profile.role === "owner" ? "warning" : "secondary"}>
              {getRoleDisplayName(profile.role)}
            </Badge>
          </ProfileField>
          <ProfileField label="Account status">
            <Badge variant={profile.isActive ? "success" : "destructive"}>
              {profile.isActive ? "Active" : "Inactive"}
            </Badge>
          </ProfileField>
          <ProfileField label="Member since">{formatDate(profile.createdAt)}</ProfileField>
          <ProfileField label="Last updated">{formatDate(profile.updatedAt)}</ProfileField>
        </dl>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Profile editing is not available: the backend user model has no email, name, phone or
        avatar fields, and account updates are owner-managed through the user management API.
      </p>
    </SettingsSection>
  );
}