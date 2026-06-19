import type { ReactNode } from 'react'
import type { DocumentDockPanelId } from './documentDockPanels'
import { useTabRowDragReorder, type TabRowDragBindings } from './useTabRowDragReorder'
import { isTriZoneTabDrag, type TriZoneTabDragBindings } from './useTriZoneTabDrag'
import styles from './StudioWindowsOS.module.css'
import dockStyles from './PanelDock.module.css'

const TAB_DRAG_CLASSES = {
  tabDraggable: styles.tabDraggable,
  tabDragging: styles.tabDragging,
  tabDropTarget: styles.tabDropTarget,
} as const

export type PlaceDocumentDockTabRenderContext = {
  active: boolean
  tabIndex: number
  drag: TabRowDragBindings | TriZoneTabDragBindings
  onActivate: () => void
}

export type PlaceDocumentDockTabStripProps = {
  tabs: readonly DocumentDockPanelId[]
  activeTab: DocumentDockPanelId
  onReorder: (fromIndex: number, toIndex: number) => void
  onActivate: (panelId: DocumentDockPanelId) => void
  renderTab: (panelId: DocumentDockPanelId, ctx: PlaceDocumentDockTabRenderContext) => ReactNode
  onTabStripPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
  /** Shared main / iso / dock document tab drag (bottom place strip). */
  documentTabStripDrag?: TriZoneTabDragBindings | null
}

export default function PlaceDocumentDockTabStrip({
  tabs,
  activeTab,
  onReorder,
  onActivate,
  renderTab,
  onTabStripPointerDown,
  documentTabStripDrag = null,
}: PlaceDocumentDockTabStripProps) {
  const localTabDrag = useTabRowDragReorder(onReorder)
  const useSharedDrag = documentTabStripDrag != null
  const tabDrag = useSharedDrag ? documentTabStripDrag : localTabDrag

  return (
    <div
      ref={useSharedDrag ? documentTabStripDrag.dockRowRef : localTabDrag.rowRef}
      className={`${styles.tabRow} ${dockStyles.documentDockTabRow}`}
      role="tablist"
      aria-label="Documents"
      data-document-dock-tab-row="true"
      onPointerDown={onTabStripPointerDown}
    >
      {tabs.map((panelId, tabIndex) =>
        renderTab(panelId, {
          active: panelId === activeTab,
          tabIndex,
          drag: tabDrag,
          onActivate: () => onActivate(panelId),
        }),
      )}
      <div className={styles.tabRowUnderline} aria-hidden />
    </div>
  )
}

export function placeDocumentDockTabDragProps(
  drag: TabRowDragBindings | TriZoneTabDragBindings,
  tabIndex: number,
) {
  const triDrag = isTriZoneTabDrag(drag as object)
    ? (drag as TriZoneTabDragBindings)
    : null
  const rowDrag = triDrag == null ? (drag as TabRowDragBindings) : null
  const dragClass =
    triDrag != null
      ? triDrag.tabClass('dock', tabIndex, TAB_DRAG_CLASSES)
      : rowDrag!.tabClass(tabIndex, TAB_DRAG_CLASSES)
  const dragTabProps =
    triDrag != null
      ? triDrag.getTabProps('dock', tabIndex)
      : rowDrag!.getTabProps(tabIndex)

  return {
    dragTabIndex: tabIndex,
    dragClassName: dragClass,
    dragTabProps: {
      ...dragTabProps,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        if (drag.consumeClickAfterDrag()) {
          e.preventDefault()
          return
        }
      },
    },
  }
}
