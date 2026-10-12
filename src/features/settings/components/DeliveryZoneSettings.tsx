"use client";

// Delivery zone management inside Settings.
//
// Backend contract (read-only source of truth, see routes/deliveryZone.routes.ts):
//   GET    /api/delivery-zones/management/delivery-zones        listDeliveryZonesQuerySchema
//   POST   /api/delivery-zones/management/delivery-zones        createDeliveryZoneSchema
//   PATCH  /api/delivery-zones/management/delivery-zones/:id    updateDeliveryZoneSchema
//   PATCH  /api/delivery-zones/management/delivery-zones/:id/toggle
//   DELETE /api/delivery-zones/management/delivery-zones/:id
//
// The doubled "delivery-zones" segment is the backend's existing mount shape
// (routes/index.ts -> routes/deliveryZone.routes.ts). These paths were checked
// against the running API, not guessed.
//
// Permissions come from the backend routes (deliveryZones.view / .create /
// .edit / .delete). This section only gates the editing UI on `canAccess` for
// a better UX - a 403 from the backend is still rendered as a permission
// message, never a logout.
//
// Address matching on the backend (deliveryZoneRepository.findMatchingZone) runs
// in this order, so the area editor explains it to the user:
//   1. exact postal code   2. exact area + district
//   3. exact district     4. keyword substring
// An area must contain at least one of district / area / postalCode / keywords.

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
  DeliveryRuleType,
  DeliveryZone,
  DeliveryZoneAreaInput,
} from "../types";

export const RULE_TYPE_OPTIONS: Array<{ value: DeliveryRuleType | ""; label: string }> = [
  { value: "", label: "Auto (from fields)" },
  { value: "exact_area", label: "Exact area (district + area)" },
  { value: "district_default", label: "District default (whole district)" },
  { value: "country_default", label: "Country default (whole country)" },
  { value: "postal_code", label: "Postal code" },
  { value: "area", label: "Area only (any district)" },
  { value: "keyword", label: "Keyword fallback" },
];

interface AreaDraft {
  ruleType: DeliveryRuleType | "";
  district: string;
  area: string;
  postalCode: string;
  country: string;
  aliases: string;
  charge: string;
  customerName: string;
  customerNameBn: string;
  description: string;
  descriptionBn: string;
  keywords: string;
}

interface ZoneDraft {
  code: string;
  name: string;
  description: string;
  baseCharge: string;
  priority: string;
  freeDeliveryEnabled: boolean;
  freeDeliveryMinimumAmount: string;
  estimatedMinDays: string;
  estimatedMaxDays: string;
  isActive: boolean;
  sortOrder: string;
  areas: AreaDraft[];
}

const emptyArea = (): AreaDraft => ({
  ruleType: "",
  district: "",
  area: "",
  postalCode: "",
  country: "Bangladesh",
  aliases: "",
  charge: "",
  customerName: "",
  customerNameBn: "",
  description: "",
  descriptionBn: "",
  keywords: "",
});

const emptyDraft = (): ZoneDraft => ({
  code: "",
  name: "",
  description: "",
  baseCharge: "0",
  priority: "0",
  freeDeliveryEnabled: false,
  freeDeliveryMinimumAmount: "",
  estimatedMinDays: "1",
  estimatedMaxDays: "3",
  isActive: true,
  sortOrder: "0",
  areas: [emptyArea()],
});

function toAreas(areas: DeliveryZoneAreaInput[] | undefined): AreaDraft[] {
  if (!areas || areas.length === 0) return [emptyArea()];
  return areas.map((area) => ({
    ruleType: area.ruleType ?? "",
    district: area.district ?? "",
    area: area.area ?? "",
    postalCode: area.postalCode ?? "",
    country: area.country ?? "Bangladesh",
    aliases: (area.aliases ?? []).join(", "),
    charge: area.charge === undefined ? "" : String(area.charge),
    customerName: area.customerName ?? "",
    customerNameBn: area.customerNameBn ?? "",
    description: area.description ?? "",
    descriptionBn: area.descriptionBn ?? "",
    keywords: (area.keywords ?? []).join(", "),
  }));
}

function toDraft(zone: DeliveryZone): ZoneDraft {
  return {
    code: zone.code,
    name: zone.name,
    description: zone.description ?? "",
    baseCharge: String(zone.baseCharge ?? 0),
    priority: String(zone.priority ?? 0),
    freeDeliveryEnabled: zone.freeDeliveryEnabled ?? false,
    freeDeliveryMinimumAmount:
      zone.freeDeliveryMinimumAmount === undefined ||
      zone.freeDeliveryMinimumAmount === null
        ? ""
        : String(zone.freeDeliveryMinimumAmount),
    estimatedMinDays: String(zone.estimatedMinDays ?? 1),
    estimatedMaxDays: String(zone.estimatedMaxDays ?? 3),
    isActive: zone.isActive ?? true,
    sortOrder: String(zone.sortOrder ?? 0),
    areas: toAreas(zone.areas),
  };
}

/**
 * Builds the request body. Numeric strings are converted and empty optional
 * fields are omitted so the backend's `.optional()` rules apply instead of
 * receiving `""` (which would fail number validation with a 422).
 */
function toPayload(draft: ZoneDraft): CreateDeliveryZoneInput {
  const num = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const areas: DeliveryZoneAreaInput[] = draft.areas
    .map((area) => {
      const keywords = area.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);
      const aliases = area.aliases
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean);
      const entry: DeliveryZoneAreaInput = {};
      if (area.ruleType) entry.ruleType = area.ruleType;
      if (area.district.trim()) entry.district = area.district.trim();
      if (area.area.trim()) entry.area = area.area.trim();
      if (area.postalCode.trim()) entry.postalCode = area.postalCode.trim();
      if (area.country.trim()) entry.country = area.country.trim();
      if (aliases.length > 0) entry.aliases = aliases;
      const charge = num(area.charge);
      if (charge !== undefined) entry.charge = charge;
      if (area.customerName.trim()) entry.customerName = area.customerName.trim();
      if (area.customerNameBn.trim()) entry.customerNameBn = area.customerNameBn.trim();
      if (area.description.trim()) entry.description = area.description.trim();
      if (area.descriptionBn.trim()) entry.descriptionBn = area.descriptionBn.trim();
      if (keywords.length > 0) entry.keywords = keywords;
      return entry;
    })
    .filter(
      (entry) =>
        entry.district !== undefined ||
        entry.area !== undefined ||
        entry.postalCode !== undefined ||
        entry.country !== undefined ||
        (entry.keywords !== undefined && entry.keywords.length > 0) ||
        entry.ruleType !== undefined
    );

  const payload: CreateDeliveryZoneInput = {
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    areas,
    baseCharge: num(draft.baseCharge) ?? 0,
    freeDeliveryEnabled: draft.freeDeliveryEnabled,
    estimatedMinDays: num(draft.estimatedMinDays) ?? 0,
    estimatedMaxDays: num(draft.estimatedMaxDays) ?? 1,
    isActive: draft.isActive,
    priority: num(draft.priority) ?? 0,
    sortOrder: num(draft.sortOrder) ?? 0,
  };

  if (draft.description.trim()) payload.description = draft.description.trim();

  const freeMinimum = num(draft.freeDeliveryMinimumAmount);
  if (freeMinimum !== undefined) payload.freeDeliveryMinimumAmount = freeMinimum;

  return payload;
}

export function DeliveryZoneSettings() {
  const { canAccess } = useAuth();
  const canEdit = canAccess("deliveryZones.create") || canAccess("deliveryZones.edit");
  const canDelete = canAccess("deliveryZones.delete");

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ZoneDraft>(emptyDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // limit=100 is the backend maximum; delivery zone lists are small enough
      // that paging here would only add UI for no benefit.
      const result = await settingsClient.getDeliveryZones({ limit: 100, sortBy: "sortOrder", sortOrder: "asc" });
      setZones(result.items ?? []);
    } catch (error) {
      setLoadError(settingsErrorMessage(error, "Unable to load delivery zones."));
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

  const startEdit = useCallback((zone: DeliveryZone) => {
    setEditingId(zone._id);
    setDraft(toDraft(zone));
    setFormError(null);
  }, []);

  const handleSave = useCallback(async () => {
    setFormError(null);

    if (draft.code.trim().length < 2) {
      setFormError("Code must be at least 2 characters.");
      return;
    }
    if (!draft.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (toPayload(draft).areas.length === 0) {
      setFormError(
        "Each area needs at least one of district, area, postal code or keywords."
      );
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
        await settingsClient.createDeliveryZone(payload);
      } else if (editingId) {
        await settingsClient.updateDeliveryZone(editingId, payload);
      }
      resetForm();
      await load();
    } catch (error) {
      setFormError(settingsErrorMessage(error, "Unable to save the delivery zone."));
    } finally {
      setSaving(false);
    }
  }, [draft, editingId, load, resetForm]);

  const handleToggle = useCallback(
    async (zone: DeliveryZone) => {
      try {
        await settingsClient.toggleDeliveryZone(zone._id, !zone.isActive);
        await load();
      } catch (error) {
        setFormError(
          settingsErrorMessage(error, "Unable to update the delivery zone status.")
        );
      }
    },
    [load]
  );

  const handleDelete = useCallback(
    async (zone: DeliveryZone) => {
      const confirmed = window.confirm(
        `Delete zone "${zone.name}"? This only succeeds if no order has ever used it. ` +
          `If orders reference it, deactivate it instead so history stays explainable.`
      );
      if (!confirmed) return;

      setDeletingId(zone._id);
      try {
        await settingsClient.deleteDeliveryZone(zone._id);
        if (editingId === zone._id) resetForm();
        await load();
      } catch (error) {
        setFormError(settingsErrorMessage(error, "Unable to delete the delivery zone."));
      } finally {
        setDeletingId(null);
      }
    },
    [editingId, load, resetForm]
  );

  const updateArea = (index: number, patch: Partial<AreaDraft>) => {
    setDraft((prev) => ({
      ...prev,
      areas: prev.areas.map((area, i) => (i === index ? { ...area, ...patch } : area)),
    }));
  };

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
        title="Unable to load delivery zones"
        description={loadError}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Delivery Zones"
        description="Zones decide whether the storefront can deliver to a customer address and what the delivery charge is. Checkout matches an address against postal code, then area + district, then district, then keywords."
      >
        {zones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No delivery zones yet. Without a zone, checkout rejects every address
            with &ldquo;Delivery is currently unavailable for this area&rdquo;.
          </p>
        ) : (
          <ul className="space-y-3">
            {zones.map((zone) => (
              <li
                key={zone._id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{zone.name}</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {zone.code}
                    </code>
                    <span
                      className={
                        zone.isActive
                          ? "text-xs font-medium text-green-600"
                          : "text-xs font-medium text-muted-foreground"
                      }
                    >
                      {zone.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Base charge {zone.baseCharge}
                    {zone.freeDeliveryEnabled && zone.freeDeliveryMinimumAmount
                      ? ` · free over ${zone.freeDeliveryMinimumAmount}`
                      : ""}
                    {` · ${zone.estimatedMinDays}-${zone.estimatedMaxDays} days`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {zone.areas.length} area{zone.areas.length === 1 ? "" : "s"}:{" "}
                    {zone.areas
                      .map((area) => {
                        const parts = [area.postalCode, area.area, area.district, area.country]
                          .filter(Boolean)
                          .join(" / ");
                        if (!parts) return null;
                        return area.ruleType ? `${parts} (${area.ruleType})` : parts;
                      })
                      .filter(Boolean)
                      .join(", ") || "no matching fields"}
                  </p>
                  {zone.areas.some((area) => area.charge !== undefined) && (
                    <p className="text-xs text-muted-foreground">
                      Rule-level charges:{" "}
                      {zone.areas
                        .map((area) =>
                          area.charge !== undefined
                            ? `${
                                [area.area, area.district, area.country]
                                  .filter(Boolean)
                                  .join(" / ") || "rule"
                              } = ${area.charge}`
                            : null
                        )
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>

                {canEdit && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      id={`zone-active-${zone._id}`}
                      label="Active"
                      checked={zone.isActive}
                      onChange={() => void handleToggle(zone)}
                      disabled={deletingId === zone._id}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(zone)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {canDelete && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDelete(zone)}
                        disabled={deletingId === zone._id}
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
            Add delivery zone
          </Button>
        )}
      </SettingsSection>

      {canEdit && editingId !== null && (
        <SettingsSection
          title={editingId === "new" ? "New delivery zone" : "Edit delivery zone"}
          description="Saved values come back from the backend and replace this form."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="zone-code" className="text-sm font-medium">
                Code
              </label>
              <Input
                id="zone-code"
                value={draft.code}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                placeholder="BARISAL"
                maxLength={50}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Uppercase letters, numbers, hyphens and underscores only.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="zone-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="zone-name"
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Barisal Division"
                maxLength={100}
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="zone-description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="zone-description"
                value={draft.description}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, description: e.target.value }))
                }
                maxLength={500}
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="zone-base-charge" className="text-sm font-medium">
                Base charge
              </label>
              <Input
                id="zone-base-charge"
                type="number"
                min={0}
                step="0.01"
                value={draft.baseCharge}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, baseCharge: e.target.value }))
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="zone-priority" className="text-sm font-medium">
                Priority
              </label>
              <Input
                id="zone-priority"
                type="number"
                min={0}
                step={1}
                value={draft.priority}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, priority: e.target.value }))
                }
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Higher wins when two zones match the same area.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="zone-min-days" className="text-sm font-medium">
                Minimum days
              </label>
              <Input
                id="zone-min-days"
                type="number"
                min={0}
                step={1}
                value={draft.estimatedMinDays}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, estimatedMinDays: e.target.value }))
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="zone-max-days" className="text-sm font-medium">
                Maximum days
              </label>
              <Input
                id="zone-max-days"
                type="number"
                min={1}
                step={1}
                value={draft.estimatedMaxDays}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, estimatedMaxDays: e.target.value }))
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="zone-sort-order" className="text-sm font-medium">
                Sort order
              </label>
              <Input
                id="zone-sort-order"
                type="number"
                min={0}
                step={1}
                value={draft.sortOrder}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, sortOrder: e.target.value }))
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-3 sm:col-span-2">
              <Switch
                id="zone-is-active"
                label="Active"
                checked={draft.isActive}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, isActive: event.target.checked }))
                }
                disabled={saving}
              />
              <Switch
                id="zone-free-delivery"
                label="Free delivery"
                checked={draft.freeDeliveryEnabled}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    freeDeliveryEnabled: event.target.checked,
                  }))
                }
                disabled={saving}
              />
              {draft.freeDeliveryEnabled && (
                <div className="max-w-xs space-y-1.5">
                  <label htmlFor="zone-free-minimum" className="text-sm font-medium">
                    Free delivery minimum
                  </label>
                  <Input
                    id="zone-free-minimum"
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.freeDeliveryMinimumAmount}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        freeDeliveryMinimumAmount: e.target.value,
                      }))
                    }
                    disabled={saving}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Covered areas</h4>
                <p className="text-xs text-muted-foreground">
                  At least one field per row. Leave a field blank to skip it in
                  matching.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft((prev) => ({ ...prev, areas: [...prev.areas, emptyArea()] }))
                }
                disabled={saving}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add area
              </Button>
            </div>

            {draft.areas.map((area, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-md border p-3 sm:grid-cols-5"
              >
                <div className="space-y-1.5 sm:col-span-5">
                  <label
                    htmlFor={`zone-area-rule-type-${index}`}
                    className="text-xs font-medium"
                  >
                    Rule type
                  </label>
                  <select
                    id={`zone-area-rule-type-${index}`}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={area.ruleType}
                    onChange={(e) =>
                      updateArea(index, {
                        ruleType: e.target.value as DeliveryRuleType | "",
                      })
                    }
                    disabled={saving}
                  >
                    {RULE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`zone-area-area-${index}`}
                    className="text-xs font-medium"
                  >
                    Area
                  </label>
                  <Input
                    id={`zone-area-area-${index}`}
                    value={area.area}
                    onChange={(e) => updateArea(index, { area: e.target.value })}
                    placeholder="e.g. Tomsom Bridge"
                    maxLength={100}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`zone-area-district-${index}`}
                    className="text-xs font-medium"
                  >
                    District
                  </label>
                  <Input
                    id={`zone-area-district-${index}`}
                    value={area.district}
                    onChange={(e) => updateArea(index, { district: e.target.value })}
                    placeholder="e.g. Cumilla"
                    maxLength={100}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`zone-area-country-${index}`}
                    className="text-xs font-medium"
                  >
                    Country
                  </label>
                  <Input
                    id={`zone-area-country-${index}`}
                    value={area.country}
                    onChange={(e) => updateArea(index, { country: e.target.value })}
                    maxLength={100}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`zone-area-postal-${index}`}
                    className="text-xs font-medium"
                  >
                    Postal code
                  </label>
                  <Input
                    id={`zone-area-postal-${index}`}
                    value={area.postalCode}
                    onChange={(e) => updateArea(index, { postalCode: e.target.value })}
                    maxLength={20}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`zone-area-charge-${index}`}
                    className="text-xs font-medium"
                  >
                    Rule charge (blank = zone base)
                  </label>
                  <Input
                    id={`zone-area-charge-${index}`}
                    type="number"
                    min={0}
                    step="any"
                    value={area.charge}
                    onChange={(e) => updateArea(index, { charge: e.target.value })}
                    placeholder="e.g. 0 for free area"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label
                    htmlFor={`zone-area-aliases-${index}`}
                    className="text-xs font-medium"
                  >
                    Aliases (Bangla / variant spellings)
                  </label>
                  <Input
                    id={`zone-area-aliases-${index}`}
                    value={area.aliases}
                    onChange={(e) => updateArea(index, { aliases: e.target.value })}
                    placeholder="টমছম ব্রিজ, Tomshom Bridge"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`zone-area-keywords-${index}`}
                    className="text-xs font-medium"
                  >
                    Keywords (legacy fallback)
                  </label>
                  <Input
                    id={`zone-area-keywords-${index}`}
                    value={area.keywords}
                    onChange={(e) => updateArea(index, { keywords: e.target.value })}
                    placeholder="comma, separated"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label
                    htmlFor={`zone-area-customer-name-${index}`}
                    className="text-xs font-medium"
                  >
                    Customer-facing name
                  </label>
                  <Input
                    id={`zone-area-customer-name-${index}`}
                    value={area.customerName}
                    onChange={(e) => updateArea(index, { customerName: e.target.value })}
                    placeholder="Shown on the storefront rules list"
                    maxLength={120}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`zone-area-customer-name-bn-${index}`}
                    className="text-xs font-medium"
                  >
                    Name (বাংলা)
                  </label>
                  <Input
                    id={`zone-area-customer-name-bn-${index}`}
                    value={area.customerNameBn}
                    onChange={(e) => updateArea(index, { customerNameBn: e.target.value })}
                    placeholder="টমছম ব্রিজ"
                    maxLength={120}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <label
                    htmlFor={`zone-area-description-${index}`}
                    className="text-xs font-medium"
                  >
                    Customer-facing description
                  </label>
                  <Input
                    id={`zone-area-description-${index}`}
                    value={area.description}
                    onChange={(e) => updateArea(index, { description: e.target.value })}
                    placeholder="e.g. Free delivery for Tomsom Bridge"
                    maxLength={300}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label
                    htmlFor={`zone-area-description-bn-${index}`}
                    className="text-xs font-medium"
                  >
                    Description (বাংলা)
                  </label>
                  <Input
                    id={`zone-area-description-bn-${index}`}
                    value={area.descriptionBn}
                    onChange={(e) => updateArea(index, { descriptionBn: e.target.value })}
                    placeholder="টমছম ব্রিজে ফ্রি ডেলিভারি"
                    maxLength={300}
                    disabled={saving}
                  />
                </div>
                {draft.areas.length > 1 && (
                  <div className="sm:col-span-5 sm:flex sm:justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          areas: prev.areas.filter((_, i) => i !== index),
                        }))
                      }
                      disabled={saving}
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Remove area
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}

          <div className="flex items-center gap-2 border-t pt-4">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {saving ? "Saving" : "Save zone"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
          </div>
        </SettingsSection>
      )}

      {!canEdit && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Truck className="h-4 w-4" aria-hidden="true" />
          You can view delivery zones but need the delivery zone permissions to
          change them.
        </p>
      )}
    </div>
  );
}