import { useCallback, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { DockPanelId, DockZoneId, PanelDockDropTarget, PanelDockLayoutState } from './panelDock'
import { movePanelInLayout } from './panelDock'

const DRAG_THRESHOLD_PX = 6

export type PanelDockDragState = {
  panelId: DockPanelId | null
  dropTarget: PanelDockDropTarget | null
}

export function usePanelDockDrag(
  layout: PanelDockLayoutState,
  onLayoutChange: (next: PanelDockLayoutState) => void,
  frameRef: RefObject<HTMLElement | null>,
) {
  const layoutRef = useRef(layout)
  layoutRef.current = layout
  const onLayoutChangeRef = useRef(onLayoutChange)
  onLayoutChangeRef.current = onLayoutChange

  const [dragState, setDragState] = useState<PanelDockDragState>({
    panelId: null,
    dropTarget: null,
  })

  const resolveDropTarget = useCallback(
    (clientX: number, clientY: number): PanelDockDropTarget | null => {
      const el = document.elementFromPoint(clientX, clientY)
      if (el == null) return null
      const zoneEl = el.closest('[data-panel-dock-zone]') as HTMLElement | null
      if (zoneEl == null) return null
      const zone = zoneEl.dataset.panelDockZone as DockZoneId | undefined
      if (zone !== 'right' && zone !== 'bottom') return null

      const mergeEl = el.closest('[data-panel-dock-merge]') as HTMLElement | null
      if (mergeEl?.dataset.panelDockMerge != null) {
        const stackIndex = Number.parseInt(mergeEl.dataset.panelDockMerge, 10)
        if (!Number.isNaN(stackIndex)) {
          return { kind: 'merge', zone, stackIndex }
        }
      }

      const insertEl = el.closest('[data-panel-dock-insert]') as HTMLElement | null
      if (insertEl?.dataset.panelDockInsert != null) {
        const stackIndex = Number.parseInt(insertEl.dataset.panelDockInsert, 10)
        if (!Number.isNaN(stackIndex)) {
          return { kind: 'new-stack', zone, stackIndex }
        }
      }

      return null
    },
    [],
  )

  const onPanelDragHandlePointerDown = useCallback(
    (panelId: DockPanelId) => (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      if ((e.target as HTMLElement).closest('button')) return
      e.stopPropagation()

      const startX = e.clientX
      const startY = e.clientY
      let dragging = false

      setDragState({ panelId, dropTarget: null })

      const onPointerMove = (ev: globalThis.PointerEvent) => {
        if (!dragging) {
          const dx = ev.clientX - startX
          const dy = ev.clientY - startY
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
          dragging = true
          const frame = frameRef.current
          if (frame) frame.setAttribute('data-panel-dock-dragging', 'true')
        }
        ev.preventDefault()
        const drop = resolveDropTarget(ev.clientX, ev.clientY)
        setDragState({ panelId, dropTarget: drop })
      }

      const finish = (ev: globalThis.PointerEvent) => {
        const drop = dragging ? resolveDropTarget(ev.clientX, ev.clientY) : null
        frameRef.current?.removeAttribute('data-panel-dock-dragging')

        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', finish)
        window.removeEventListener('pointercancel', finish)

        setDragState({ panelId: null, dropTarget: null })

        if (dragging && drop != null) {
          onLayoutChangeRef.current(
            movePanelInLayout(layoutRef.current, panelId, drop),
          )
        }
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', finish)
      window.addEventListener('pointercancel', finish)
    },
    [frameRef, resolveDropTarget],
  )

  const isDropTarget = useCallback(
    (target: PanelDockDropTarget) => {
      const current = dragState.dropTarget
      if (current == null || dragState.panelId == null) return false
      return (
        current.kind === target.kind &&
        current.zone === target.zone &&
        current.stackIndex === target.stackIndex
      )
    },
    [dragState],
  )

  const isMergeDropTarget = useCallback(
    (zone: DockZoneId, stackIndex: number) => {
      const current = dragState.dropTarget
      return (
        dragState.panelId != null &&
        current?.kind === 'merge' &&
        current.zone === zone &&
        current.stackIndex === stackIndex
      )
    },
    [dragState],
  )

  return { dragState, onPanelDragHandlePointerDown, isDropTarget, isMergeDropTarget }
}
