import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import type { FloatingPlaceDocumentPosition } from './floatingPlaceDocument'
import { useFloatingDocumentDrag } from './useFloatingDocumentDrag'
import styles from './StudioWindowsOS.module.css'

export type FloatingPlaceDocumentWindowProps = {
  frameRef: React.RefObject<HTMLDivElement | null>
  placeId: string
  position: FloatingPlaceDocumentPosition | null
  defaultSlot: number
  onPositionChange: (position: FloatingPlaceDocumentPosition) => void
  children: (drag: {
    onTabStripPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  }) => ReactNode
}

export default function FloatingPlaceDocumentWindow({
  frameRef,
  placeId,
  position,
  defaultSlot,
  onPositionChange,
  children,
}: FloatingPlaceDocumentWindowProps) {
  const { positionStyle, onDragHandlePointerDown } = useFloatingDocumentDrag({
    frameRef,
    position,
    onPositionChange,
    hostSelector: '[data-floating-place-document]',
  })

  const mergedPositionStyle: CSSProperties = {
    ...positionStyle,
    zIndex: 96 + defaultSlot,
  }

  const hostClass = [
    styles.floatingDocumentHost,
    defaultSlot > 0 ? styles.floatingPlaceDocumentHostOffset : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={hostClass}
      data-floating-place-document
      data-floating-place-id={placeId}
      data-name={`Floating place ${placeId}`}
      style={
        defaultSlot > 0
          ? ({
              ...mergedPositionStyle,
              '--floating-place-slot': defaultSlot,
            } as CSSProperties)
          : mergedPositionStyle
      }
    >
      <div className={styles.floatingPlaceDocumentBody}>
        {children({ onTabStripPointerDown: onDragHandlePointerDown })}
      </div>
    </div>
  )
}
