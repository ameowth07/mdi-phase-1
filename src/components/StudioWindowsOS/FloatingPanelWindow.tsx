import type { CSSProperties, ReactNode } from 'react'
import { publicAssetUrl } from '../../publicAssetUrl'
import {
  FLOATING_SIDE_PANEL_LABELS,
  reorderFloatingSidePanelTabs,
  type FloatingPanelWindowState,
  type FloatingSidePanelId,
} from './floatingSidePanel'
import { useTabRowDragReorder } from './useTabRowDragReorder'
import { useFloatingWindowDrag } from './useFloatingWindowDrag'
import styles from './StudioWindowsOS.module.css'
import dockStyles from './PanelDock.module.css'

const TAB_DRAG_CLASSES = {
  tabDraggable: styles.tabDraggable,
  tabDragging: styles.tabDragging,
  tabDropTarget: styles.tabDropTarget,
} as const

export type FloatingPanelWindowProps = {
  frameRef: React.RefObject<HTMLDivElement | null>
  window: FloatingPanelWindowState
  mergeDropActive: boolean
  onWindowChange: (window: FloatingPanelWindowState) => void
  onMerge: (sourceWindowId: string, targetWindowId: string, mergedActiveTab: FloatingSidePanelId) => void
  onMergeHoverChange: (targetWindowId: string | null) => void
  renderHeader: (activeTab: FloatingSidePanelId) => ReactNode
  renderBody: (activeTab: FloatingSidePanelId) => ReactNode
}

function tabActivateHandlers(
  drag: ReturnType<typeof useTabRowDragReorder>,
  activate: () => void,
) {
  return {
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      if (drag.consumeClickAfterDrag()) return
      activate()
    },
  }
}

export default function FloatingPanelWindow({
  frameRef,
  window: win,
  mergeDropActive,
  onWindowChange,
  onMerge,
  onMergeHoverChange,
  renderHeader,
  renderBody,
}: FloatingPanelWindowProps) {
  const { positionStyle, onDragHandlePointerDown } = useFloatingWindowDrag({
    frameRef,
    windowId: win.windowId,
    position: win.position,
    onPositionChange: (position) => onWindowChange({ ...win, position }),
    onMerge: (targetWindowId, mergedActiveTab) =>
      onMerge(win.windowId, targetWindowId, mergedActiveTab),
    onMergeHoverChange,
  })

  const tabDrag = useTabRowDragReorder((from, to) => {
    onWindowChange({
      ...win,
      tabs: reorderFloatingSidePanelTabs(win.tabs, from, to),
    })
  })

  const resolvedActive = win.tabs.includes(win.activeTab) ? win.activeTab : win.tabs[0]!
  const tabbed = win.tabs.length > 1
  const primaryTab = win.tabs[0] ?? resolvedActive

  const hostClass = [
    styles.floatingPanelHost,
    win.defaultSlot > 0 ? styles.floatingPanelHostOffset : null,
    mergeDropActive ? dockStyles.stackDropTarget : null,
  ]
    .filter(Boolean)
    .join(' ')

  const mergedPositionStyle: CSSProperties = {
    ...positionStyle,
    zIndex: 95 + win.defaultSlot,
  }

  return (
    <div
      className={hostClass}
      data-floating-panel
      data-floating-window-id={win.windowId}
      data-floating-window-primary-tab={primaryTab}
      data-floating-window-active-tab={resolvedActive}
      data-name={
        tabbed ? 'Floating Explorer / Properties' : `Floating ${FLOATING_SIDE_PANEL_LABELS[resolvedActive]}`
      }
      style={mergedPositionStyle}
    >
      <div className={styles.panel}>
        <div
          className={styles.floatingPanelChromeDrag}
          onPointerDown={onDragHandlePointerDown}
        >
          {renderHeader(resolvedActive)}
        </div>
        <div className={styles.floatingPanelBody}>{renderBody(resolvedActive)}</div>
        {tabbed ? (
          <div
            ref={tabDrag.rowRef}
            className={`${styles.tabRow} ${dockStyles.panelTabRow}`}
            role="tablist"
            aria-label="Floating panel tabs"
          >
            {win.tabs.map((panelId, tabIndex) => {
              const active = panelId === resolvedActive
              const dragClass = tabDrag.tabClass(tabIndex, TAB_DRAG_CLASSES)
              return (
                <button
                  key={panelId}
                  type="button"
                  role="tab"
                  tabIndex={0}
                  aria-selected={active}
                  data-panel-dock-tab={panelId}
                  className={`${styles.tab} ${active ? styles.tabActive : styles.tabInactive} ${dragClass}`}
                  {...tabDrag.getTabProps(tabIndex)}
                  {...tabActivateHandlers(tabDrag, () =>
                    onWindowChange({ ...win, activeTab: panelId }),
                  )}
                >
                  <span>{FLOATING_SIDE_PANEL_LABELS[panelId]}</span>
                </button>
              )
            })}
            <div className={styles.tabRowUnderline} aria-hidden>
              <img src={publicAssetUrl('assets/tab-underline.svg')} alt="" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
