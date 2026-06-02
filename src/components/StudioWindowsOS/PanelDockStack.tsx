import type { ReactNode } from 'react'
import { publicAssetUrl } from '../../publicAssetUrl'
import type { DockPanelId, DockZoneId, PanelStackState } from './panelDock'
import { panelDockLabel, reorderStackTabs, setStackActiveTab } from './panelDock'
import { isPlaceDockPanelId, type PlaceDockPanelId } from './placeDockPanels'
import PlaceDocumentDockTabStrip, {
  type PlaceDocumentDockTabRenderContext,
} from './PlaceDocumentDockTabStrip'
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
  renderPanel: (
    panelId: DockPanelId,
    ctx: { tabbed: boolean; placeDocumentTabStripInDock: boolean },
  ) => ReactNode
  /** Fixed-height stack (prototype settings only). */
  fixedHeight?: boolean
  /** Explorer / Properties — minimum share of the right rail. */
  stackMajor?: boolean
  resolvePlaceDisplayName?: (placeId: string) => string | undefined
  renderPlaceDocumentTab?: (
    panelId: PlaceDockPanelId,
    ctx: PlaceDocumentDockTabRenderContext,
  ) => ReactNode
  onPlaceTabStripPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
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
  resolvePlaceDisplayName,
  renderPlaceDocumentTab,
  onPlaceTabStripPointerDown,
}: PanelDockStackProps) {
  const auxTabDrag = useTabRowDragReorder((from, to) => {
    onStackChange(reorderStackTabs(stack, from, to))
  })

  const placeTabs = stack.tabs.filter((t): t is PlaceDockPanelId => isPlaceDockPanelId(t))
  const auxTabs = stack.tabs.filter((t) => !isPlaceDockPanelId(t))
  const useDocumentPlaceTabs = zone === 'bottom' && placeTabs.length > 0 && !!renderPlaceDocumentTab
  const showDocumentTabStrip = useDocumentPlaceTabs && placeTabs.length > 1
  const showAuxTabRow = auxTabs.length > 1 || (auxTabs.length > 0 && showDocumentTabStrip)

  const tabbed = stack.tabs.length > 1
  const activePanel = stack.tabs.includes(stack.activeTab)
    ? stack.activeTab
    : stack.tabs[0]!

  const panelCtx = {
    tabbed,
    placeDocumentTabStripInDock: showDocumentTabStrip,
  }

  const reorderPlaceTabs = (from: number, to: number) => {
    const visible = stack.tabs.filter((t): t is PlaceDockPanelId => isPlaceDockPanelId(t))
    const reordered = [...visible]
    const [moved] = reordered.splice(from, 1)
    if (moved == null) return
    reordered.splice(to, 0, moved)
    let pi = 0
    const tabs = stack.tabs.map((t) => (isPlaceDockPanelId(t) ? reordered[pi++]! : t))
    onStackChange({ ...stack, tabs })
  }

  const documentStripActiveTab = isPlaceDockPanelId(activePanel) ? activePanel : null

  const stackChrome = useDocumentPlaceTabs ? (
    <div className={dockStyles.documentDockStack}>
      {showDocumentTabStrip ? (
        <PlaceDocumentDockTabStrip
          tabs={placeTabs}
          activeTab={documentStripActiveTab ?? placeTabs[0]!}
          onReorder={reorderPlaceTabs}
          onActivate={(panelId) => onStackChange(setStackActiveTab(stack, panelId))}
          renderTab={(panelId, ctx) =>
            renderPlaceDocumentTab(panelId, {
              ...ctx,
              active:
                documentStripActiveTab != null && panelId === documentStripActiveTab,
            })
          }
          onTabStripPointerDown={onPlaceTabStripPointerDown}
        />
      ) : null}
      <div className={dockStyles.stackBody}>
        {renderPanel(activePanel, panelCtx)}
      </div>
      {showAuxTabRow ? (
        <div
          ref={auxTabDrag.rowRef}
          className={`${styles.tabRow} ${dockStyles.panelTabRow}`}
          role="tablist"
          aria-label="Panel tabs"
        >
          {auxTabs.map((panelId) => {
            const tabIndex = stack.tabs.indexOf(panelId)
            const active = panelId === activePanel
            const dragClass = auxTabDrag.tabClass(tabIndex, TAB_DRAG_CLASSES)
            return (
              <button
                key={panelId}
                type="button"
                role="tab"
                tabIndex={0}
                aria-selected={active}
                data-panel-dock-tab={panelId}
                className={`${styles.tab} ${active ? styles.tabActive : styles.tabInactive} ${dragClass}`}
                {...auxTabDrag.getTabProps(tabIndex)}
                {...tabActivateHandlers(auxTabDrag, () =>
                  onStackChange(setStackActiveTab(stack, panelId)),
                )}
              >
                <span>{panelDockLabel(panelId, resolvePlaceDisplayName)}</span>
              </button>
            )
          })}
          <div className={styles.tabRowUnderline} aria-hidden>
            <img src={publicAssetUrl('assets/tab-underline.svg')} alt="" />
          </div>
        </div>
      ) : null}
    </div>
  ) : (
    <>
      <div className={dockStyles.stackBody}>{renderPanel(activePanel, panelCtx)}</div>
      {tabbed ? (
        <div
          ref={auxTabDrag.rowRef}
          className={`${styles.tabRow} ${dockStyles.panelTabRow}`}
          role="tablist"
          aria-label="Panel tabs"
        >
          {stack.tabs.map((panelId, tabIndex) => {
            const active = panelId === activePanel
            const dragClass = auxTabDrag.tabClass(tabIndex, TAB_DRAG_CLASSES)
            return (
              <button
                key={panelId}
                type="button"
                role="tab"
                tabIndex={0}
                aria-selected={active}
                data-panel-dock-tab={panelId}
                className={`${styles.tab} ${active ? styles.tabActive : styles.tabInactive} ${dragClass}`}
                {...auxTabDrag.getTabProps(tabIndex)}
                {...tabActivateHandlers(auxTabDrag, () =>
                  onStackChange(setStackActiveTab(stack, panelId)),
                )}
              >
                <span>{panelDockLabel(panelId, resolvePlaceDisplayName)}</span>
              </button>
            )
          })}
          <div className={styles.tabRowUnderline} aria-hidden>
            <img src={publicAssetUrl('assets/tab-underline.svg')} alt="" />
          </div>
        </div>
      ) : null}
    </>
  )

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
        {stackChrome}
      </div>
    </div>
  )
}
