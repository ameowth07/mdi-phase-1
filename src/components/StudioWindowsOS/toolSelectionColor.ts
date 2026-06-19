export const TOOL_SELECTION_COLOR_OPTIONS = [
  'shift_300',
  'shift_500',
  'blue_highlight',
] as const

export type ToolSelectionColor = (typeof TOOL_SELECTION_COLOR_OPTIONS)[number]

export const TOOL_SELECTION_COLOR_LABELS: Record<ToolSelectionColor, string> = {
  shift_300: 'Shift_300',
  shift_500: 'Shift_500',
  blue_highlight: 'Blue highlight',
}
