/** `--surface-100` base (H₀, S₀, L₀) at default operators — Surface_100. */
export const SURFACE_100_BASE = { h: 230, s: 11, l: 11 } as const

/** Target appearance for Surface_250 preset (`hsl(223, 9%, 16%)` on `--surface-100`). */
export const SURFACE_250_TARGET = { h: 223, s: 9, l: 16 } as const

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

/** Operators so `--surface-100` ≈ `hsl(223, 9%, 16%)` with contrast at 1. */
export const SURFACE_250_OPERATOR_PRESET: ThemeOperatorPreset = {
  hue: String(SURFACE_250_TARGET.h - SURFACE_100_BASE.h),
  sat: (SURFACE_250_TARGET.s / SURFACE_100_BASE.s).toFixed(2),
  light: String(SURFACE_250_TARGET.l - SURFACE_100_BASE.l),
  contrast: '1',
}

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

/** Push slider values to `:root` CSS variables and readouts. */
export function syncThemeColorOperators(elements: ThemeSliderElements): void {
  const { hueSlider, satSlider, lightSlider, contrastSlider, hueReadout, satReadout, lightReadout, contrastReadout } =
    elements
  const root = document.documentElement

  root.style.setProperty('--delta-hue', hueSlider.value)
  root.style.setProperty('--sat-multiplier', satSlider.value)
  root.style.setProperty('--lightness-offset', `${lightSlider.value}%`)
  root.style.setProperty('--contrast-scale', contrastSlider.value)

  if (hueReadout) hueReadout.textContent = formatHueReadout(hueSlider.value)
  if (satReadout) satReadout.textContent = formatSatReadout(satSlider.value)
  if (lightReadout) lightReadout.textContent = formatLightReadout(lightSlider.value)
  if (contrastReadout) contrastReadout.textContent = formatContrastReadout(contrastSlider.value)
}

function applyThemeOperatorPreset(elements: ThemeSliderElements, preset: ThemeOperatorPreset): void {
  elements.hueSlider.value = preset.hue
  elements.satSlider.value = preset.sat
  elements.lightSlider.value = preset.light
  elements.contrastSlider.value = preset.contrast
  syncThemeColorOperators(elements)
}

/** Reset sliders to Surface_100 baseline (`--surface-100` → hsl(230, 11%, 11%)). */
export function resetThemeColorOperators(elements: ThemeSliderElements): void {
  applyThemeOperatorPreset(elements, THEME_OPERATOR_DEFAULTS)
}

/** Set sliders so `--surface-100` → hsl(223, 9%, 16%) (Surface_250). */
export function applySurface250Preset(elements: ThemeSliderElements): void {
  applyThemeOperatorPreset(elements, SURFACE_250_OPERATOR_PRESET)
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
