import type { ReactNode } from 'react'
import { publicAssetUrl } from '../../publicAssetUrl'
import type { DockPanelId, DockZoneId, PanelStackState } from './panelDock'
import { PANEL_DOCK_LABELS, reorderStackTabs, setStackActiveTab } from './panelDock'
import { useTabRowDragReorder } from './useTabRowDragReorder'
import styles from './StudioWindowsOS.module.css'
import dockStyles from './PanelDock.module.css'

const TAB_DRAG_CLASSES = {
  tabDraggable: styles.tabDraggable,
  tabDragging: styles.tabDragging,
  tabDropTarget: styles.tabDropTarget,
} as const

export type PanelDockStackProps = {
  zone: DockZoneId
  stackIndex: number
  stack: PanelStackState
  onStackChange: (stack: PanelStackState) => void
  mergeDropActive: boolean
  renderPanel: (panelId: DockPanelId, ctx: { tabbed: boolean }) => ReactNode
  /** Fixed-height stack (prototype settings only). */
  fixedHeight?: boolean
  /** Explorer / Properties — minimum share of the right rail. */
  stackMajor?: boolean
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

export default function PanelDockStack({
  zone,
  stackIndex,
  stack,
  onStackChange,
  mergeDropActive,
  renderPanel,
  fixedHeight,
  stackMajor,
}: PanelDockStackProps) {
  const tabDrag = useTabRowDragReorder((from, to) => {
    onStackChange(reorderStackTabs(stack, from, to))
  })

  const tabbed = stack.tabs.length > 1
  const activePanel = stack.tabs.includes(stack.activeTab)
    ? stack.activeTab
    : stack.tabs[0]!

  return (
    <div
      className={[
        dockStyles.stack,
        fixedHeight ? dockStyles.stackFixed : null,
        stackMajor ? dockStyles.stackMajor : null,
        mergeDropActive ? dockStyles.stackDropTarget : null,
      ]
        .filter(Boolean)
        .join(' ')}
      data-panel-dock-merge={stackIndex}
      data-panel-dock-zone={zone}
    >
      <div className={`${styles.panel} ${fixedHeight ? styles.panelInteraction : ''}`}>
        <div className={dockStyles.stackBody}>
          {renderPanel(activePanel, { tabbed })}
        </div>
        {tabbed ? (
          <div
            ref={tabDrag.rowRef}
            className={`${styles.tabRow} ${dockStyles.panelTabRow}`}
            role="tablist"
            aria-label="Panel tabs"
          >
            {stack.tabs.map((panelId, tabIndex) => {
              const active = panelId === activePanel
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
                    onStackChange(setStackActiveTab(stack, panelId)),
                  )}
                >
                  <span>{PANEL_DOCK_LABELS[panelId]}</span>
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
