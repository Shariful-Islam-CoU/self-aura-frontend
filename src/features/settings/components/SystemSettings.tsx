"use client";

// System settings - application settings (backend key-value store).
// Reads GET /settings/app (owner/manager), writes via PATCH /settings/app
// (owner only, upserts a single setting by name).
//
// The backend exposes a generic name/value/description store with no
// predefined keys, so this section shows the full list and lets an owner add
// or update one setting at a time. Values are entered and displayed as text.
// There is no backend endpoint to delete an application setting, so no delete
// action is offered.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { SettingsSection } from "./SettingsSection";
import { settingsClient } from "../services/settingsService";
import { settingsErrorMessage, formatSettingsDate } from "../utils";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/Dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { CheckCircle2, Pencil, Plus } from "lucide-react";
import type { ApplicationSetting } from "../types";

export function SystemSettings() {
  const { canAccess } = useAuth();
  // App settings are editable with settings.manage (backend enforces).
  const canManage = canAccess("settings.manage");

  const [settings, setSettings] = useState<ApplicationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationSetting | null>(null);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await settingsClient.getApplicationSettings();
      setSettings(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(settingsErrorMessage(err, "Unable to load application settings."));
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

  const openAdd = () => {
    setEditing(null);
    setName("");
    setValue("");
    setDescription("");
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (setting: ApplicationSetting) => {
    setEditing(setting);
    setName(setting.name);
    setValue(typeof setting.value === "string" ? setting.value : String(setting.value ?? ""));
    setDescription(setting.description ?? "");
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSaveSetting = async () => {
    if (saving) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    if (trimmedName.length > 100) {
      setFormError("Name must be at most 100 characters.");
      return;
    }
    if (value.trim() === "") {
      setFormError("Value is required.");
      return;
    }
    if (trimmedDescription.length > 500) {
      setFormError("Description must be at most 500 characters.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await settingsClient.updateApplicationSetting({
        name: trimmedName,
        value: value.trim(),
        description: trimmedDescription || undefined,
      });
      await load();
      setDialogOpen(false);
      setSavedMessage("Application setting saved.");
    } catch (err) {
      setFormError(settingsErrorMessage(err, "Unable to save the application setting."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection
      title="System"
      description="Application settings stored by the backend (GET /settings/app)."
    >
      {savedMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success"
        >
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{savedMessage}</span>
        </div>
      )}

      {loadError ? (
        <ErrorState
          title="Unable to load application settings"
          description={loadError}
          onRetry={handleRetry}
        />
      ) : loading ? (
        <LoadingState text="Loading application settings..." />
      ) : settings.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="No application settings yet"
            description="Settings stored by the backend key-value store appear here."
          />
          {canManage && (
            <Button type="button" onClick={openAdd}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add setting
            </Button>
          )}
        </div>
      ) : (
        <>
          {canManage && (
            <div className="flex justify-end">
              <Button type="button" onClick={openAdd}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add setting
              </Button>
            </div>
          )}
          <div className="overflow-x-auto rounded-md border border-input">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Updated</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting._id}>
                    <TableCell className="font-mono text-xs">{setting.name}</TableCell>
                    <TableCell>
                      <span className="block max-w-[220px] truncate font-mono text-xs" title={String(setting.value ?? "")}>
                        {String(setting.value ?? "")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[220px] truncate text-sm text-muted-foreground" title={setting.description ?? ""}>
                        {setting.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {setting.updatedAt ? formatSettingsDate(setting.updatedAt) : "—"}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(setting)}
                          aria-label={`Edit setting ${setting.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit setting: ${editing.name}` : "Add application setting"}</DialogTitle>
            <DialogDescription>
              Saved with PATCH /settings/app. Values are stored as text.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="For example: defaultPaginationSize"
              disabled={Boolean(editing) || saving}
              required
            />
            <Input
              label="Value"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="For example: 20"
              disabled={saving}
              required
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description of this setting."
              disabled={saving}
            />
            {formError && (
              <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveSetting} disabled={saving} isLoading={saving}>
              {saving ? "Saving..." : "Save setting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}