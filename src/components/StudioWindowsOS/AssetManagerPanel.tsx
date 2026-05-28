import { useMemo, useState } from 'react'
import {
  ArrowDownUp,
  ChevronDown,
  ChevronRight,
  Filter,
  Folder,
  Globe,
  LayoutGrid,
  RefreshCw,
  RotateCcw,
  Search,
  SquareArrowOutUpRight,
} from 'lucide-react'
import { publicAssetUrl } from '../../publicAssetUrl'
import css from './AssetManagerPanel.module.css'

type TreeRow = {
  id: string
  label: string
  bold?: boolean
  depth?: number
  expanded?: boolean
  hasChildren?: boolean
  icon?: 'globe' | 'folder' | 'inventory'
}

type AssetRow = {
  id: string
  name: string
  assetId: string
  type: string
  dateModified: string
  thumb?: 'folder' | 'model' | 'audio'
  thumbUrl?: string
}

const SIDEBAR_TREE: TreeRow[] = [
  { id: 'project', label: 'Project', bold: true, expanded: true, hasChildren: true },
  { id: 'recent', label: 'Recently Imported', depth: 1, icon: 'globe' },
  { id: 'experience', label: 'Experience Name', depth: 1, expanded: true, hasChildren: true },
  { id: 'folder-selected', label: 'Folder Name', depth: 2, icon: 'folder' },
  { id: 'folder-2', label: 'Folder Name', depth: 2, icon: 'folder' },
  { id: 'folder-3', label: 'Folder Name', depth: 2, icon: 'folder' },
  { id: 'folder-4', label: 'Folder Name', depth: 2, icon: 'folder' },
  { id: 'inventories', label: 'Inventories', bold: true, expanded: true, hasChildren: true },
  { id: 'inv-1', label: 'ChrisPushesPixels', depth: 1, icon: 'inventory' },
  { id: 'inv-2', label: 'AlphaStrike', depth: 1, icon: 'inventory' },
  { id: 'inv-3', label: 'NikeDev', depth: 1, icon: 'inventory' },
  { id: 'inv-4', label: 'Nike', depth: 1, icon: 'inventory' },
]

const ASSET_ROWS: AssetRow[] = [
  { id: 'audio', name: 'Audio', assetId: '-', type: 'Folder', dateModified: '12 June 2024', thumb: 'folder' },
  {
    id: 'barrier',
    name: 'Barrier',
    assetId: '49481118822',
    type: 'Model',
    dateModified: '12 June 2024',
    thumb: 'model',
    thumbUrl:
      'https://www.figma.com/api/mcp/asset/856d2cda-f9b9-43ba-a73e-12e7a3ace597',
  },
  {
    id: 'building',
    name: 'Building',
    assetId: '49481118822',
    type: 'Model',
    dateModified: '12 June 2024',
    thumb: 'model',
    thumbUrl:
      'https://www.figma.com/api/mcp/asset/1d422731-a162-42a3-8085-029753bf7166',
  },
  {
    id: 'bird',
    name: 'Bird_Flap',
    assetId: '49481118822',
    type: 'Audio',
    dateModified: '12 June 2024',
    thumb: 'audio',
  },
  {
    id: 'column',
    name: 'Column',
    assetId: '49481118822',
    type: 'Model',
    dateModified: '12 June 2024',
    thumb: 'model',
    thumbUrl:
      'https://www.figma.com/api/mcp/asset/4f59a2fd-e4c2-42e8-ba80-935bfec74813',
  },
  {
    id: 'city',
    name: 'City_Background',
    assetId: '49481118822',
    type: 'Audio',
    dateModified: '12 June 2024',
    thumb: 'audio',
  },
]

function TreeRowIcon({ icon }: { icon?: TreeRow['icon'] }) {
  if (!icon) return null
  const size = 14
  const stroke = 1.5
  if (icon === 'globe') return <Globe size={size} strokeWidth={stroke} aria-hidden />
  if (icon === 'folder') return <Folder size={size} strokeWidth={stroke} aria-hidden />
  return <Folder size={size} strokeWidth={stroke} aria-hidden />
}

function buildTreeParentMap(rows: TreeRow[]): Record<string, string | null> {
  const parent: Record<string, string | null> = {}
  const ancestors: { id: string; depth: number }[] = []

  for (const row of rows) {
    const depth = row.depth ?? 0
    while (ancestors.length > 0 && ancestors[ancestors.length - 1].depth >= depth) {
      ancestors.pop()
    }
    parent[row.id] = ancestors.length > 0 ? ancestors[ancestors.length - 1].id : null
    if (row.hasChildren) {
      ancestors.push({ id: row.id, depth })
    }
  }
  return parent
}

const SIDEBAR_TREE_PARENT = buildTreeParentMap(SIDEBAR_TREE)

function sidebarRowClass(
  rowId: string,
  hoveredId: string | null,
  selectedId: string | null,
  parentMap: Record<string, string | null>,
): string {
  const hovered = hoveredId === rowId
  const selected = selectedId === rowId
  const childOfSelected = selectedId !== null && parentMap[rowId] === selectedId
  if (selected) return `${css.treeRow} ${css.treeRowSelected}`
  if (hovered) return `${css.treeRow} ${css.treeRowHover}`
  if (childOfSelected) return `${css.treeRow} ${css.treeRowChildOfSelected}`
  return css.treeRow
}

function assetRowClass(rowId: string, hoveredId: string | null, selectedId: string | null): string {
  if (selectedId === rowId) return `${css.tableRow} ${css.tableRowSelected}`
  if (hoveredId === rowId) return `${css.tableRow} ${css.tableRowHover}`
  return css.tableRow
}

function AssetThumb({ row }: { row: AssetRow }) {
  if (row.thumbUrl) {
    return (
      <span className={css.thumb}>
        <img src={row.thumbUrl} alt="" />
      </span>
    )
  }
  return (
    <span className={css.thumb}>
      <Folder size={14} strokeWidth={1.5} aria-hidden />
    </span>
  )
}

export type AssetManagerPanelProps = {
  /** When true, panel grows to fill the bottom dock row (no Output beside it). */
  fillDock?: boolean
  titleAlign?: 'left' | 'center'
  hideHeader?: boolean
  onHeaderPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
}

export default function AssetManagerPanel({
  fillDock = false,
  titleAlign = 'center',
  hideHeader = false,
  onHeaderPointerDown,
}: AssetManagerPanelProps) {
  const [selectedSidebarId, setSelectedSidebarId] = useState('folder-selected')
  const [hoveredSidebarId, setHoveredSidebarId] = useState<string | null>(null)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>('barrier')
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null)

  const sidebarParentMap = useMemo(() => SIDEBAR_TREE_PARENT, [])

  return (
    <section
      className={`${css.root} ${fillDock ? css.rootFillDock : ''} ${hideHeader ? css.rootEmbedded : ''}`}
      data-name="[Legacy] Panel"
      data-node-id="3994:57525"
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
          <button type="button" className={css.headerBtn} aria-label="Close panel">
            <img src={publicAssetUrl('assets/panel-close.svg')} alt="" />
          </button>
        </div>
      </header>
      )}

      <div className={css.body} data-node-id="I3994:57525;3:141495">
        <aside className={css.sidebar} aria-label="Asset folders">
          <div className={css.searchRow}>
            <button type="button" className={css.iconBtn} aria-label="Filter sidebar">
              <Filter size={14} strokeWidth={1.5} aria-hidden />
            </button>
            <div className={css.searchField} aria-hidden>
              <Search size={14} strokeWidth={1.5} aria-hidden />
              <span className={css.searchPlaceholder}>Search</span>
            </div>
          </div>

          <nav className={css.tree} aria-label="Project tree">
            {SIDEBAR_TREE.map((row) => {
              const depth = row.depth ?? 0
              return (
                <div
                  key={row.id}
                  role="treeitem"
                  aria-selected={selectedSidebarId === row.id}
                  className={`${sidebarRowClass(row.id, hoveredSidebarId, selectedSidebarId, sidebarParentMap)} ${
                    row.bold ? css.treeRowBold : ''
                  }`}
                  onMouseEnter={() => setHoveredSidebarId(row.id)}
                  onMouseLeave={() => setHoveredSidebarId(null)}
                  onClick={() => setSelectedSidebarId(row.id)}
                >
                  <div className={css.treeRowInner}>
                    {depth > 0 ? (
                      <span className={css.treeIndent} aria-hidden />
                    ) : null}
                    {row.hasChildren ? (
                      <span className={css.treeToggle} aria-hidden>
                        {row.expanded ? (
                          <ChevronDown size={10} strokeWidth={2} />
                        ) : (
                          <ChevronRight size={10} strokeWidth={2} />
                        )}
                      </span>
                    ) : (
                      <span className={css.treeToggleSpacer} aria-hidden />
                    )}
                    {row.icon ? (
                      <span className={css.treeIcon}>
                        <TreeRowIcon icon={row.icon} />
                      </span>
                    ) : null}
                    <span className={css.treeLabel}>{row.label}</span>
                  </div>
                </div>
              )
            })}
          </nav>
        </aside>

        <div className={css.dividerV} aria-hidden />

        <div className={css.main}>
          <div className={css.toolbar} data-node-id="I3994:57525;3:141496;259:22519">
            <div className={css.toolbarNav}>
              <div className={css.toolbarIconGroup}>
                <button type="button" className={css.iconBtn} aria-label="Back">
                  <RotateCcw size={14} strokeWidth={1.5} aria-hidden />
                </button>
                <button type="button" className={css.iconBtn} aria-label="Forward">
                  <RotateCcw
                    size={14}
                    strokeWidth={1.5}
                    style={{ transform: 'scaleX(-1)' }}
                    aria-hidden
                  />
                </button>
              </div>
              <div className={css.toolbarBreadcrumb}>
                <Folder size={16} strokeWidth={1.5} aria-hidden />
                <span className={css.breadcrumbLabel}>Folder Name</span>
              </div>
            </div>
            <div className={css.toolbarTools}>
              <div className={css.toolbarIconGroup}>
                <button type="button" className={css.iconBtn} aria-label="Refresh">
                  <RefreshCw size={14} strokeWidth={1.5} aria-hidden />
                </button>
                <button type="button" className={css.iconBtn} aria-label="Sort">
                  <ArrowDownUp size={14} strokeWidth={1.5} aria-hidden />
                </button>
                <button type="button" className={css.iconBtn} aria-label="Filter">
                  <Filter size={14} strokeWidth={1.5} aria-hidden />
                </button>
                <button type="button" className={css.iconBtn} aria-label="View mode">
                  <LayoutGrid size={14} strokeWidth={1.5} aria-hidden />
                </button>
              </div>
              <div className={css.toolbarDivider} aria-hidden />
              <button type="button" className={css.importBtn}>
                Import
              </button>
            </div>
          </div>

          <div className={css.tableWrap} role="table" aria-label="Assets">
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
              <div className={css.colHead} role="columnheader">
                Date Modified
              </div>
            </div>
            <div className={css.tableHeadDivider} aria-hidden />
            <div className={css.tableBody}>
              {ASSET_ROWS.map((row) => (
                <div
                  key={row.id}
                  role="row"
                  aria-selected={selectedAssetId === row.id}
                  className={assetRowClass(row.id, hoveredAssetId, selectedAssetId)}
                  onMouseEnter={() => setHoveredAssetId(row.id)}
                  onMouseLeave={() => setHoveredAssetId(null)}
                  onClick={() => setSelectedAssetId(row.id)}
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
                  <span className={css.cellText} role="cell">
                    {row.dateModified}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
