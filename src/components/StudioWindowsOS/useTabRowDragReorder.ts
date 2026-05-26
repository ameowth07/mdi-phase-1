import { useCallback, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

const DRAG_THRESHOLD_PX = 5

export type TabDragStyleClasses = {
  tabDraggable: string
  tabDragging: string
  tabDropTarget: string
}

export type TabRowDragBindings = {
  rowRef: React.RefObject<HTMLDivElement | null>
  getTabProps: (index: number) => {
    'data-tab-draggable': 'true'
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
  }
  tabClass: (index: number, styles: TabDragStyleClasses) => string
  consumeClickAfterDrag: () => boolean
}

export function useTabRowDragReorder(
  onReorder: (fromIndex: number, toIndex: number) => void,
): TabRowDragBindings {
  const rowRef = useRef<HTMLDivElement | null>(null)
  const dragFromRef = useRef<number | null>(null)
  const draggingRef = useRef(false)
  const blockClickRef = useRef(false)
  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder

  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)

  const resolveDropIndex = useCallback((clientX: number): number | null => {
    const row = rowRef.current
    if (row == null || dragFromRef.current == null) return null

    const tabs = Array.from(row.querySelectorAll<HTMLElement>('[data-tab-draggable="true"]'))
    if (tabs.length === 0) return null

    for (let i = 0; i < tabs.length; i++) {
      const rect = tabs[i]!.getBoundingClientRect()
      const mid = rect.left + rect.width / 2
      if (clientX < mid) return i
    }
    return tabs.length - 1
  }, [])

  const tabClass = useCallback(
    (index: number, dragStyles: TabDragStyleClasses) => {
      if (dragFrom === index) return dragStyles.tabDragging
      if (dropTarget === index && dragFrom != null && dragFrom !== index) {
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
    (index: number) => ({
      'data-tab-draggable': 'true' as const,
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.button !== 0) return
        if ((e.target as HTMLElement).closest('button')) return

        e.stopPropagation()

        const startX = e.clientX
        const startY = e.clientY
        dragFromRef.current = index
        draggingRef.current = false
        blockClickRef.current = false
        setDragFrom(index)
        setDropTarget(index)

        const onPointerMove = (ev: globalThis.PointerEvent) => {
          if (!draggingRef.current) {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
            draggingRef.current = true
            blockClickRef.current = true
          }
          ev.preventDefault()
          const drop = resolveDropIndex(ev.clientX)
          if (drop != null) setDropTarget(drop)
        }

        const finish = (ev: globalThis.PointerEvent) => {
          const from = dragFromRef.current
          const wasDragging = draggingRef.current
          const to = wasDragging ? resolveDropIndex(ev.clientX) : null

          dragFromRef.current = null
          draggingRef.current = false
          setDragFrom(null)
          setDropTarget(null)

          window.removeEventListener('pointermove', onPointerMove)
          window.removeEventListener('pointerup', finish)
          window.removeEventListener('pointercancel', finish)

          if (wasDragging && from != null && to != null && from !== to) {
            onReorderRef.current(from, to)
          }
        }

        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', finish)
        window.addEventListener('pointercancel', finish)
      },
    }),
    [resolveDropIndex],
  )

  return { rowRef, getTabProps, tabClass, consumeClickAfterDrag }
}
