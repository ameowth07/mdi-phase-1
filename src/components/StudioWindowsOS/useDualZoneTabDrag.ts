import { useCallback, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { CombinedTabStripZone } from './documentTabStripZone'
import type { TabDragStyleClasses } from './useTabRowDragReorder'

const DRAG_THRESHOLD_PX = 5

export type DualZoneTabDragBindings = {
  mainRowRef: React.RefObject<HTMLDivElement | null>
  isoRowRef: React.RefObject<HTMLDivElement | null>
  getTabProps: (zone: CombinedTabStripZone, index: number) => {
    'data-tab-draggable': 'true'
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
  }
  tabClass: (zone: CombinedTabStripZone, index: number, styles: TabDragStyleClasses) => string
  consumeClickAfterDrag: () => boolean
}

type DropTarget = { zone: CombinedTabStripZone; index: number }

export function useDualZoneTabDrag(handlers: {
  onReorderWithin: (zone: CombinedTabStripZone, from: number, to: number) => void
  onMoveBetween: (
    fromZone: CombinedTabStripZone,
    fromIndex: number,
    toZone: CombinedTabStripZone,
    toIndex: number,
  ) => void
}): DualZoneTabDragBindings {
  const mainRowRef = useRef<HTMLDivElement | null>(null)
  const isoRowRef = useRef<HTMLDivElement | null>(null)
  const dragFromRef = useRef<{ zone: CombinedTabStripZone; index: number } | null>(null)
  const draggingRef = useRef(false)
  const blockClickRef = useRef(false)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const [dragFrom, setDragFrom] = useState<{ zone: CombinedTabStripZone; index: number } | null>(
    null,
  )
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  const resolveDropIndexInRow = useCallback(
    (row: HTMLDivElement | null, clientX: number): number | null => {
      if (row == null) return null
      const tabs = Array.from(row.querySelectorAll<HTMLElement>('[data-tab-draggable="true"]'))
      if (tabs.length === 0) return 0
      for (let i = 0; i < tabs.length; i++) {
        const rect = tabs[i]!.getBoundingClientRect()
        const mid = rect.left + rect.width / 2
        if (clientX < mid) return i
      }
      return tabs.length - 1
    },
    [],
  )

  const resolveDropTarget = useCallback(
    (clientX: number, clientY: number): DropTarget | null => {
      const mainRow = mainRowRef.current
      const isoRow = isoRowRef.current
      if (mainRow == null || isoRow == null) return null

      // Column shells (.editTabStripMain / .editTabStripIso) — not the tab row, which can
      // overflow with many tabs and skew hit-testing toward the main zone.
      const mainCol = mainRow.parentElement
      const isoCol = isoRow.parentElement
      if (mainCol == null || isoCol == null) return null

      const mainRect = mainCol.getBoundingClientRect()
      const isoRect = isoCol.getBoundingClientRect()
      const stripTop = Math.min(mainRect.top, isoRect.top) - 8
      const stripBottom = Math.max(mainRect.bottom, isoRect.bottom) + 8

      if (clientY < stripTop || clientY > stripBottom) return null

      const inMainCol = clientX >= mainRect.left && clientX <= mainRect.right
      const inIsoCol = clientX >= isoRect.left && clientX <= isoRect.right

      let zone: CombinedTabStripZone
      let row: HTMLDivElement

      if (inIsoCol && !inMainCol) {
        zone = 'iso'
        row = isoRow
      } else if (inMainCol && !inIsoCol) {
        zone = 'main'
        row = mainRow
      } else {
        const mainCx = mainRect.left + mainRect.width / 2
        const isoCx = isoRect.left + isoRect.width / 2
        if (Math.abs(clientX - isoCx) <= Math.abs(clientX - mainCx)) {
          zone = 'iso'
          row = isoRow
        } else {
          zone = 'main'
          row = mainRow
        }
      }

      const index = resolveDropIndexInRow(row, clientX)
      if (index == null) return null
      return { zone, index }
    },
    [resolveDropIndexInRow],
  )

  const tabClass = useCallback(
    (zone: CombinedTabStripZone, index: number, dragStyles: TabDragStyleClasses) => {
      if (dragFrom?.zone === zone && dragFrom.index === index) return dragStyles.tabDragging
      if (
        dropTarget?.zone === zone &&
        dropTarget.index === index &&
        dragFrom != null &&
        !(dragFrom.zone === zone && dragFrom.index === index)
      ) {
        return dragStyles.tabDropTarget
      }
      return dragStyles.tabDraggable
    },
    [dragFrom, dropTarget],
  )

  const consumeClickAfterDrag = useCallback(() => {
    if (blockClickRef.current) {
      blockClickRef.current = false
      return true
    }
    return false
  }, [])

  const getTabProps = useCallback(
    (zone: CombinedTabStripZone, index: number) => ({
      'data-tab-draggable': 'true' as const,
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.button !== 0) return
        if ((e.target as HTMLElement).closest('button')) return

        e.stopPropagation()

        const startX = e.clientX
        const startY = e.clientY
        const from = { zone, index }
        dragFromRef.current = from
        draggingRef.current = false
        blockClickRef.current = false
        setDragFrom(from)
        setDropTarget({ zone, index })

        const onPointerMove = (ev: globalThis.PointerEvent) => {
          if (!draggingRef.current) {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
            draggingRef.current = true
            blockClickRef.current = true
          }
          ev.preventDefault()
          const drop = resolveDropTarget(ev.clientX, ev.clientY)
          if (drop != null) setDropTarget(drop)
        }

        const finish = (ev: globalThis.PointerEvent) => {
          const fromDrag = dragFromRef.current
          const wasDragging = draggingRef.current
          const drop = wasDragging ? resolveDropTarget(ev.clientX, ev.clientY) : null

          dragFromRef.current = null
          draggingRef.current = false
          setDragFrom(null)
          setDropTarget(null)

          window.removeEventListener('pointermove', onPointerMove)
          window.removeEventListener('pointerup', finish)
          window.removeEventListener('pointercancel', finish)

          if (!wasDragging || fromDrag == null || drop == null) return
          if (fromDrag.zone === drop.zone && fromDrag.index === drop.index) return

          if (fromDrag.zone === drop.zone) {
            handlersRef.current.onReorderWithin(fromDrag.zone, fromDrag.index, drop.index)
          } else {
            handlersRef.current.onMoveBetween(
              fromDrag.zone,
              fromDrag.index,
              drop.zone,
              drop.index,
            )
          }
        }

        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', finish)
        window.addEventListener('pointercancel', finish)
      },
    }),
    [resolveDropTarget],
  )

  return { mainRowRef, isoRowRef, getTabProps, tabClass, consumeClickAfterDrag }
}

function tabDragClassesForDual(
  drag: DualZoneTabDragBindings,
  zone: CombinedTabStripZone,
  index: number,
  dragStyleClasses: TabDragStyleClasses,
): string {
  return drag.tabClass(zone, index, dragStyleClasses)
}

export { tabDragClassesForDual }
