import type { ReactNode } from 'react'
import { publicAssetUrl } from '../../publicAssetUrl'
import type { PlaceDockPanelId } from './placeDockPanels'
import { useTabRowDragReorder, type TabRowDragBindings } from './useTabRowDragReorder'
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
  drag: TabRowDragBindings
  onActivate: () => void
}

export type PlaceDocumentDockTabStripProps = {
  tabs: readonly PlaceDockPanelId[]
  activeTab: PlaceDockPanelId
  onReorder: (fromIndex: number, toIndex: number) => void
  onActivate: (panelId: PlaceDockPanelId) => void
  renderTab: (panelId: PlaceDockPanelId, ctx: PlaceDocumentDockTabRenderContext) => ReactNode
  onTabStripPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
}

export default function PlaceDocumentDockTabStrip({
  tabs,
  activeTab,
  onReorder,
  onActivate,
  renderTab,
  onTabStripPointerDown,
}: PlaceDocumentDockTabStripProps) {
  const tabDrag = useTabRowDragReorder(onReorder)

  return (
    <div
      ref={tabDrag.rowRef}
      className={`${styles.tabRow} ${dockStyles.documentDockTabRow}`}
      role="tablist"
      aria-label="Place documents"
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
      <div className={styles.tabRowUnderline} aria-hidden>
        <img src={publicAssetUrl('assets/tab-underline.svg')} alt="" />
      </div>
    </div>
  )
}

export function placeDocumentDockTabDragProps(
  drag: TabRowDragBindings,
  tabIndex: number,
) {
  return {
    dragTabIndex: tabIndex,
    dragClassName: drag.tabClass(tabIndex, TAB_DRAG_CLASSES),
    dragTabProps: {
      ...drag.getTabProps(tabIndex),
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
