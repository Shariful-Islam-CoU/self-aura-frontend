// Settings feature barrel.
//
// "BusinessSettings" is exported twice from different modules (the backend
// settings type and the section component), so the component is re-exported
// under "BusinessSettingsSection" here to keep the public surface unambiguous.

export * from "./types";
export * from "./utils";

export {
  SettingsLayout,
  SettingsSection,
  SettingsSaveBar,
  ProfileSettings,
  AppearanceSettings,
  SecuritySettings,
  BusinessSettings as BusinessSettingsSection,
  SystemSettings,
  SettingsDangerZone,
} from "./components";
export type { SettingsSectionProps, SettingsSaveBarProps } from "./components";

export {
  settingsClient,
  settingsClient as settingsService,
  SettingsClient,
} from "./services/settingsService";