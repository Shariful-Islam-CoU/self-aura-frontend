"use client";

// Payment settings. Reads GET /settings/payments (all roles, read-only for
// manager/staff) and PATCH /settings/payments (owner only). Field rules mirror
// the backend paymentSettingsUpdateSchema + phone util:
//   - bkash: enabled toggle + merchant number (Bangladesh mobile number,
//     01XXXXXXXXX / +8801XXXXXXXXX / 8801XXXXXXXXX; stored as 01XXXXXXXXX)
//   - nagad: same as bkash
//   - cod: enabled toggle only (no number)
// Empty number fields clear the configured number. Nothing is persisted
// optimistically - the form state is replaced by the backend response.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { SettingsSection } from "./SettingsSection";
import { SettingsSaveBar } from "./SettingsSaveBar";
import { settingsClient } from "../services/settingsService";
import { settingsErrorMessage } from "../utils";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/LoadingState";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import type { PaymentSettingsData } from "../types";

interface PaymentDraft {
  bkashEnabled: boolean;
  bkashNumber: string;
  nagadEnabled: boolean;
  nagadNumber: string;
  codEnabled: boolean;
}

const toDraft = (data: PaymentSettingsData): PaymentDraft => ({
  bkashEnabled: data.bkash.enabled,
  bkashNumber: data.bkash.number,
  nagadEnabled: data.nagad.enabled,
  nagadNumber: data.nagad.number,
  codEnabled: data.cod.enabled,
});

// Mirrors the backend BD mobile number check (01XXXXXXXXX / +8801XXXXXXXXX /
// 8801XXXXXXXXX). The backend performs the authoritative validation.
const isBangladeshMobileNumber = (value: string): boolean =>
  /^(01|\+?8801)\d{9}$/.test(value.trim());

const validateDraft = (draft: PaymentDraft): string | null => {
  if (draft.bkashNumber.trim() && !isBangladeshMobileNumber(draft.bkashNumber)) {
    return "The bKash number must be a valid Bangladesh mobile number, for example 01812345678.";
  }
  if (draft.nagadNumber.trim() && !isBangladeshMobileNumber(draft.nagadNumber)) {
    return "The Nagad number must be a valid Bangladesh mobile number, for example 01611112222.";
  }
  return null;
};

export function PaymentSettings() {
  const { canAccess } = useAuth();
  // PATCH /settings/payments requires settings.manage (backend enforces).
  const canManage = canAccess("settings.manage");

  const [settings, setSettings] = useState<PaymentSettingsData | null>(null);
  const [draft, setDraft] = useState<PaymentDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await settingsClient.getPaymentSettings();
      setSettings(data);
      setDraft(toDraft(data));
      setLoadError(null);
      setMessage(null);
    } catch (err) {
      setLoadError(settingsErrorMessage(err, "Unable to load payment settings."));
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

    const payload: {
      bkash?: { enabled?: boolean; number?: string };
      nagad?: { enabled?: boolean; number?: string };
      cod?: { enabled?: boolean };
    } = {};
    if (draft.bkashEnabled !== settings.bkash.enabled) {
      payload.bkash = { ...payload.bkash, enabled: draft.bkashEnabled };
    }
    if (draft.bkashNumber !== settings.bkash.number) {
      payload.bkash = { ...payload.bkash, number: draft.bkashNumber.trim() };
    }
    if (draft.nagadEnabled !== settings.nagad.enabled) {
      payload.nagad = { ...payload.nagad, enabled: draft.nagadEnabled };
    }
    if (draft.nagadNumber !== settings.nagad.number) {
      payload.nagad = { ...payload.nagad, number: draft.nagadNumber.trim() };
    }
    if (draft.codEnabled !== settings.cod.enabled) {
      payload.cod = { enabled: draft.codEnabled };
    }

    if (Object.keys(payload).length === 0) {
      setMessage({ type: "error", text: "No changes to save." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const updated = await settingsClient.updatePaymentSettings(payload);
      setSettings(updated);
      setDraft(toDraft(updated));
      setMessage({ type: "success", text: "Payment settings updated." });
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
      title="Payment methods"
      description="Merchant numbers and enabled flags for the manual payment methods — bKash, Nagad and cash on delivery."
    >
      {loadError && !settings ? (
        <ErrorState
          title="Unable to load payment settings"
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
          <div className="space-y-6">
            <div className="rounded-md border border-input p-4">
              <Switch
                label="Accept bKash payments"
                id="payment-bkash-enabled"
                checked={draft.bkashEnabled}
                onChange={(event) =>
                  setDraft({ ...draft, bkashEnabled: event.target.checked })
                }
                disabled={!canManage}
              />
              <div className="mt-3">
                <Input
                  label="bKash merchant number"
                  id="payment-bkash-number"
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                  value={draft.bkashNumber}
                  onChange={(event) =>
                    setDraft({ ...draft, bkashNumber: event.target.value })
                  }
                  helperText="The number customers send money to, for example 01812345678. Displayed when this method is enabled."
                  disabled={!canManage}
                />
              </div>
            </div>

            <div className="rounded-md border border-input p-4">
              <Switch
                label="Accept Nagad payments"
                id="payment-nagad-enabled"
                checked={draft.nagadEnabled}
                onChange={(event) =>
                  setDraft({ ...draft, nagadEnabled: event.target.checked })
                }
                disabled={!canManage}
              />
              <div className="mt-3">
                <Input
                  label="Nagad merchant number"
                  id="payment-nagad-number"
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                  value={draft.nagadNumber}
                  onChange={(event) =>
                    setDraft({ ...draft, nagadNumber: event.target.value })
                  }
                  helperText="The number customers send money to, for example 01611112222. Displayed when this method is enabled."
                  disabled={!canManage}
                />
              </div>
            </div>

            <div className="rounded-md border border-input p-4">
              <Switch
                label="Accept cash on delivery"
                id="payment-cod-enabled"
                checked={draft.codEnabled}
                onChange={(event) =>
                  setDraft({ ...draft, codEnabled: event.target.checked })
                }
                disabled={!canManage}
              />
              <p className="mt-1.5 text-sm text-muted-foreground">
                COD orders are collected on delivery and never require manual
                verification.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Manual bKash/Nagad transactions are only accepted after a staff
            member verifies them in the Payments section.
            {!canManage && " — Payment settings are read-only without the settings.manage permission."}
          </p>

          {canManage && (
            <SettingsSaveBar
              dirty={dirty}
              saving={saving}
              error={message?.type === "error" ? message.text : null}
              success={message?.type === "success" ? message.text : null}
              onSave={handleSave}
              onReset={handleReset}
              saveLabel="Save payment settings"
            />
          )}
        </>
      ) : null}
    </SettingsSection>
  );
}