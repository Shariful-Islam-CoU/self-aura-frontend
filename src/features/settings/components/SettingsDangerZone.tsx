"use client";

// Danger Zone.
//
// Actions that are actually supported by the backend:
//   - Sign out: the existing auth system's logout (all roles). No duplicate
//     logout implementation is created - this calls the same useAuth().logout()
//     the App Shell uses.
//   - Deactivate my account: DELETE /users/:id (owner only). Requires typing
//     DEACTIVATE to confirm. The backend refuses to deactivate the last active
//     owner (409), which is surfaced here. After the backend confirms, the
//     session is ended via the existing logout.
//
// Managers/staff get no deactivation control here (the endpoint is owner-only
// and user-management is a separate module), so only a note is shown for them.
// Everything is backend-confirmed - nothing destructive happens locally.

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { SettingsSection } from "./SettingsSection";
import { settingsClient } from "../services/settingsService";
import { settingsErrorMessage } from "../utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/Dialog";
import { AlertTriangle, LogOut } from "lucide-react";

const CONFIRMATION_WORD = "DEACTIVATE";

export function SettingsDangerZone() {
  const { user, canAccess, logout } = useAuth();
  // Self-deactivation goes through DELETE /users/:id which requires
  // users.disable; the backend refuses to disable the last active owner.
  const canDeactivate = canAccess("users.disable");

  const [loggingOut, setLoggingOut] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deactivating, setDeactivating] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
  };

  const openDeactivateDialog = () => {
    setConfirmText("");
    setDialogError(null);
    setDialogOpen(true);
  };

  const confirmMatches = confirmText.trim().toUpperCase() === CONFIRMATION_WORD;

  const handleDeactivate = async () => {
    if (!user || deactivating || !confirmMatches) return;

    setDeactivating(true);
    setDialogError(null);
    try {
      await settingsClient.deactivateAccount(user.id);
      setDialogOpen(false);
      setStatusMessage("Your account has been deactivated. You are being signed out.");
      await logout();
    } catch (err) {
      setDialogError(settingsErrorMessage(err, "Unable to deactivate the account."));
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <SettingsSection
      title="Danger Zone"
      description="Destructive actions. Changes here cannot be undone."
    >
      {statusMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="rounded-md border border-border p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Sign out</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              End your current session using the existing Sign out flow.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={loggingOut}
            isLoading={loggingOut}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {loggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </div>

      {canDeactivate ? (
        <div className="rounded-md border border-destructive/40 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-medium text-destructive">Deactivate your account</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Marks your account inactive (DELETE /users/your-id). You will be signed out and will
                not be able to sign in again. The backend refuses to deactivate the last active
                owner.
              </p>
            </div>
            <Button type="button" variant="destructive" onClick={openDeactivateDialog}>
              Deactivate account
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">Account deactivation</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Account deactivation is managed by an owner. If you need your account disabled, ask an
            owner to do it for you.
          </p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate your account?</DialogTitle>
            <DialogDescription>
              Your account will be marked inactive. You will be signed out and unable to sign in
              again. This cannot be undone from this screen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              label={`Type ${CONFIRMATION_WORD} to confirm`}
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              autoComplete="off"
              disabled={deactivating}
              required
            />
            {dialogError && (
              <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {dialogError}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={deactivating}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivating || !confirmMatches}
              isLoading={deactivating}
            >
              {deactivating ? "Deactivating..." : "Deactivate account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}