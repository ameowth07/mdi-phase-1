import type { StudioThemePresetId } from './studioThemePresets'
import type { StudioColorTheme } from './themeColorOperators'

/**
 * How theme presets map to saturation / contrast sliders.
 *
 * - `theme-spectrum` — each named theme has explicit sat/contrast stops; sliders span the
 *   full theme range and show tick marks. Dragging off a stop shows "Custom".
 * - `surface-target` — legacy inverse-mapped presets (contrast stays at 1× for all themes).
 *
 * Set to `surface-target` to revert to the previous treatment.
 */
export type ThemeOperatorMappingMode = 'theme-spectrum' | 'surface-target'

export const THEME_OPERATOR_MAPPING_MODE: ThemeOperatorMappingMode = 'surface-target'

export type ThemeSpectrumOperators = {
  sat: number
  contrast: number
}

/** Explicit sat/contrast stops per named theme (theme-spectrum mode). */
export const THEME_OPERATOR_SPECTRUM: Record<StudioThemePresetId, ThemeSpectrumOperators> = {
  'default-dark': { sat: 1.0, contrast: 0.85 },
  'medium-dark': { sat: 0.91, contrast: 1.0 },
  'contrast-dark': { sat: 1.0, contrast: 1.25 },
  'default-light': { sat: 1.15, contrast: 0.85 },
  'medium-light': { sat: 1.0, contrast: 1.0 },
  'contrast-light': { sat: 0.91, contrast: 1.25 },
}

export type StudioThemeSelection = StudioThemePresetId | 'custom'

const DARK_THEME_PRESET_IDS = ['default-dark', 'medium-dark', 'contrast-dark'] as const
const LIGHT_THEME_PRESET_IDS = ['default-light', 'medium-light', 'contrast-light'] as const

const SPECTRUM_MATCH_EPSILON = 0.02

function presetIdsForTheme(theme: StudioColorTheme): readonly StudioThemePresetId[] {
  return theme === 'dark' ? DARK_THEME_PRESET_IDS : LIGHT_THEME_PRESET_IDS
}

function spectrumSatValues(): number[] {
  return Object.values(THEME_OPERATOR_SPECTRUM).map((entry) => entry.sat)
}

function spectrumContrastValues(): number[] {
  return Object.values(THEME_OPERATOR_SPECTRUM).map((entry) => entry.contrast)
}

function rangeWithPadding(values: number[], step: number, floor?: number, ceil?: number): {
  min: number
  max: number
} {
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  let min = minVal - step
  let max = maxVal + step
  if (floor != null) min = Math.max(floor, min)
  if (ceil != null) max = Math.min(ceil, max)
  return { min: roundToStep(min, step), max: roundToStep(max, step) }
}

function roundToStep(value: number, step: number): number {
  const decimals = String(step).includes('.') ? String(step).split('.')[1]?.length ?? 0 : 0
  return Number(value.toFixed(decimals))
}

export function themeSpectrumSatRange(): { min: number; max: number } {
  return rangeWithPadding(spectrumSatValues(), 0.01, 0.85, 1.2)
}

export function themeSpectrumContrastRange(): { min: number; max: number } {
  return rangeWithPadding(spectrumContrastValues(), 0.01, 0.85, 1.25)
}

export type ThemeSpectrumStop = {
  presetId: StudioThemePresetId
  value: number
}

export function themeSpectrumSatStops(theme: StudioColorTheme): ThemeSpectrumStop[] {
  return presetIdsForTheme(theme).map((presetId) => ({
    presetId,
    value: THEME_OPERATOR_SPECTRUM[presetId].sat,
  }))
}

export function themeSpectrumContrastStops(theme: StudioColorTheme): ThemeSpectrumStop[] {
  return presetIdsForTheme(theme).map((presetId) => ({
    presetId,
    value: THEME_OPERATOR_SPECTRUM[presetId].contrast,
  }))
}

export function spectrumOperatorsForPreset(presetId: StudioThemePresetId): ThemeSpectrumOperators {
  return THEME_OPERATOR_SPECTRUM[presetId]
}

export function matchThemePresetFromSpectrum(
  sat: number,
  contrast: number,
  theme: StudioColorTheme,
): StudioThemePresetId | null {
  for (const presetId of presetIdsForTheme(theme)) {
    const stop = THEME_OPERATOR_SPECTRUM[presetId]
    if (
      Math.abs(sat - stop.sat) <= SPECTRUM_MATCH_EPSILON &&
      Math.abs(contrast - stop.contrast) <= SPECTRUM_MATCH_EPSILON
    ) {
      return presetId
    }
  }
  return null
}

export function sliderStopPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return ((value - min) / (max - min)) * 100
}

export function isThemeSpectrumMode(): boolean {
  return THEME_OPERATOR_MAPPING_MODE === 'theme-spectrum'
}
