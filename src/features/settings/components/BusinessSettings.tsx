"use client";

// Business settings. Reads GET /settings/business (all roles, read-only for
// manager/staff) and PATCH /settings/business (owner only). Field rules mirror
// the backend businessSettingsUpdateSchema:
//   currency: exactly 3 uppercase letters
//   timezone: 1-50 characters
//   taxRate: number 0-100
//   lowStockAlertThreshold: whole number >= 0 (backend has no way to clear it,
//   so an empty field keeps the current value - the draft is re-synced to the
//   server value after saving)
//   allowNegativeStock: boolean
// Empty fields are simply excluded from the PATCH body. Nothing is persisted
// optimistically - the form state is replaced by the backend response.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { SettingsSection } from "./SettingsSection";
import { SettingsSaveBar } from "./SettingsSaveBar";
import { settingsClient } from "../services/settingsService";
import { settingsErrorMessage, formatSettingsDate } from "../utils";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/LoadingState";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import type { BusinessSettings as BusinessSettingsType } from "../types";

interface BusinessDraft {
  currency: string;
  timezone: string;
  taxRate: string;
  lowStockAlertThreshold: string;
  allowNegativeStock: boolean;
}

const toDraft = (data: BusinessSettingsType): BusinessDraft => ({
  currency: data.currency,
  timezone: data.timezone,
  taxRate: String(data.taxRate),
  lowStockAlertThreshold:
    data.lowStockAlertThreshold === null ? "" : String(data.lowStockAlertThreshold),
  allowNegativeStock: data.allowNegativeStock,
});

const validateDraft = (draft: BusinessDraft): string | null => {
  const currency = draft.currency.trim();
  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    return "Currency must be a 3-letter code (for example USD or BDT).";
  }
  if (draft.timezone.trim().length > 50) {
    return "Timezone must be at most 50 characters.";
  }
  if (draft.taxRate !== "") {
    const taxRate = Number(draft.taxRate);
    if (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      return "Tax rate must be a number between 0 and 100.";
    }
  }
  if (draft.lowStockAlertThreshold !== "") {
    const threshold = Number(draft.lowStockAlertThreshold);
    if (!Number.isInteger(threshold) || threshold < 0) {
      return "Low stock alert threshold must be a whole number of 0 or more.";
    }
  }
  return null;
};

export function BusinessSettings() {
  const { canAccess } = useAuth();
  // PATCH /settings/business requires settings.manage (backend enforces).
  const canManage = canAccess("settings.manage");

  const [settings, setSettings] = useState<BusinessSettingsType | null>(null);
  const [draft, setDraft] = useState<BusinessDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await settingsClient.getBusinessSettings();
      setSettings(data);
      setDraft(toDraft(data));
      setLoadError(null);
      setMessage(null);
    } catch (err) {
      setLoadError(settingsErrorMessage(err, "Unable to load business settings."));
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
    // Invoked through a local async wrapper so the effect body performs no
    // synchronous state updates.
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

    const currency = draft.currency.trim().toUpperCase();
    const timezone = draft.timezone.trim();
    const taxRate = draft.taxRate === "" ? undefined : Number(draft.taxRate);
    const threshold =
      draft.lowStockAlertThreshold === "" ? undefined : Number(draft.lowStockAlertThreshold);

    const payload: Record<string, string | number | boolean> = {};
    if (currency !== settings.currency) payload.currency = currency;
    if (timezone !== settings.timezone) payload.timezone = timezone;
    if (taxRate !== undefined && taxRate !== settings.taxRate) payload.taxRate = taxRate;
    if (threshold !== undefined && threshold !== settings.lowStockAlertThreshold) {
      payload.lowStockAlertThreshold = threshold;
    }
    if (draft.allowNegativeStock !== settings.allowNegativeStock) {
      payload.allowNegativeStock = draft.allowNegativeStock;
    }

    if (Object.keys(payload).length === 0) {
      setMessage({ type: "error", text: "No changes to save." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const updated = await settingsClient.updateBusinessSettings(payload);
      setSettings(updated);
      setDraft(toDraft(updated));
      setMessage({ type: "success", text: "Business settings updated." });
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
      title="Business"
      description="Store-level configuration: currency, tax rate and stock behavior (backend-owned)."
    >
      {loadError && !settings ? (
        <ErrorState
          title="Unable to load business settings"
          description={loadError}
          onRetry={handleRetry}
        />
      ) : loading && !settings ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : draft ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Currency"
              value={draft.currency}
              onChange={(event) =>
                setDraft({ ...draft, currency: event.target.value.toUpperCase() })
              }
              placeholder="USD"
              helperText="3-letter code, for example USD or BDT."
              disabled={!canManage}
              required
            />
            <Input
              label="Timezone"
              value={draft.timezone}
              onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}
              placeholder="UTC"
              helperText="Maximum 50 characters."
              disabled={!canManage}
              required
            />
            <Input
              label="Tax rate (%)"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={draft.taxRate}
              onChange={(event) => setDraft({ ...draft, taxRate: event.target.value })}
              helperText="A number between 0 and 100. Leave empty to keep the current value."
              disabled={!canManage}
            />
            <Input
              label="Low stock alert threshold"
              type="number"
              min={0}
              step={1}
              value={draft.lowStockAlertThreshold}
              onChange={(event) =>
                setDraft({ ...draft, lowStockAlertThreshold: event.target.value })
              }
              helperText="Whole number of 0 or more. Leave empty to keep the current value."
              disabled={!canManage}
            />
          </div>

          <div className="rounded-md border border-input p-4">
            <Switch
              label="Allow negative stock"
              id="allow-negative-stock"
              checked={draft.allowNegativeStock}
              onChange={(event) =>
                setDraft({ ...draft, allowNegativeStock: event.target.checked })
              }
              disabled={!canManage}
            />
            <p className="mt-1.5 text-sm text-muted-foreground">
              When enabled, stock levels may go below zero. When disabled, sales that would exceed
              available stock are rejected.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Last updated: {formatSettingsDate(settings?.updatedAt ?? "")}
            {!canManage && " — Business settings are read-only without the settings.manage permission."}
          </p>

          {canManage && (
            <SettingsSaveBar
              dirty={dirty}
              saving={saving}
              error={message?.type === "error" ? message.text : null}
              success={message?.type === "success" ? message.text : null}
              onSave={handleSave}
              onReset={handleReset}
              saveLabel="Save business settings"
            />
          )}
        </>
      ) : null}
    </SettingsSection>
  );
}