"use client";

// Social links settings. The storefront connect icons (Facebook, Instagram,
// Messenger) read these URLs from the public GET /api/public/store-socials
// endpoint, which serves exactly these three application-settings keys:
//
//   - social.facebook   Store Facebook page URL
//   - social.instagram  Store Instagram profile URL
//   - social.messenger  Store Messenger chat link (m.me URL)
//
// An empty value hides that channel on the storefront - it is never rendered
// as a link. PATCH /settings/app upserts, so saving creates a missing key.
// Only https URLs are accepted; anything else is rejected here before it can
// reach the storefront.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { SettingsSection } from "./SettingsSection";
import { SettingsSaveBar } from "./SettingsSaveBar";
import { settingsClient } from "../services/settingsService";
import { settingsErrorMessage } from "../utils";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/LoadingState";
import { Input } from "@/components/ui/Input";
import type { ApplicationSetting } from "../types";

interface SocialDraft {
  facebook: string;
  instagram: string;
  messenger: string;
}

const SOCIAL_KEYS = {
  facebook: "social.facebook",
  instagram: "social.instagram",
  messenger: "social.messenger",
} as const;

const SOCIAL_DESCRIPTIONS = {
  facebook: "Store Facebook page URL shown on the storefront",
  instagram: "Store Instagram profile URL shown on the storefront",
  messenger: "Store Messenger chat link (m.me URL) shown on the storefront",
} as const;

const toDraft = (settings: ApplicationSetting[]): SocialDraft => {
  const byName = new Map(settings.map((setting) => [setting.name, setting.value]));
  const asString = (value: unknown): string => (typeof value === "string" ? value : "");
  return {
    facebook: asString(byName.get(SOCIAL_KEYS.facebook)),
    instagram: asString(byName.get(SOCIAL_KEYS.instagram)),
    messenger: asString(byName.get(SOCIAL_KEYS.messenger)),
  };
};

function validateUrl(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") {
      return `${label} must start with https://.`;
    }
  } catch {
    return `${label} must be a valid URL (for example https://facebook.com/your-page).`;
  }
  return null;
}

const validateDraft = (draft: SocialDraft): string | null => {
  return (
    validateUrl(draft.facebook, "Facebook URL") ??
    validateUrl(draft.instagram, "Instagram URL") ??
    validateUrl(draft.messenger, "Messenger link") ??
    null
  );
};

export function SocialSettings() {
  const { canAccess } = useAuth();
  // PATCH /settings/app requires settings.manage (backend enforces).
  const canManage = canAccess("settings.manage");

  const [settings, setSettings] = useState<ApplicationSetting[] | null>(null);
  const [draft, setDraft] = useState<SocialDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await settingsClient.getApplicationSettings();
      setSettings(data);
      setDraft(toDraft(data));
      setLoadError(null);
      setMessage(null);
    } catch (err) {
      setLoadError(settingsErrorMessage(err, "Unable to load social links."));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    void load();
  }, [load]);

  useEffect(() => {
    const init = async () => {
      await load();
    };
    void init();
  }, [load]);

  const dirty =
    settings !== null && draft !== null && JSON.stringify(toDraft(settings)) !== JSON.stringify(draft);

  const handleSave = async () => {
    if (!settings || !draft || saving) return;

    const validationError = validateDraft(draft);
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    const current = toDraft(settings);
    const changed = (Object.keys(current) as (keyof SocialDraft)[]).filter(
      (channel) => draft[channel].trim() !== current[channel]
    );

    if (changed.length === 0) {
      setMessage({ type: "error", text: "No changes to save." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      // Upsert each changed key (creates missing keys); then re-read so the
      // form state is replaced by the backend response, never optimistic.
      for (const channel of changed) {
        await settingsClient.updateApplicationSetting({
          name: SOCIAL_KEYS[channel],
          value: draft[channel].trim(),
          description: SOCIAL_DESCRIPTIONS[channel],
        });
      }
      const data = await settingsClient.getApplicationSettings();
      setSettings(data);
      setDraft(toDraft(data));
      setMessage({ type: "success", text: "Social links updated." });
    } catch (err) {
      setMessage({ type: "error", text: settingsErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!settings) return;
    setDraft(toDraft(settings));
    setMessage(null);
  };

  return (
    <SettingsSection
      title="Social"
      description="Facebook, Instagram and Messenger links shown on the storefront (backend-owned)."
    >
      {loadError && !settings ? (
        <ErrorState
          title="Unable to load social links"
          description={loadError}
          onRetry={handleRetry}
        />
      ) : loading && !settings ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : draft ? (
        <>
          <div className="grid gap-4">
            <Input
              label="Facebook URL"
              value={draft.facebook}
              onChange={(event) => setDraft({ ...draft, facebook: event.target.value })}
              placeholder="https://facebook.com/your-page"
              helperText="Store Facebook page. Empty hides Facebook on the storefront."
              disabled={!canManage}
            />
            <Input
              label="Instagram URL"
              value={draft.instagram}
              onChange={(event) => setDraft({ ...draft, instagram: event.target.value })}
              placeholder="https://instagram.com/your-profile"
              helperText="Store Instagram profile. Empty hides Instagram on the storefront."
              disabled={!canManage}
            />
            <Input
              label="Messenger link"
              value={draft.messenger}
              onChange={(event) => setDraft({ ...draft, messenger: event.target.value })}
              placeholder="https://m.me/your-page"
              helperText="Opens a chat with the store in Messenger. Empty hides Messenger on the storefront."
              disabled={!canManage}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Links open in a new tab so the shop stays open.
            {!canManage && " — Social links are read-only without the settings.manage permission."}
          </p>

          {canManage && (
            <SettingsSaveBar
              dirty={dirty}
              saving={saving}
              error={message?.type === "error" ? message.text : null}
              success={message?.type === "success" ? message.text : null}
              onSave={handleSave}
              onReset={handleReset}
              saveLabel="Save social links"
            />
          )}
        </>
      ) : null}
    </SettingsSection>
  );
}
