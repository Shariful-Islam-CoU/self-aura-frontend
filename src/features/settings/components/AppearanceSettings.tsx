"use client";

// Appearance settings. Reuses the existing ThemeProvider (light/dark/system) -
// no new theme system is created. The theme preference persists via the
// existing provider (localStorage); the backend exposes no theme endpoint, so
// this setting is intentionally stored locally and labelled as such.

import { useTheme, type Theme } from "@/providers/ThemeProvider";
import { SettingsSection } from "./SettingsSection";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: { value: Theme; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Use the light theme." },
  { value: "dark", label: "Dark", description: "Use the dark theme." },
  { value: "system", label: "System", description: "Follow your device preference." },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsSection
      title="Appearance"
      description="Choose how Self Aura looks for you."
    >
      <div role="radiogroup" aria-label="Theme preference" className="grid gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map((option) => {
          const selected = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(option.value)}
              className={cn(
                "rounded-md border p-4 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Your theme preference is stored locally in this browser. The backend does not expose a
        theme setting.
      </p>
    </SettingsSection>
  );
}