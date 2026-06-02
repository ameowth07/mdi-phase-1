import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ComponentProps, MouseEvent } from 'react'
import styles from './StudioWindowsOS.module.css'

const PATH_TOOLTIP_FIRST_DELAY_MS = 300
const PATH_TOOLTIP_CHAIN_WINDOW_MS = 1000

let pathTooltipLastOpenedAt = 0
let pathTooltipLastOpenedInstanceId: string | null = null

export function usePathTooltip(path: string, enabled: boolean) {
  const instanceId = useId()
  const [tipOpen, setTipOpen] = useState(false)
  const hoveringRef = useRef(false)
  const openTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current != null) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearOpenTimer(), [clearOpenTimer])

  const scheduleOpen = useCallback(() => {
    if (!enabled) return
    clearOpenTimer()
    const now = Date.now()
    const chainInWindow =
      pathTooltipLastOpenedAt > 0 &&
      now - pathTooltipLastOpenedAt < PATH_TOOLTIP_CHAIN_WINDOW_MS
    const chainDifferentHost =
      chainInWindow &&
      pathTooltipLastOpenedInstanceId !== null &&
      pathTooltipLastOpenedInstanceId !== instanceId
    const delay = chainDifferentHost ? 0 : PATH_TOOLTIP_FIRST_DELAY_MS

    openTimerRef.current = globalThis.setTimeout(() => {
      openTimerRef.current = null
      if (!hoveringRef.current) return
      setTipOpen(true)
      pathTooltipLastOpenedAt = Date.now()
      pathTooltipLastOpenedInstanceId = instanceId
    }, delay)
  }, [enabled, instanceId, clearOpenTimer])

  const onMouseEnter = useCallback(
    (e: MouseEvent) => {
      hoveringRef.current = true
      scheduleOpen()
      return e
    },
    [scheduleOpen],
  )

  const onMouseLeave = useCallback(() => {
    hoveringRef.current = false
    clearOpenTimer()
    setTipOpen(false)
  }, [clearOpenTimer])

  return { tipOpen: enabled && tipOpen, onMouseEnter, onMouseLeave, path }
}

export function PathTooltipBubble({
  path,
  align = 'center',
}: {
  path: string
  align?: 'center' | 'start'
}) {
  const alignClass =
    align === 'start' ? styles.pathTooltipAlignStart : styles.pathTooltipAlignCenter

  return (
    <span
      className={`${styles.pathTooltip} ${alignClass}`}
      role="tooltip"
      data-node-id="3975:51738"
    >
      {path}
    </span>
  )
}

export default function TabWithPathTooltip({
  path,
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  onPointerDown,
  ...rest
}: ComponentProps<'div'> & { path: string }) {
  const tooltip = usePathTooltip(path, true)

  return (
    <div
      {...rest}
      className={`${className ?? ''} ${styles.pathTooltipHost}`}
      onPointerDown={onPointerDown}
      onMouseEnter={(e) => {
        onMouseEnter?.(e)
        tooltip.onMouseEnter(e)
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e)
        tooltip.onMouseLeave()
      }}
    >
      {children}
      {tooltip.tipOpen ? <PathTooltipBubble path={path} /> : null}
    </div>
  )
}
