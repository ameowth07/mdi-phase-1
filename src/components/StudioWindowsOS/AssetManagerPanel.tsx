import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDown,
  Globe,
  Import,
  Music,
  Search,
  SquareArrowOutUpRight,
} from 'lucide-react'
import {
  type AssetCatalogRow,
  SKYLINE_DRIFT_ASSETS,
  isPlaceCatalogRow,
  skylineDriftPlaceRows,
} from './assetManagerCatalog'
import { droneRacerGame } from './workspaceModel/workspaceConfig'
import { PanelCloseIcon } from './documentTabIcons'
import css from './AssetManagerPanel.module.css'

type AssetRow = AssetCatalogRow

function GameProjectIcon() {
  return (
    <svg
      className={css.dropdownIcon}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.44299 9.66614C8.52674 9.35372 8.83295 9.16038 9.14551 9.21082L12.1259 10.0061C12.4591 10.0956 12.6571 10.4382 12.5677 10.7715L11.7859 13.6884C11.6966 14.0217 11.3539 14.2195 11.0205 14.1302L8.10303 13.349C7.76983 13.2596 7.57203 12.9169 7.66113 12.5836L8.44299 9.66614ZM9.03076 12.3029L10.7404 12.7612L11.1981 11.0516L9.48853 10.5933L9.03076 12.3029Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.71729 2.5C8.26581 2.50003 8.78685 2.74022 9.14307 3.15735L10.7166 5H17.5C18.1904 5 18.75 5.55964 18.75 6.25V16.25C18.75 16.9404 18.1904 17.5 17.5 17.5H2.5C1.80964 17.5 1.25 16.9404 1.25 16.25V3.75C1.25 3.05964 1.80964 2.5 2.5 2.5H7.71729ZM10.2789 6.65161C9.80438 7.19074 9.12094 7.49992 8.40271 7.5H2.5V16.25H17.5V6.25H10.6323L10.2789 6.65161ZM2.5 6.25H8.40271C8.76179 6.24992 9.10357 6.09536 9.34082 5.82581L9.56238 5.57312L8.19275 3.96912C8.08884 3.84744 7.94254 3.77084 7.78503 3.75366L7.71729 3.75H2.5V6.25Z"
        fill="currentColor"
      />
    </svg>
  )
}

function isPlaceRow(row: AssetRow): boolean {
  return isPlaceCatalogRow(row)
}

function assetRowClass(rowId: string, hoveredId: string | null, selectedId: string | null): string {
  if (selectedId === rowId) return `${css.tableRow} ${css.tableRowSelected}`
  if (hoveredId === rowId) return `${css.tableRow} ${css.tableRowHover}`
  return css.tableRow
}

function AssetThumb({ row }: { row: AssetRow }) {
  if (row.thumb === 'place') {
    return (
      <span className={css.thumb}>
        <Globe size={14} strokeWidth={1.5} aria-hidden />
      </span>
    )
  }
  if (row.thumb === 'model' && row.thumbUrl) {
    return (
      <span className={css.thumb}>
        <img src={row.thumbUrl} alt="" />
      </span>
    )
  }
  if (row.thumb === 'audio') {
    return (
      <span className={css.thumb}>
        <Music size={14} strokeWidth={1.5} aria-hidden />
      </span>
    )
  }
  return <span className={css.thumb} aria-hidden />
}

export type AssetManagerPanelProps = {
  /** When true, panel grows to fill the bottom dock row (no Output beside it). */
  fillDock?: boolean
  titleAlign?: 'left' | 'center'
  /** Game whose assets are shown in the list. */
  gameName?: string
  hideHeader?: boolean
  onClose?: () => void
  onHeaderPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
  onOpenPlace?: (placeId: string) => void
  onOpenAsset?: (assetId: string) => void
}

export default function AssetManagerPanel({
  fillDock = false,
  titleAlign = 'center',
  gameName = droneRacerGame.displayName,
  hideHeader = false,
  onClose,
  onHeaderPointerDown,
  onOpenPlace,
  onOpenAsset,
}: AssetManagerPanelProps) {
  const contextMenuId = useId()
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>('neon-barriers')
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    rowId: string
    x: number
    y: number
  } | null>(null)

  const tableRows =
    gameName === droneRacerGame.displayName
      ? [...skylineDriftPlaceRows(), ...SKYLINE_DRIFT_ASSETS]
      : SKYLINE_DRIFT_ASSETS

  const contextMenuRow = contextMenu
    ? tableRows.find((row) => row.id === contextMenu.rowId) ?? null
    : null

  useEffect(() => {
    if (!contextMenu) return
    const closeMenu = () => setContextMenu(null)
    const onPointerDown = (event: PointerEvent) => {
      if (event.button === 2) return
      const target = event.target
      if (!(target instanceof Element)) {
        closeMenu()
        return
      }
      if (target.closest(`#${CSS.escape(contextMenuId)}`)) return
      closeMenu()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', closeMenu, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', closeMenu, true)
    }
  }, [contextMenu, contextMenuId])

  const openRowContextMenu = (
    event: React.MouseEvent<HTMLDivElement>,
    row: AssetRow,
  ) => {
    event.preventDefault()
    setSelectedAssetId(row.id)
    setContextMenu({ rowId: row.id, x: event.clientX, y: event.clientY })
  }

  const handleOpenRow = (row: AssetRow) => {
    setContextMenu(null)
    if (row.type === 'Place' && row.placeId) {
      onOpenPlace?.(row.placeId)
      return
    }
    onOpenAsset?.(row.id)
  }

  return (
    <section
      className={`${css.root} ${fillDock ? css.rootFillDock : ''} ${hideHeader ? css.rootEmbedded : ''}`}
      data-name="Panel"
      data-node-id="6040:143434"
      aria-label="Asset Manager"
    >
      {hideHeader ? null : (
        <header
          className={`${css.header} ${onHeaderPointerDown ? css.headerDraggable : ''}`}
          data-node-id="I3994:57525;3:141494"
          onPointerDown={onHeaderPointerDown}
        >
          <p
            className={`${css.title} ${
              titleAlign === 'left' ? css.titleAlignLeft : css.titleAlignCenter
            }`}
          >
            Asset Manager
          </p>
          <div className={css.headerActions}>
            <button type="button" className={css.headerBtn} aria-label="Pop out panel">
              <SquareArrowOutUpRight
                size={12}
                strokeWidth={1.35}
                className={css.headerPopoutIcon}
                aria-hidden
              />
            </button>
            <button
              type="button"
              className={css.headerBtn}
              aria-label="Close panel"
              onClick={onClose}
            >
              <PanelCloseIcon />
            </button>
          </div>
        </header>
      )}

      <div className={css.body} data-node-id="6040:143434">
        <div className={css.panelHeader} data-node-id="6040:143435">
          <button type="button" className={css.dropdown} aria-label={`${gameName} assets`}>
            <GameProjectIcon />
            <span className={css.dropdownLabel}>{gameName}</span>
            <ChevronDown size={12} strokeWidth={2} className={css.dropdownChevron} aria-hidden />
          </button>
          <div className={css.panelHeaderTools}>
            <button type="button" className={css.iconBtn} aria-label="Search">
              <Search size={14} strokeWidth={1.5} aria-hidden />
            </button>
            <button type="button" className={css.iconBtn} aria-label="Import">
              <Import size={14} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>

        <div className={css.content} data-node-id="6040:143490" aria-label={`${gameName} assets`}>
          <div className={css.tableWrap} role="table">
            <div className={css.tableHead} role="row">
              <div className={`${css.colHead} ${css.colHeadName}`} role="columnheader">
                Name
              </div>
              <div className={css.colHead} role="columnheader">
                ID
              </div>
              <div className={css.colHead} role="columnheader">
                Type
              </div>
            </div>
            <div className={css.tableHeadDivider} aria-hidden />
            <div className={css.tableBody}>
              {tableRows.map((row) => (
                <div
                  key={row.id}
                  role="row"
                  aria-selected={selectedAssetId === row.id}
                  className={assetRowClass(row.id, hoveredAssetId, selectedAssetId)}
                  onMouseEnter={() => setHoveredAssetId(row.id)}
                  onMouseLeave={() => setHoveredAssetId(null)}
                  onClick={() => setSelectedAssetId(row.id)}
                  onContextMenu={(event) => openRowContextMenu(event, row)}
                >
                  <div className={css.cellName} role="cell">
                    <AssetThumb row={row} />
                    <span className={`${css.cellText} ${css.cellTextEmphasis}`}>{row.name}</span>
                  </div>
                  <span className={css.cellText} role="cell">
                    {row.assetId}
                  </span>
                  <span className={css.cellText} role="cell">
                    {row.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {contextMenu && contextMenuRow
        ? createPortal(
            <div
              id={contextMenuId}
              className={css.contextMenu}
              role="menu"
              aria-label={`${contextMenuRow.name} actions`}
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onContextMenu={(event) => event.preventDefault()}
            >
              <button
                type="button"
                role="menuitem"
                className={css.contextMenuItem}
                onClick={() => contextMenuRow && handleOpenRow(contextMenuRow)}
              >
                Open
              </button>
              {!isPlaceRow(contextMenuRow) ? (
                <button
                  type="button"
                  role="menuitem"
                  className={css.contextMenuItem}
                  onClick={() => setContextMenu(null)}
                >
                  Insert
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
