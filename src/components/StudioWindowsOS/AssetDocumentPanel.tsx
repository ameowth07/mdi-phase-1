import { Music } from 'lucide-react'
import { TabCloseButton } from './documentTabIcons'
import { buildPlaceTabClassName } from './buildPlaceTabClassName'
import TabWithPathTooltip from './TabWithPathTooltip'
import type { AssetCatalogRow } from './assetManagerCatalog'
import tabStyles from './StudioWindowsOS.module.css'
import css from './AssetDocumentPanel.module.css'

export type AssetDocumentPanelProps = {
  asset: AssetCatalogRow
  pathTooltip: string
  /** Tabbed bottom dock — tabs render in PanelDockStack, not here. */
  hideTabStrip?: boolean
  documentFocused?: boolean
  showFocusRing?: boolean
  onFocusDocument?: () => void
  onTabClose?: () => void
  onTabStripPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
}

function TabDiamond() {
  return (
    <svg className={css.tabLeadingIcon} viewBox="0 0 12 12" aria-hidden>
      <path d="M6 1.2 10.8 6 6 10.8 1.2 6Z" fill="currentColor" opacity={0.9} />
    </svg>
  )
}

function AssetTabLeadingIcon({ asset }: { asset: AssetCatalogRow }) {
  if (asset.thumb === 'audio') {
    return <Music size={12} strokeWidth={1.5} className={css.tabLeadingIcon} aria-hidden />
  }
  return <TabDiamond />
}

export default function AssetDocumentPanel({
  asset,
  pathTooltip,
  hideTabStrip = false,
  documentFocused = true,
  showFocusRing = false,
  onFocusDocument,
  onTabClose,
  onTabStripPointerDown,
}: AssetDocumentPanelProps) {
  const tabClassName = buildPlaceTabClassName({
    active: documentFocused,
    tabStroke: documentFocused,
    tabStrokeOn: true,
    tabStrokeAllEdges: false,
    tabStrokeConnected: false,
    strokeOn: false,
    tabTintOn: false,
    datamodel: 'drone',
    editMode: true,
  })

  return (
    <section className={css.root} aria-label={asset.name}>
      {hideTabStrip ? null : (
        <div
          className={tabStyles.tabRow}
          onPointerDown={(e) => {
            onFocusDocument?.()
            onTabStripPointerDown?.(e)
          }}
        >
        <TabWithPathTooltip
          path={pathTooltip}
          role="tab"
          tabIndex={0}
          aria-selected={documentFocused}
          className={tabClassName}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onFocusDocument?.()
          }}
        >
          <AssetTabLeadingIcon asset={asset} />
          <span>{asset.name}</span>
          {onTabClose ? (
            <TabCloseButton onClose={() => onTabClose()} />
          ) : (
            <span className={tabStyles.tabCloseSpacer} aria-hidden />
          )}
        </TabWithPathTooltip>
        <div className={tabStyles.tabRowUnderline} aria-hidden />
      </div>
      )}

      <div className={css.body} onPointerDown={() => onFocusDocument?.()}>
        <div className={css.viewport}>
          {asset.thumbUrl ? (
            <img src={asset.thumbUrl} alt="" />
          ) : (
            <div className={css.audioPlaceholder}>
              <Music size={48} strokeWidth={1.25} aria-hidden />
            </div>
          )}
          {showFocusRing ? <div className={tabStyles.editWorkspaceInsetRing} aria-hidden /> : null}
        </div>
      </div>
    </section>
  )
}
