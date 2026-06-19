/** CSS custom properties on `.frame` — see StudioWindowsOS.module.css. */
export const SEMANTIC_COLOR_VAR = {
  clientStroke: '--semantic-client-stroke',
  serverStroke: '--semantic-server-stroke',
  droneStroke: '--semantic-drone-stroke',
} as const

export function readSemanticColorFromFrame(
  frame: HTMLElement | null,
  varName: string,
  fallback: string,
): string {
  if (frame == null) return fallback
  const value = getComputedStyle(frame).getPropertyValue(varName).trim()
  return value || fallback
}
