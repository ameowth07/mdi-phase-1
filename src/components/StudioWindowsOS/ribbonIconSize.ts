export const RIBBON_ICON_SIZE_OPTIONS = [24, 20] as const

export type RibbonIconSize = (typeof RIBBON_ICON_SIZE_OPTIONS)[number]
