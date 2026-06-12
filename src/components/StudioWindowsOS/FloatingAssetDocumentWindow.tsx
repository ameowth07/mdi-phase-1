import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import type { FloatingAssetDocumentPosition } from './floatingAssetDocument'
import { useFloatingDocumentDrag } from './useFloatingDocumentDrag'
import styles from './StudioWindowsOS.module.css'

export type FloatingAssetDocumentWindowProps = {
  frameRef: React.RefObject<HTMLDivElement | null>
  assetId: string
  position: FloatingAssetDocumentPosition | null
  defaultSlot: number
  onPositionChange: (position: FloatingAssetDocumentPosition) => void
  children: (drag: {
    onTabStripPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  }) => ReactNode
}

export default function FloatingAssetDocumentWindow({
  frameRef,
  assetId,
  position,
  defaultSlot,
  onPositionChange,
  children,
}: FloatingAssetDocumentWindowProps) {
  const { positionStyle, onDragHandlePointerDown } = useFloatingDocumentDrag({
    frameRef,
    position,
    onPositionChange,
    hostSelector: '[data-floating-asset-document]',
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
      data-floating-asset-document
      data-floating-asset-id={assetId}
      data-name={`Floating asset ${assetId}`}
      style={
        defaultSlot > 0
          ? ({
              ...mergedPositionStyle,
              '--floating-place-slot': defaultSlot,
            } as CSSProperties)
          : mergedPositionStyle
      }
    >
      <div className={styles.floatingPlaceDocumentBody}>{children({ onTabStripPointerDown: onDragHandlePointerDown })}</div>
    </div>
  )
}
