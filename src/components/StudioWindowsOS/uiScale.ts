export const UI_SCALE_OPTIONS = [100, 125, 150, 200] as const

export type UiScale = (typeof UI_SCALE_OPTIONS)[number]

export function uiScaleFactor(scale: UiScale): number {
  return scale / 100
}
