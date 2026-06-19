import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'

export type FloatingWindowSize = {
  width: number
  height: number
}

export const STUDIO_SETTINGS_DEFAULT_SIZE: FloatingWindowSize = {
  width: 640,
  height: 400,
}

export const STUDIO_SETTINGS_MIN_SIZE: FloatingWindowSize = {
  width: 480,
  height: 400,
}

export function useFloatingWindowResize(options: {
  frameRef: RefObject<HTMLElement | null>
  hostSelector: string
  size: FloatingWindowSize
  onSizeChange: (size: FloatingWindowSize) => void
  minSize?: FloatingWindowSize
}): { onResizePointerDown: (e: ReactPointerEvent<HTMLElement>) => void } {
  const {
    frameRef,
    hostSelector,
    size,
    onSizeChange,
    minSize = STUDIO_SETTINGS_MIN_SIZE,
  } = options

  const sizeRef = useRef(size)
  sizeRef.current = size
  const onSizeChangeRef = useRef(onSizeChange)
  onSizeChangeRef.current = onSizeChange

  const onResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()

      const frame = frameRef.current
      const host = frame?.querySelector(hostSelector) as HTMLElement | null
      if (frame == null || host == null) return

      const startX = e.clientX
      const startY = e.clientY
      const startWidth = host.offsetWidth
      const startHeight = host.offsetHeight

      frame.setAttribute('data-floating-window-dragging', 'true')

      const onPointerMove = (ev: globalThis.PointerEvent) => {
        ev.preventDefault()
        onSizeChangeRef.current({
          width: Math.max(minSize.width, startWidth + (ev.clientX - startX)),
          height: Math.max(minSize.height, startHeight + (ev.clientY - startY)),
        })
      }

      const finish = () => {
        frame.removeAttribute('data-floating-window-dragging')
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', finish)
        window.removeEventListener('pointercancel', finish)
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', finish)
      window.addEventListener('pointercancel', finish)
    },
    [frameRef, hostSelector, minSize.height, minSize.width],
  )

  return { onResizePointerDown }
}
