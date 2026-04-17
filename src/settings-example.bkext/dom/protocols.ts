// Shared constants between app and DOM contexts.

export const settingsDefaults = {
  enabled: false,
}

export type SettingsKey = keyof typeof settingsDefaults
