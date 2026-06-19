import { publicAssetUrl } from '../../publicAssetUrl'
import { buildPlaceTabClassName } from './buildPlaceTabClassName'
import DocumentPlaceTab from './DocumentPlaceTab'
import ServerSim from './ServerSim'
import tabStyles from './StudioWindowsOS.module.css'
import css from './PlaceDocumentPanel.module.css'

export type PlaceDocumentPanelProps = {
  /** Panel / viewport aria label (place name). */
  title: string
  /** Tab label — defaults to `title`. */
  tabLabel?: string
  pathTooltip: string
  tabLeadingIcon?: 'place' | 'server'
  fillDock?: boolean
  /** Tabbed bottom dock — tabs render in PanelDockStack, not here. */
  hideTabStrip?: boolean
  tabStroke?: boolean
  tabStrokeAllEdges?: boolean
  tabStrokeConnected?: boolean
  /** Testing UI: Has semantic stroke — green Server top edge on tab. */
  strokeOn?: boolean
  /** Testing UI: Tab tint — filled Server tab background. */
  tabTintOn?: boolean
  /** Place document has focus — active tab stroke + viewport ring. */
  documentFocused?: boolean
  showFocusRing?: boolean
  /**
   * Test mode: dock-only place documents render as Server simulation viewports
   * (non-default places; the default place is Client in the main strip).
   */
  testServerView?: boolean
  /** Test mode: green Server semantic stroke on the viewport. */
  showServerSemanticStroke?: boolean
  /** Server view after a client joins the place (test). */
  level1ServerHasClient?: boolean
  /** Alias for `level1ServerHasClient`. */
  hasJoinedClient?: boolean
  onFocusDocument?: () => void
  onTabClose?: () => void
  onTabStripPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
}

export default function PlaceDocumentPanel({
  title,
  tabLabel,
  pathTooltip,
  tabLeadingIcon,
  fillDock = false,
  hideTabStrip = false,
  tabStroke = true,
  tabStrokeAllEdges = false,
  tabStrokeConnected = false,
  strokeOn = false,
  tabTintOn = false,
  documentFocused = true,
  showFocusRing = false,
  testServerView = false,
  showServerSemanticStroke = false,
  level1ServerHasClient = false,
  hasJoinedClient,
  onFocusDocument,
  onTabClose,
  onTabStripPointerDown,
}: PlaceDocumentPanelProps) {
  const resolvedTabLabel = tabLabel ?? title
  const resolvedTabIcon = tabLeadingIcon ?? (testServerView ? 'server' : 'place')

  const tabClassName = buildPlaceTabClassName({
    active: documentFocused,
    tabStroke: tabStroke && documentFocused,
    tabStrokeOn: tabStroke,
    tabStrokeAllEdges,
    tabStrokeConnected,
    strokeOn: strokeOn && documentFocused,
    tabTintOn: tabTintOn && documentFocused,
    datamodel: testServerView ? 'server' : 'drone',
    editMode: !testServerView,
  })

  const viewportClass = testServerView
    ? [
        tabStyles.serverViewport,
        showServerSemanticStroke ? tabStyles.serverViewportFocused : null,
      ]
        .filter(Boolean)
        .join(' ')
    : css.viewport

  return (
    <section
      className={`${css.root} ${fillDock ? css.rootFillDock : ''} ${hideTabStrip ? css.rootEmbedded : ''}`}
      aria-label={title}
    >
      {hideTabStrip ? null : (
        <div
          className={tabStyles.tabRow}
          onPointerDown={(e) => {
            onFocusDocument?.()
            onTabStripPointerDown?.(e)
          }}
        >
          <DocumentPlaceTab
            label={resolvedTabLabel}
            path={pathTooltip}
            tabClassName={tabClassName}
            leadingIcon={resolvedTabIcon}
            onActivate={onFocusDocument}
            onClose={onTabClose}
          />
          <div className={tabStyles.tabRowUnderline} aria-hidden />
        </div>
      )}

      <div className={css.body} onPointerDown={() => onFocusDocument?.()}>
        <div className={viewportClass}>
          {testServerView ? (
            <ServerSim
              variant="level-1"
              hasJoinedClient={hasJoinedClient ?? level1ServerHasClient}
            />
          ) : (
            <img src={publicAssetUrl('assets/viewport.png')} alt="3D viewport" />
          )}
          {showFocusRing ? (
            <div className={tabStyles.editWorkspaceInsetRing} aria-hidden />
          ) : null}
        </div>
      </div>
    </section>
  )
}
