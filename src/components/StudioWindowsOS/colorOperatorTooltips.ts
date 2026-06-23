export type ColorOperatorTooltipCopy = {
  title: string
  description: string
}

export const COLOR_OPERATOR_TOOLTIPS = {
  theme: {
    title: 'Theme',
    description: 'Pick a starting color style, an asterisk means you changed it',
  },
  hue: {
    title: 'Hue',
    description: 'Shift the overall color warmer or cooler',
  },
  saturation: {
    title: 'Saturation',
    description: 'Make colors more vivid or more gray',
  },
  lightness: {
    title: 'Lightness',
    description: 'Brighten or darken the whole interface together',
  },
  contrast: {
    title: 'Contrast',
    description: 'Make text stand out more or less from backgrounds',
  },
} as const satisfies Record<string, ColorOperatorTooltipCopy>
