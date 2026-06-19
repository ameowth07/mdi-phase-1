import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import css from './StudioTooltip.module.css'
import { useHoverTooltip } from './useHoverTooltip'

export type StudioTooltipProps = {
  title: string
  description: string
  children: ReactNode
  className?: string
  align?: 'start' | 'center'
  position?: 'top' | 'bottom'
  disabled?: boolean
}

type AnchorPoint = {
  x: number
  y: number
}

function tooltipTransform(
  position: 'top' | 'bottom',
  align: 'start' | 'center',
): string {
  if (position === 'top') {
    return align === 'center' ? 'translate(-50%, -100%)' : 'translateY(-100%)'
  }
  return align === 'center' ? 'translate(-50%, 0)' : 'none'
}

export default function StudioTooltip({
  title,
  description,
  children,
  className,
  align = 'start',
  position = 'top',
  disabled = false,
}: StudioTooltipProps) {
  const hostRef = useRef<HTMLSpanElement>(null)
  const tooltip = useHoverTooltip(!disabled)
  const [anchor, setAnchor] = useState<AnchorPoint | null>(null)

  useLayoutEffect(() => {
    if (!tooltip.open) {
      setAnchor(null)
      return undefined
    }

    const updateAnchor = () => {
      const host = hostRef.current
      if (!host) return
      const rect = host.getBoundingClientRect()
      setAnchor({
        x: align === 'center' ? rect.left + rect.width / 2 : rect.left,
        y: position === 'top' ? rect.top - 6 : rect.bottom + 6,
      })
    }

    updateAnchor()
    window.addEventListener('scroll', updateAnchor, true)
    window.addEventListener('resize', updateAnchor)
    return () => {
      window.removeEventListener('scroll', updateAnchor, true)
      window.removeEventListener('resize', updateAnchor)
    }
  }, [tooltip.open, align, position])

  const bubbleStyle: CSSProperties | undefined = anchor
    ? {
        position: 'fixed',
        left: anchor.x,
        top: anchor.y,
        transform: tooltipTransform(position, align),
      }
    : undefined

  return (
    <>
      <span
        ref={hostRef}
        className={`${css.host} ${className ?? ''}`.trim()}
        onMouseEnter={tooltip.onMouseEnter}
        onMouseLeave={tooltip.onMouseLeave}
      >
        {children}
      </span>
      {tooltip.open && anchor
        ? createPortal(
            <span
              className={css.bubble}
              style={bubbleStyle}
              role="tooltip"
              data-node-id="1244:275833"
            >
              <span className={css.title}>{title}</span>
              <span className={css.description}>{description}</span>
            </span>,
            document.body,
          )
        : null}
    </>
  )
}
