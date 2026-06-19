import type { CSSProperties, ReactNode, RefObject } from 'react'
import { TabCloseIcon } from './documentTabIcons'
import type { FloatingDocumentPosition } from './floatingDocument'
import { useFloatingDocumentDrag } from './useFloatingDocumentDrag'
import styles from './StudioWindowsOS.module.css'

export type FloatingDocumentWindowProps = {
  frameRef: RefObject<HTMLDivElement | null>
  title: string
  position: FloatingDocumentPosition | null
  onPositionChange: (position: FloatingDocumentPosition) => void
  onClose?: () => void
  titleAlign?: 'center' | 'left'
  children: ReactNode
}

export default function FloatingDocumentWindow({
  frameRef,
  title,
  position,
  onPositionChange,
  onClose,
  titleAlign = 'center',
  children,
}: FloatingDocumentWindowProps) {
  const { positionStyle, onDragHandlePointerDown } = useFloatingDocumentDrag({
    frameRef,
    position,
    onPositionChange,
  })

  const mergedPositionStyle: CSSProperties = {
    ...positionStyle,
    zIndex: 94,
  }

  const titleAlignClass =
    titleAlign === 'left' ? styles.panelTitleAlignLeft : styles.panelTitleAlignCenter

  return (
    <div
      className={styles.floatingDocumentHost}
      data-floating-document
      data-name={`Floating ${title}`}
      style={mergedPositionStyle}
    >
      <div className={styles.panel}>
        <div
          className={styles.floatingPanelChromeDrag}
          onPointerDown={onDragHandlePointerDown}
        >
          <header className={styles.panelHeader}>
            <span className={`${styles.panelTitle} ${titleAlignClass}`}>{title}</span>
            {onClose ? (
              <div className={styles.panelActions}>
                <button
                  type="button"
                  className={styles.panelAction}
                  aria-label="Close panel"
                  onClick={onClose}
                >
                  <TabCloseIcon />
                </button>
              </div>
            ) : null}
          </header>
        </div>
        <div className={styles.floatingDocumentBody}>{children}</div>
      </div>
    </div>
  )
}
