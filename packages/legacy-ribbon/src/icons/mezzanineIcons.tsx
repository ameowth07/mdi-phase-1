import css from '../ribbon.module.css'
import { IconStack } from './IconStack'
import type { IconLayer } from './IconStack'
import { InlineSvg } from './InlineSvg'
import { getRibbonSvg } from './svgRegistry'

/** Layer stacks from Figma Ribbon node 5814:42199 — Mezzanine (3841:115007). */
const MEZZANINE_16: Record<string, IconLayer[]> = {
  play: [{ kind: 'svg', asset: 'imgVector2133', inset: '10.61% 7.35% 7.13% 12.52%' }],
  stop: [{ kind: 'svg', asset: 'imgRectangle3280', inset: '14.06% 12.5% 10.94% 12.5%' }],
  client: [{ kind: 'svg', asset: 'imgUnion', inset: '12.5% 9.38% 6.25% 9.38%' }],
  share: [{ kind: 'svg', asset: 'imgUnion1', inset: '0' }],
  cloud: [{ kind: 'svg', asset: 'imgSubtract', inset: '18.75% 6.25%' }],
  notification: [{ kind: 'svg', asset: 'imgUnion2', inset: '6.13% 12.5% 6.15% 12.5%' }],
  assistant: [{ kind: 'svg', asset: 'imgNebula', inset: '9.08% 9.53% 9.35% 8.9%' }],
}

export function MezzanineIcon({
  id,
  className,
}: {
  id: keyof typeof MEZZANINE_16
  className?: string
}) {
  return <IconStack size={16} layers={MEZZANINE_16[id]} className={className} />
}

export function RibbonPlusIcon() {
  return (
    <span className={css.iconStack16} aria-hidden>
      <InlineSvg svg={getRibbonSvg('imgVector')} />
    </span>
  )
}

export function RibbonChevronDownIcon({ className }: { className?: string }) {
  return (
    <span className={[css.iconStack16, className].filter(Boolean).join(' ')} aria-hidden>
      <InlineSvg svg={getRibbonSvg('imgIcon')} />
    </span>
  )
}

export function RibbonOverflowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={10}
      height={10}
      viewBox="0 0 10 10"
      aria-hidden
    >
      <circle cx="5" cy="2" r="1.1" fill="currentColor" />
      <circle cx="5" cy="5" r="1.1" fill="currentColor" />
      <circle cx="5" cy="8" r="1.1" fill="currentColor" />
    </svg>
  )
}

export function RibbonChevronSmIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={10}
      height={10}
      viewBox="0 0 10 10"
      aria-hidden
    >
      <path
        d="M2 3L5 6.2L8 3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
