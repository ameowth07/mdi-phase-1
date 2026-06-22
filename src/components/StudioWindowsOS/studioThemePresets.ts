import {
  applyGray150Preset,
  applyGray350Preset,
  applySurfacePreset,
  applyThemeOperatorPreset,
  GRAY_150_OPERATOR_PRESET,
  GRAY_350_OPERATOR_PRESET,
  resetThemeColorOperators,
  SURFACE_OPERATOR_PRESETS,
  THEME_OPERATOR_DEFAULTS,
  type StudioColorTheme,
  type ThemeOperatorPreset,
  type ThemeSliderElements,
} from './themeColorOperators'
import {
  spectrumOperatorsForPreset,
  THEME_OPERATOR_MAPPING_MODE,
} from './themeOperatorMapping'

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
  { id: 'default-dark', label: 'Studio Dark', theme: 'dark' },
  { id: 'medium-dark', label: 'Medium Dark', theme: 'dark' },
  { id: 'contrast-dark', label: 'Contrast Dark', theme: 'dark' },
  { id: 'default-light', label: 'Studio Light', theme: 'light' },
  { id: 'medium-light', label: 'Medium Light', theme: 'light' },
  { id: 'contrast-light', label: 'Contrast Light', theme: 'light' },
]

export function studioThemePresetLabel(id: StudioThemePresetId): string {
  return STUDIO_THEME_PRESET_OPTIONS.find((option) => option.id === id)?.label ?? id
}

export type ThemePresetOperatorKey = 'hue' | 'sat' | 'light' | 'contrast'

const OPERATOR_MATCH_EPSILON = 0.02

function presetIdsForTheme(theme: StudioColorTheme): StudioThemePresetId[] {
  return STUDIO_THEME_PRESET_OPTIONS.filter((option) => option.theme === theme).map(
    (option) => option.id,
  )
}

/** Legacy inverse-mapped operator preset per theme (hue/light/sat; contrast always 1×). */
export function surfaceTargetOperatorPreset(presetId: StudioThemePresetId): ThemeOperatorPreset {
  switch (presetId) {
    case 'default-dark':
      return GRAY_350_OPERATOR_PRESET
    case 'medium-dark':
      return SURFACE_OPERATOR_PRESETS[200]
    case 'contrast-dark':
      return THEME_OPERATOR_DEFAULTS
    case 'default-light':
      return GRAY_150_OPERATOR_PRESET
    case 'medium-light':
      return THEME_OPERATOR_DEFAULTS
    case 'contrast-light':
      return SURFACE_OPERATOR_PRESETS[200]
    default:
      return THEME_OPERATOR_DEFAULTS
  }
}

/** Match all four operators against surface-target presets; `null` when off-stop. */
export function matchThemePresetFromSurfaceTarget(
  hue: number,
  sat: number,
  light: number,
  contrast: number,
  theme: StudioColorTheme,
): StudioThemePresetId | null {
  for (const presetId of presetIdsForTheme(theme)) {
    const preset = surfaceTargetOperatorPreset(presetId)
    if (
      Math.abs(hue - Number(preset.hue)) <= OPERATOR_MATCH_EPSILON &&
      Math.abs(sat - Number(preset.sat)) <= OPERATOR_MATCH_EPSILON &&
      Math.abs(light - Number(preset.light)) <= OPERATOR_MATCH_EPSILON &&
      Math.abs(contrast - Number(preset.contrast)) <= OPERATOR_MATCH_EPSILON
    ) {
      return presetId
    }
  }
  return null
}

/** Apply theme using legacy surface-target inverse mapping. */
export function applyStudioThemePresetSurfaceTarget(
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

/** Apply theme using explicit sat/contrast spectrum stops + surface-target hue/light. */
export function applyStudioThemePresetSpectrum(
  presetId: StudioThemePresetId,
  elements: ThemeSliderElements | null,
): StudioColorTheme {
  const preset = STUDIO_THEME_PRESET_OPTIONS.find((option) => option.id === presetId)
  const theme = preset?.theme ?? 'dark'
  const surfacePreset = surfaceTargetOperatorPreset(presetId)
  const spectrum = spectrumOperatorsForPreset(presetId)

  applyThemeOperatorPreset(elements, {
    ...surfacePreset,
    sat: String(spectrum.sat),
    contrast: String(spectrum.contrast),
  })

  return theme
}

export function applyStudioThemePreset(
  presetId: StudioThemePresetId,
  elements: ThemeSliderElements | null,
): StudioColorTheme {
  if (THEME_OPERATOR_MAPPING_MODE === 'surface-target') {
    return applyStudioThemePresetSurfaceTarget(presetId, elements)
  }
  return applyStudioThemePresetSpectrum(presetId, elements)
}
