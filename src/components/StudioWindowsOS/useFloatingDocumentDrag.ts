import { useCallback, useRef } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { FloatingDocumentPosition } from './floatingDocument'

const DRAG_THRESHOLD_PX = 6

export function useFloatingDocumentDrag(options: {
  frameRef: RefObject<HTMLElement | null>
  position: FloatingDocumentPosition | null
  onPositionChange: (position: FloatingDocumentPosition) => void
}): {
  positionStyle: CSSProperties | undefined
  onDragHandlePointerDown: (e: ReactPointerEvent<HTMLElement>) => void
} {
  const { frameRef, position, onPositionChange } = options

  const positionRef = useRef(position)
  positionRef.current = position
  const onPositionChangeRef = useRef(onPositionChange)
  onPositionChangeRef.current = onPositionChange

  const onDragHandlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      if ((e.target as HTMLElement).closest('button')) return

      const panelEl = (e.currentTarget as HTMLElement).closest(
        '[data-floating-document]',
      ) as HTMLElement | null
      const frame = frameRef.current
      if (panelEl == null || frame == null) return

      e.preventDefault()

      const frameRect = frame.getBoundingClientRect()
      const panelRect = panelEl.getBoundingClientRect()
      const startPointerX = e.clientX
      const startPointerY = e.clientY
      const startLeft = positionRef.current?.left ?? panelRect.left - frameRect.left
      const startTop = positionRef.current?.top ?? panelRect.top - frameRect.top
      let dragging = false

      const onPointerMove = (ev: globalThis.PointerEvent) => {
        if (!dragging) {
          const dx = ev.clientX - startPointerX
          const dy = ev.clientY - startPointerY
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
          dragging = true
          frame.setAttribute('data-floating-window-dragging', 'true')
        }
        ev.preventDefault()
        const nextLeft = startLeft + (ev.clientX - startPointerX)
        const nextTop = startTop + (ev.clientY - startPointerY)
        const maxLeft = Math.max(0, frameRect.width - panelRect.width)
        const maxTop = Math.max(0, frameRect.height - panelRect.height)
        onPositionChangeRef.current({
          left: Math.min(Math.max(0, nextLeft), maxLeft),
          top: Math.min(Math.max(0, nextTop), maxTop),
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
    [frameRef],
  )

  const positionStyle: CSSProperties | undefined = position
    ? { left: position.left, top: position.top, right: 'auto', bottom: 'auto' }
    : undefined

  return { positionStyle, onDragHandlePointerDown }
}
