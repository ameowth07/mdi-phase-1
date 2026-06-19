import {
  applyGray150Preset,
  applyGray350Preset,
  applySurfacePreset,
  resetThemeColorOperators,
  type StudioColorTheme,
  type ThemeSliderElements,
} from './themeColorOperators'

export type StudioThemePresetId =
  | 'default-dark'
  | 'medium-dark'
  | 'contrast-dark'
  | 'default-light'
  | 'medium-light'
  | 'contrast-light'

export type StudioThemePresetOption = {
  id: StudioThemePresetId
  label: string
  theme: StudioColorTheme
}

export const STUDIO_THEME_PRESET_OPTIONS: readonly StudioThemePresetOption[] = [
  { id: 'default-dark', label: 'Default Dark', theme: 'dark' },
  { id: 'medium-dark', label: 'Medium Dark', theme: 'dark' },
  { id: 'contrast-dark', label: 'Contrast Dark', theme: 'dark' },
  { id: 'default-light', label: 'Default Light', theme: 'light' },
  { id: 'medium-light', label: 'Medium Light', theme: 'light' },
  { id: 'contrast-light', label: 'Contrast Light', theme: 'light' },
]

export function studioThemePresetLabel(id: StudioThemePresetId): string {
  return STUDIO_THEME_PRESET_OPTIONS.find((option) => option.id === id)?.label ?? id
}

export function applyStudioThemePreset(
  presetId: StudioThemePresetId,
  elements: ThemeSliderElements | null,
): StudioColorTheme {
  const preset = STUDIO_THEME_PRESET_OPTIONS.find((option) => option.id === presetId)
  const theme = preset?.theme ?? 'dark'

  if (elements == null) return theme

  switch (presetId) {
    case 'default-dark':
      applyGray350Preset(elements)
      break
    case 'medium-dark':
      applySurfacePreset(elements, 200)
      break
    case 'contrast-dark':
      resetThemeColorOperators(elements)
      break
    case 'default-light':
      applyGray150Preset(elements)
      break
    case 'medium-light':
      resetThemeColorOperators(elements)
      break
    case 'contrast-light':
      applySurfacePreset(elements, 200)
      break
    default:
      resetThemeColorOperators(elements)
  }

  return theme
}
