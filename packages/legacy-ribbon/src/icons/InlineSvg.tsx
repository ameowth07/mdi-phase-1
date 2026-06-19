import { applyRibbonIconAccents } from './ribbonIconAccents'
import { applyRibbonIconNeutrals } from './ribbonIconNeutrals'

type InlineSvgProps = {
  svg: string
  className?: string
}

/** Inline Figma SVG; neutrals + accents follow ribbon theme tokens on `.frame`. */
export function InlineSvg({ svg, className }: InlineSvgProps) {
  const html = applyRibbonIconAccents(applyRibbonIconNeutrals(svg))
    .replace(/\swidth="[^"]*"/, '')
    .replace(/\sheight="[^"]*"/, '')
    .replace('<svg ', '<svg width="100%" height="100%" ')

  return (
    <span className={className} aria-hidden dangerouslySetInnerHTML={{ __html: html }} />
  )
}
