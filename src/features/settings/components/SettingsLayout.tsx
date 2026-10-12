"use client";

// Settings layout: section navigation filtered by permission plus the active
// section.
//
// Section visibility follows backend authorization (routes/settings.routes.ts):
//   - Profile / Security / Appearance / Business / Payments / Danger Zone: settings.view
//   - System (application settings): settings.view
//   - Delivery Zones: deliveryZones.view (edits gated inside the section)
// Business, Payments and System editing are gated inside their own sections
// with settings.manage. Backend 403 handling stays inside each section
// (permission message, never a logout).
//
// Responsive: vertical sidebar on desktop, horizontal scrollable tabs on
// smaller screens, full-width content.

import { ComponentType, useState } from "react";
import { User, Lock, Palette, Building2, Server, ShieldAlert, Wallet, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { ProfileSettings } from "./ProfileSettings";
import { SecuritySettings } from "./SecuritySettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { BusinessSettings } from "./BusinessSettings";
import { PaymentSettings } from "./PaymentSettings";
import { SystemSettings } from "./SystemSettings";
import { DeliveryZoneSettings } from "./DeliveryZoneSettings";
import { SettingsDangerZone } from "./SettingsDangerZone";

interface SettingsSectionDef {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  Component: ComponentType;
}

const SECTIONS: SettingsSectionDef[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Your account details",
    icon: User,
    Component: ProfileSettings,
  },
  {
    id: "security",
    label: "Security",
    description: "Password and sign-in",
    icon: Lock,
    Component: SecuritySettings,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Theme preference",
    icon: Palette,
    Component: AppearanceSettings,
  },
  {
    id: "business",
    label: "Business",
    description: "Currency, tax and stock",
    icon: Building2,
    Component: BusinessSettings,
  },
  {
    id: "payments",
    label: "Payments",
    description: "bKash, Nagad and cash on delivery",
    icon: Wallet,
    Component: PaymentSettings,
  },
  {
    id: "delivery-zones",
    label: "Delivery Zones",
    description: "Where you deliver and for how much",
    icon: Truck,
    Component: DeliveryZoneSettings,
  },
  {
    id: "system",
    label: "System",
    description: "Application settings",
    icon: Server,
    Component: SystemSettings,
  },
  {
    id: "danger",
    label: "Danger Zone",
    description: "Sign out and account actions",
    icon: ShieldAlert,
    Component: SettingsDangerZone,
  },
];

export function SettingsLayout() {
  // Sections are readable with settings.view (the sidebar only links here when
  // that permission is held). Delivery Zones has its own permission set, so it
  // is filtered separately - a user without deliveryZones.view never sees a
  // section that would only render a 403. Editing gates live inside sections.
  const { canAccess } = useAuth();
  const visibleSections = SECTIONS.filter((section) =>
    section.id === "delivery-zones" ? canAccess("deliveryZones.view") : true
  );

  const [activeId, setActiveId] = useState(visibleSections[0]?.id ?? "profile");
  const active = visibleSections.find((section) => section.id === activeId) ?? visibleSections[0];
  const ActiveComponent = active?.Component ?? ProfileSettings;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:gap-8">
      <nav aria-label="Settings sections" className="lg:self-start">
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
          {visibleSections.map((section) => {
            const isActive = section.id === active?.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                aria-current={isActive ? "page" : undefined}
                title={section.description}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <section.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {section.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="min-w-0 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {active?.label}
          </h2>
          <p className="text-sm text-muted-foreground">{active?.description}</p>
        </div>
        <ActiveComponent />
      </div>
    </div>
  );
}