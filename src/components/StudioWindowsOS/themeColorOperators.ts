/** `--surface-100` base (H₀, S₀, L₀) at default operators — per theme. */
export const SURFACE_100_BASES = {
  dark: { h: 230, s: 11, l: 11 },
  light: { h: 240, s: 7, l: 97 },
} as const

/** Dark-theme Surface_100 baseline — used by dark surface presets. */
export const SURFACE_100_BASE = SURFACE_100_BASES.dark

export type StudioColorTheme = 'dark' | 'light'

/** `--surface-0` token bases at default operators — per theme. */
export const SURFACE_0_BASES = {
  dark: { h: 240, s: 8, l: 8 },
  light: { h: 0, s: 0, l: 100 },
} as const

/** Target `--surface-0` HSL per theme. Figma Surface Color Evolution (8495:41747 / 8495:41748). */
export const SURFACE_0_TARGETS = {
  dark: { h: 240, s: 8, l: 8 },
  light: { h: 0, s: 0, l: 100 },
} as const

/** Target `--surface-100` HSL for each surface preset (contrast scale = 1). Figma dark ramp. */
export const SURFACE_PRESET_TARGETS = {
  200: { h: 223, s: 10, l: 14 },
  300: { h: 227, s: 10, l: 17 },
} as const

export type SurfacePresetId = keyof typeof SURFACE_PRESET_TARGETS

/** Gray_350 — dark theme only. Figma 8347:1918 (#22242A → hsl 225 11 15). */
export const GRAY_350_TARGET = { h: 225, s: 11, l: 15 } as const

/** Gray_150 — light theme only. Figma 8349:59664 (#F1F2F3 → hsl 210 8 95). */
export const GRAY_150_TARGET = { h: 210, s: 8, l: 95 } as const

/** Hue operator range (degrees) — mild theme tint shift. */
export const HUE_OPERATOR_MIN = -15
export const HUE_OPERATOR_MAX = 15

export const HUE_OPERATOR_TICKS = [-15, -10, -5, 5, 10, 15] as const

function clampHue(value: string | number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(HUE_OPERATOR_MAX, Math.max(HUE_OPERATOR_MIN, n))
}

/** Default operators — resets UI to Surface_100 baseline. */
export const THEME_OPERATOR_DEFAULTS = {
  hue: '0',
  sat: '1',
  light: '0',
  contrast: '1',
} as const

export type ThemeOperatorPreset = {
  hue: string
  sat: string
  light: string
  contrast: string
}

export function computeSurfaceOperatorPreset(target: {
  h: number
  s: number
  l: number
}): ThemeOperatorPreset {
  return computeSurfaceOperatorPresetFromBase(SURFACE_100_BASE, target)
}

function computeSurfaceOperatorPresetFromBase(
  base: { h: number; s: number; l: number },
  target: { h: number; s: number; l: number },
): ThemeOperatorPreset {
  return {
    hue: String(target.h - base.h),
    sat: base.s === 0 ? '1' : (target.s / base.s).toFixed(2),
    light: String(target.l - base.l),
    contrast: '1',
  }
}

export function surface0OperatorPreset(theme: StudioColorTheme): ThemeOperatorPreset {
  return computeSurfaceOperatorPresetFromBase(SURFACE_0_BASES[theme], SURFACE_0_TARGETS[theme])
}

export const SURFACE_OPERATOR_PRESETS: Record<SurfacePresetId, ThemeOperatorPreset> = {
  200: computeSurfaceOperatorPreset(SURFACE_PRESET_TARGETS[200]),
  300: computeSurfaceOperatorPreset(SURFACE_PRESET_TARGETS[300]),
}

export const GRAY_350_OPERATOR_PRESET = computeSurfaceOperatorPresetFromBase(
  SURFACE_100_BASES.dark,
  GRAY_350_TARGET,
)

export const GRAY_150_OPERATOR_PRESET = computeSurfaceOperatorPresetFromBase(
  SURFACE_100_BASES.light,
  GRAY_150_TARGET,
)

export type ThemeSliderElements = {
  hueSlider: HTMLInputElement
  satSlider: HTMLInputElement
  lightSlider: HTMLInputElement
  contrastSlider: HTMLInputElement
  hueReadout: HTMLElement | null
  satReadout: HTMLElement | null
  lightReadout: HTMLElement | null
  contrastReadout: HTMLElement | null
}

export function formatHueReadout(value: string | number): string {
  const n = Number(value)
  if (n === 0) return '0°'
  return n > 0 ? `+${n}°` : `${n}°`
}

export function formatSatReadout(value: string | number): string {
  const n = Number(value)
  const label = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '')
  return `${label}x`
}

export function formatLightReadout(value: string | number): string {
  const n = Number(value)
  if (n === 0) return '0%'
  return n > 0 ? `+${n}%` : `${n}%`
}

export function formatContrastReadout(value: string | number): string {
  const n = Number(value)
  const label = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '')
  return `${label}x`
}

function formatDecimalNumeric(value: string | number): string {
  const n = Number(value)
  const label = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '')
  return label
}

export function formatHueNumeric(value: string | number): string {
  const n = Number(value)
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : String(n)
}

export function formatSatNumeric(value: string | number): string {
  return formatDecimalNumeric(value)
}

export function formatLightNumeric(value: string | number): string {
  const n = Number(value)
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : String(n)
}

export function formatContrastNumeric(value: string | number): string {
  return formatDecimalNumeric(value)
}

function setReadoutValue(el: HTMLElement | null, text: string): void {
  if (!el) return
  if (el instanceof HTMLInputElement) el.value = text
  else el.textContent = text
}

function updateHueReadout(el: HTMLElement | null, hue: number): void {
  if (!el) return
  setReadoutValue(el, el instanceof HTMLInputElement ? formatHueNumeric(hue) : formatHueReadout(hue))
}

function updateSatReadout(el: HTMLElement | null, value: string | number): void {
  if (!el) return
  setReadoutValue(el, el instanceof HTMLInputElement ? formatSatNumeric(value) : formatSatReadout(value))
}

function updateLightReadout(el: HTMLElement | null, value: string | number): void {
  if (!el) return
  setReadoutValue(el, el instanceof HTMLInputElement ? formatLightNumeric(value) : formatLightReadout(value))
}

function updateContrastReadout(el: HTMLElement | null, value: string | number): void {
  if (!el) return
  setReadoutValue(el, el instanceof HTMLInputElement ? formatContrastNumeric(value) : formatContrastReadout(value))
}

/** Push slider values to `:root` CSS variables and readouts. */
export function syncThemeColorOperators(elements: ThemeSliderElements): void {
  const { hueSlider, satSlider, lightSlider, contrastSlider, hueReadout, satReadout, lightReadout, contrastReadout } =
    elements
  const root = document.documentElement
  const hue = clampHue(hueSlider.value)

  root.style.setProperty('--delta-hue', String(hue))
  root.style.setProperty('--sat-multiplier', satSlider.value)
  root.style.setProperty('--lightness-offset', `${lightSlider.value}%`)
  root.style.setProperty('--contrast-scale', contrastSlider.value)

  updateHueReadout(hueReadout, hue)
  updateSatReadout(satReadout, satSlider.value)
  updateLightReadout(lightReadout, lightSlider.value)
  updateContrastReadout(contrastReadout, contrastSlider.value)
}

function applyThemeOperatorPreset(elements: ThemeSliderElements | null, preset: ThemeOperatorPreset): void {
  const root = document.documentElement
  const hue = clampHue(preset.hue)

  root.style.setProperty('--delta-hue', String(hue))
  root.style.setProperty('--sat-multiplier', preset.sat)
  root.style.setProperty('--lightness-offset', `${preset.light}%`)
  root.style.setProperty('--contrast-scale', preset.contrast)

  if (!elements) return

  elements.hueSlider.value = String(hue)
  elements.satSlider.value = preset.sat
  elements.lightSlider.value = preset.light
  elements.contrastSlider.value = preset.contrast

  updateHueReadout(elements.hueReadout, hue)
  updateSatReadout(elements.satReadout, preset.sat)
  updateLightReadout(elements.lightReadout, preset.light)
  updateContrastReadout(elements.contrastReadout, preset.contrast)
}

/** Reset sliders to Surface_100 baseline (`--surface-100` → hsl(230, 11%, 11%)). */
export function resetThemeColorOperators(elements: ThemeSliderElements | null): void {
  applyThemeOperatorPreset(elements, THEME_OPERATOR_DEFAULTS)
}

/** Set sliders so `--surface-100` matches a surface preset target. */
export function applySurfacePreset(elements: ThemeSliderElements, id: SurfacePresetId): void {
  applyThemeOperatorPreset(elements, SURFACE_OPERATOR_PRESETS[id])
}

/** Set sliders so `--surface-100` matches Gray_350 (dark theme). */
export function applyGray350Preset(elements: ThemeSliderElements): void {
  applyThemeOperatorPreset(elements, GRAY_350_OPERATOR_PRESET)
}

/** Set sliders so `--surface-100` matches Gray_150 (light theme). */
export function applyGray150Preset(elements: ThemeSliderElements): void {
  applyThemeOperatorPreset(elements, GRAY_150_OPERATOR_PRESET)
}

/** Set sliders so `--surface-0` matches the theme Surface_0 swatch. */
export function applySurface0Preset(elements: ThemeSliderElements, theme: StudioColorTheme): void {
  applyThemeOperatorPreset(elements, surface0OperatorPreset(theme))
}

/** Read current operator values from `:root` (for syncing a second settings UI). */
export function readThemeOperatorsFromDocument(): ThemeOperatorPreset {
  const style = getComputedStyle(document.documentElement)
  const hue = style.getPropertyValue('--delta-hue').trim() || THEME_OPERATOR_DEFAULTS.hue
  const sat = style.getPropertyValue('--sat-multiplier').trim() || THEME_OPERATOR_DEFAULTS.sat
  const lightRaw = style.getPropertyValue('--lightness-offset').trim() || '0%'
  const light = lightRaw.replace(/%$/, '') || THEME_OPERATOR_DEFAULTS.light
  const contrast = style.getPropertyValue('--contrast-scale').trim() || THEME_OPERATOR_DEFAULTS.contrast
  return { hue, sat, light, contrast }
}

/** Apply operator values to slider elements without touching `:root`. */
export function applyThemeOperatorsToSliders(
  elements: ThemeSliderElements,
  preset: ThemeOperatorPreset,
): void {
  const hue = clampHue(preset.hue)
  elements.hueSlider.value = String(hue)
  elements.satSlider.value = preset.sat
  elements.lightSlider.value = preset.light
  elements.contrastSlider.value = preset.contrast
  updateHueReadout(elements.hueReadout, hue)
  updateSatReadout(elements.satReadout, preset.sat)
  updateLightReadout(elements.lightReadout, preset.light)
  updateContrastReadout(elements.contrastReadout, preset.contrast)
}

/** Bind sliders to global CSS operators on `:root`. */
export function bindThemeColorOperators(elements: ThemeSliderElements): () => void {
  const onInput = () => syncThemeColorOperators(elements)

  elements.hueSlider.addEventListener('input', onInput)
  elements.satSlider.addEventListener('input', onInput)
  elements.lightSlider.addEventListener('input', onInput)
  elements.contrastSlider.addEventListener('input', onInput)
  onInput()

  return () => {
    elements.hueSlider.removeEventListener('input', onInput)
    elements.satSlider.removeEventListener('input', onInput)
    elements.lightSlider.removeEventListener('input', onInput)
    elements.contrastSlider.removeEventListener('input', onInput)
  }
}

function collectThemeSliderElements(): ThemeSliderElements | null {
  const hueSlider = document.getElementById('hueSlider') as HTMLInputElement | null
  const satSlider = document.getElementById('satSlider') as HTMLInputElement | null
  const lightSlider = document.getElementById('lightSlider') as HTMLInputElement | null
  const contrastSlider = document.getElementById('contrastSlider') as HTMLInputElement | null

  if (!hueSlider || !satSlider || !lightSlider || !contrastSlider) return null

  return {
    hueSlider,
    satSlider,
    lightSlider,
    contrastSlider,
    hueReadout: document.getElementById('hueReadout'),
    satReadout: document.getElementById('satReadout'),
    lightReadout: document.getElementById('lightReadout'),
    contrastReadout: document.getElementById('contrastReadout'),
  }
}

/** @deprecated Use bindThemeColorOperators(elements) with refs from the active panel. */
export function bindThemeColorOperatorsById(): () => void {
  const elements = collectThemeSliderElements()
  if (!elements) return () => {}
  return bindThemeColorOperators(elements)
}
