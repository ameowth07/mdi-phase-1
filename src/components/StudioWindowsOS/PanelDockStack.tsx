import type { ReactNode } from 'react'
import type { DockPanelId, DockZoneId, PanelStackState } from './panelDock'
import { panelDockLabel, reorderStackTabs, setStackActiveTab } from './panelDock'
import { isDocumentDockPanelId, type DocumentDockPanelId } from './documentDockPanels'
import PlaceDocumentDockTabStrip, {
  type PlaceDocumentDockTabRenderContext,
} from './PlaceDocumentDockTabStrip'
import { useTabRowDragReorder } from './useTabRowDragReorder'
import type { TriZoneTabDragBindings } from './useTriZoneTabDrag'
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
    panelId: DocumentDockPanelId,
    ctx: PlaceDocumentDockTabRenderContext,
  ) => ReactNode
  onPlaceTabStripPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
  documentTabStripDrag?: TriZoneTabDragBindings | null
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
  documentTabStripDrag = null,
}: PanelDockStackProps) {
  const auxTabDrag = useTabRowDragReorder((from, to) => {
    onStackChange(reorderStackTabs(stack, from, to))
  })

  const documentTabs = stack.tabs.filter((t): t is DocumentDockPanelId =>
    isDocumentDockPanelId(t),
  )
  const auxTabs = stack.tabs.filter((t) => !isDocumentDockPanelId(t))
  const useDocumentPlaceTabs = zone === 'bottom' && documentTabs.length > 0 && !!renderPlaceDocumentTab
  /** Single-tab dock still uses the shared strip when tri-zone drag is active (drop target + draggable tab). */
  const showDocumentTabStrip =
    useDocumentPlaceTabs && (documentTabs.length > 1 || documentTabStripDrag != null)
  const showAuxTabRow = auxTabs.length > 1 || (auxTabs.length > 0 && showDocumentTabStrip)

  const tabbed = stack.tabs.length > 1
  const activePanel = stack.tabs.includes(stack.activeTab)
    ? stack.activeTab
    : stack.tabs[0]!

  const panelCtx = {
    tabbed,
    placeDocumentTabStripInDock: showDocumentTabStrip,
  }

  const reorderDocumentTabs = (from: number, to: number) => {
    const visible = stack.tabs.filter((t): t is DocumentDockPanelId => isDocumentDockPanelId(t))
    const reordered = [...visible]
    const [moved] = reordered.splice(from, 1)
    if (moved == null) return
    reordered.splice(to, 0, moved)
    let di = 0
    const tabs = stack.tabs.map((t) => (isDocumentDockPanelId(t) ? reordered[di++]! : t))
    onStackChange({ ...stack, tabs })
  }

  const documentStripActiveTab = isDocumentDockPanelId(activePanel) ? activePanel : null

  const stackChrome = useDocumentPlaceTabs ? (
    <div className={dockStyles.documentDockStack} data-document-dock-stack="true">
      {showDocumentTabStrip ? (
        <PlaceDocumentDockTabStrip
          tabs={documentTabs}
          activeTab={documentStripActiveTab ?? documentTabs[0]!}
          onReorder={reorderDocumentTabs}
          onActivate={(panelId) => onStackChange(setStackActiveTab(stack, panelId))}
          documentTabStripDrag={documentTabStripDrag}
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
          <div className={styles.tabRowUnderline} aria-hidden />
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
          <div className={styles.tabRowUnderline} aria-hidden />
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
