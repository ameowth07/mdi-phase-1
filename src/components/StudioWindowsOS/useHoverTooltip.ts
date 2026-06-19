import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

const TOOLTIP_FIRST_DELAY_MS = 300
const TOOLTIP_CHAIN_WINDOW_MS = 1000

let tooltipLastOpenedAt = 0
let tooltipLastOpenedInstanceId: string | null = null

export function useHoverTooltip(enabled: boolean) {
  const instanceId = useId()
  const [open, setOpen] = useState(false)
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
      tooltipLastOpenedAt > 0 && now - tooltipLastOpenedAt < TOOLTIP_CHAIN_WINDOW_MS
    const chainDifferentHost =
      chainInWindow &&
      tooltipLastOpenedInstanceId !== null &&
      tooltipLastOpenedInstanceId !== instanceId
    const delay = chainDifferentHost ? 0 : TOOLTIP_FIRST_DELAY_MS

    openTimerRef.current = globalThis.setTimeout(() => {
      openTimerRef.current = null
      if (!hoveringRef.current) return
      setOpen(true)
      tooltipLastOpenedAt = Date.now()
      tooltipLastOpenedInstanceId = instanceId
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
    setOpen(false)
  }, [clearOpenTimer])

  return { open: enabled && open, onMouseEnter, onMouseLeave }
}
