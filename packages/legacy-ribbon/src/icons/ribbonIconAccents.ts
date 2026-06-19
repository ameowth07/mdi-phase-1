/** Figma accent hex → ribbon CSS vars (defaults on `.frame`; operators when linked). */
const ACCENT_HEX_TO_VAR: Record<string, string> = {
  '#7644FD': 'var(--ribbon-accent-violet)',
  '#0FB369': 'var(--ribbon-accent-green)',
  '#E26CF4': 'var(--ribbon-accent-magenta)',
  '#D540F5': 'var(--ribbon-accent-magenta)',
  '#284DE2': 'var(--ribbon-accent-blue-deep)',
  '#5581FC': 'var(--ribbon-accent-blue)',
  '#3C64FA': 'var(--ribbon-accent-blue-ui)',
  '#F5C73D': 'var(--ribbon-accent-yellow)',
  '#F87935': 'var(--ribbon-accent-orange)',
  '#E1621E': 'var(--ribbon-accent-character)',
  '#0CC3E4': 'var(--ribbon-accent-cyan)',
  '#E8457E': 'var(--ribbon-accent-pink)',
}

const ACCENT_HEX_PATTERN =
  /#(?:7644[Ff][Dd]|0[Ff][Bb]369|[Ee]26[Cc][Ff]4|[Dd]540[Ff]5|284[Dd][Ee]2|5581[Ff][Cc]|3[Cc]64[Ff][Aa]|[Ff]5[Cc]73[Dd]|[Ff]87935|[Ee]1621[Ee]|0[Cc][Cc]3[Ee]4|[Ee]8457[Ee])/g

export function applyRibbonIconAccents(svg: string): string {
  return svg.replace(ACCENT_HEX_PATTERN, (hex) => {
    const key = hex.toUpperCase()
    return ACCENT_HEX_TO_VAR[key] ?? hex
  })
}
