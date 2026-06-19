/** Light-theme Figma hex → ribbon CSS vars (accents stay baked). */
const NEUTRAL_HEX_TO_VAR: Record<string, string> = {
  '#1F2024': 'var(--ribbon-icon-default)',
  '#202227': 'var(--ribbon-icon-emphasis)',
  '#6A6F81': 'var(--ribbon-icon-muted)',
  '#BBC2D1': 'var(--ribbon-icon-muted-blue)',
  '#7986A5': 'var(--ribbon-icon-generic)',
  '#F7F7F8': 'var(--ribbon-icon-inverse)',
}

const NEUTRAL_HEX_PATTERN = /#(?:1[Ff]2024|202227|6[Aa]6[Ff]81|[Bb][Bb][Cc]2[Dd]1|7986[Aa]5|[Ff]7[Ff]7[Ff]8)/g

export function applyRibbonIconNeutrals(svg: string): string {
  let html = svg.replace(NEUTRAL_HEX_PATTERN, (hex) => {
    const key = hex.toUpperCase()
    return NEUTRAL_HEX_TO_VAR[key] ?? hex
  })

  html = html.replace(
    /stroke="#1[Bb]254[Bb]"\s*stroke-opacity="0\.12"/g,
    'stroke="var(--stroke-default)"',
  )

  html = html.replace(
    /stroke="#(?:1[Ff]2024|202227|6[Aa]6[Ff]81|[Bb][Bb][Cc]2[Dd]1|7986[Aa]5|[Ff]7[Ff]7[Ff]8)"/g,
    (stroke) => {
      const hex = stroke.match(/#[0-9A-Fa-f]{6}/)![0].toUpperCase()
      const mapped = NEUTRAL_HEX_TO_VAR[hex]
      return mapped ? `stroke="${mapped}"` : stroke
    },
  )

  return html
}
