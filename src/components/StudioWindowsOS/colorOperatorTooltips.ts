export type ColorOperatorTooltipCopy = {
  title: string
  description: string
}

export const COLOR_OPERATOR_TOOLTIPS = {
  hue: {
    title: 'Hue',
    description:
      'Rotates every theme token by the same number of degrees — surfaces, text, borders, and shift/stroke overlays.',
  },
  saturation: {
    title: 'Saturation',
    description:
      'Multiplies chroma on surfaces, content, borders, and hover overlays. Lower values neutralize color; higher values intensify it.',
  },
  lightness: {
    title: 'Lightness',
    description:
      'Adds the same lightness offset to all tokens before contrast runs — brightens or darkens the entire ramp together.',
  },
  contrast: {
    title: 'Contrast',
    description:
      'Adjusts separation between panel backgrounds and text (0.75× flatter, 1.25× stronger). Surfaces and labels move in opposite directions.',
  },
} as const satisfies Record<string, ColorOperatorTooltipCopy>
