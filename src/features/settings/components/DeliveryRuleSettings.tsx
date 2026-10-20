"use client";

// Delivery rule management inside Settings.
//
// Backend contract (read-only source of truth, see routes/deliveryRule.routes.ts):
//   GET    /api/delivery-rules/management/delivery-rules        listDeliveryRulesQuerySchema
//   POST   /api/delivery-rules/management/delivery-rules        createDeliveryRuleSchema
//   PATCH  /api/delivery-rules/management/delivery-rules/:id    updateDeliveryRuleSchema
//   PATCH  /api/delivery-rules/management/delivery-rules/:id/toggle
//   DELETE /api/delivery-rules/management/delivery-rules/:id
//
// Permissions come from the backend routes (deliveryRules.view / .create /
// .edit / .delete). This section only gates the editing UI on `canAccess` for
// a better UX - a 403 from the backend is still rendered as a permission
// message, never a logout.

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Truck, Pencil, X, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { SettingsSection } from "./SettingsSection";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/LoadingState";
import { settingsClient } from "../services/settingsService";
import { settingsErrorMessage } from "../utils";
import type {
  CreateDeliveryZoneInput,
  DeliveryRule,
  DeliveryRuleInput,
  DeliveryZone,
} from "../types";

const emptyDraft = (): DeliveryRuleInput => ({
  name: "",
  price: 0,
  estimatedMinDays: 1,
  estimatedMaxDays: 3,
  sortOrder: 0,
  isActive: true,
});

function toPayload(draft: DeliveryRuleInput): DeliveryRuleInput {
  return {
    name: draft.name.trim(),
    price: Number(draft.price) ?? 0,
    estimatedMinDays: Number(draft.estimatedMinDays) ?? 1,
    estimatedMaxDays: Number(draft.estimatedMaxDays) ?? 3,
    sortOrder: Number(draft.sortOrder) ?? 0,
    isActive: draft.isActive,
  };
}

export function DeliveryRuleSettings() {
  const { canAccess } = useAuth();
  const canEdit = canAccess("deliveryRules.create") || canAccess("deliveryRules.edit");
  const canDelete = canAccess("deliveryRules.delete");

  const [rules, setRules] = useState<DeliveryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DeliveryRuleInput>(emptyDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // limit=100 is the backend maximum; delivery rule lists are small enough
      // that paging here would only add UI for no benefit.
      const result = await settingsClient.getDeliveryRules({ limit: 100, sortBy: "price", sortOrder: "desc" });
      setRules(result.items ?? []);
    } catch (error) {
      setLoadError(settingsErrorMessage(error, "Unable to load delivery rules."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wrapped in a local async function so the effect body itself performs no
    // synchronous state updates (matches SystemSettings).
    const init = async () => {
      await load();
    };
    void init();
  }, [load]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setDraft(emptyDraft());
    setFormError(null);
  }, []);

  const startCreate = useCallback(() => {
    setEditingId("new");
    setDraft(emptyDraft());
    setFormError(null);
  }, []);

  const startEdit = useCallback((rule: DeliveryRule) => {
    setEditingId(rule._id);
    setDraft({
      name: rule.name,
      price: rule.price,
      estimatedMinDays: rule.estimatedMinDays,
      estimatedMaxDays: rule.estimatedMaxDays,
      sortOrder: rule.sortOrder,
      isActive: rule.isActive,
    });
    setFormError(null);
  }, []);

  const handleSave = useCallback(async () => {
    setFormError(null);

    if (!draft.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (Number(draft.price) < 0) {
      setFormError("Price cannot be negative.");
      return;
    }
    const min = Number(draft.estimatedMinDays || 0);
    const max = Number(draft.estimatedMaxDays || 0);
    if (Number.isFinite(min) && Number.isFinite(max) && max < min) {
      setFormError("Maximum days cannot be less than minimum days.");
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload(draft);
      if (editingId === "new") {
        await settingsClient.createDeliveryRule(payload);
      } else if (editingId) {
        await settingsClient.updateDeliveryRule(editingId, payload);
      }
      resetForm();
      await load();
    } catch (error) {
      setFormError(settingsErrorMessage(error, "Unable to save the delivery rule."));
    } finally {
      setSaving(false);
    }
  }, [draft, editingId, load, resetForm]);

  const handleToggle = useCallback(
    async (rule: DeliveryRule) => {
      const newActive = !rule.isActive;

      // Optimistic update - immediate UI response
      setRules((prev) =>
        prev.map((r) => (r._id === rule._id ? { ...r, isActive: newActive } : r))
      );

      try {
        await settingsClient.toggleDeliveryRule(rule._id, newActive);
        // Server confirmed - keep the optimistic update
      } catch (error) {
        // Revert on failure
        setRules((prev) =>
          prev.map((r) => (r._id === rule._id ? { ...r, isActive: rule.isActive } : r))
        );
        setFormError(
          settingsErrorMessage(error, "Unable to update the delivery rule status.")
        );
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (rule: DeliveryRule) => {
      const confirmed = window.confirm(
        `Delete rule "${rule.name}"? This only succeeds if no order has ever used it. ` +
          `If orders reference it, deactivate it instead so history stays explainable.`
      );
      if (!confirmed) return;

      setDeletingId(rule._id);
      try {
        await settingsClient.deleteDeliveryRule(rule._id);
        if (editingId === rule._id) resetForm();
        await load();
      } catch (error) {
        setFormError(settingsErrorMessage(error, "Unable to delete the delivery rule."));
      } finally {
        setDeletingId(null);
      }
    },
    [editingId, load, resetForm]
  );

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        title="Unable to load delivery rules"
        description={loadError}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Delivery Rules"
        description="Rules decide the delivery charge options shown at checkout. Customers see all active rules and pick one. The highest price is selected by default. Admin can correct wrong selections on the order page."
      >
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No delivery rules yet. Without a rule, checkout shows no delivery options.
          </p>
        ) : (
          <ul className="space-y-3">
            {rules.map((rule) => (
              <li
                key={rule._id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{rule.name}</span>
                    <span
                      className={
                        rule.price === 0
                          ? "text-xs font-medium text-green-600"
                          : "font-medium text-foreground"
                      }
                    >
                      {rule.price === 0 ? "FREE" : `৳${rule.price}`}
                    </span>
                    <span
                      className={
                        rule.isActive
                          ? "text-xs font-medium text-green-600"
                          : "text-xs font-medium text-muted-foreground"
                      }
                    >
                      {rule.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ETA: {rule.estimatedMinDays}–{rule.estimatedMaxDays} days
                    {` · Sort order: ${rule.sortOrder}`}
                  </p>
                </div>

                {canEdit && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      id={`rule-active-${rule._id}`}
                      label="Active"
                      checked={rule.isActive}
                      onChange={() => void handleToggle(rule)}
                      disabled={deletingId === rule._id}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(rule)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {canDelete && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDelete(rule)}
                        disabled={deletingId === rule._id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && editingId === null && (
          <Button type="button" variant="outline" onClick={startCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add delivery rule
          </Button>
        )}
      </SettingsSection>

      {canEdit && editingId !== null && (
        <SettingsSection
          title={editingId === "new" ? "New delivery rule" : "Edit delivery rule"}
          description="Saved values come back from the backend and replace this form."
        >
          {formError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground mb-4"
            >
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="rule-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="rule-name"
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Tomsom Bridge, Cumilla"
                maxLength={100}
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rule-price" className="text-sm font-medium">
                Price (0 = FREE)
              </label>
              <Input
                id="rule-price"
                type="number"
                min={0}
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                placeholder="e.g. 50"
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rule-min-days" className="text-sm font-medium">
                Minimum days
              </label>
              <Input
                id="rule-min-days"
                type="number"
                min={0}
                step={1}
                value={draft.estimatedMinDays}
                onChange={(e) => setDraft((prev) => ({ ...prev, estimatedMinDays: Number(e.target.value) || 0 }))}
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rule-max-days" className="text-sm font-medium">
                Maximum days
              </label>
              <Input
                id="rule-max-days"
                type="number"
                min={1}
                step={1}
                value={draft.estimatedMaxDays}
                onChange={(e) => setDraft((prev) => ({ ...prev, estimatedMaxDays: Number(e.target.value) || 1 }))}
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rule-sort-order" className="text-sm font-medium">
                Sort order
              </label>
              <Input
                id="rule-sort-order"
                type="number"
                min={0}
                step={1}
                value={draft.sortOrder}
                onChange={(e) => setDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Lower values appear first when prices are equal.
              </p>
            </div>

            <div className="space-y-3 sm:col-span-2">
              <Switch
                id="rule-is-active"
                label="Active"
                checked={draft.isActive}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, isActive: event.target.checked }))
                }
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 mt-4">
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : editingId === "new" ? (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create rule
                </>
              ) : (
                <>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </SettingsSection>
      )}
    </div>
  );
}