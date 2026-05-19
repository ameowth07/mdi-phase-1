import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ComponentProps, Ref } from 'react'
import { CircleHelp, Monitor, Server, SquareArrowOutUpRight } from 'lucide-react'
import ClientSim from './ClientSim'
import LegacyRibbon from './LegacyRibbon'
import ServerSim from './ServerSim'
import AssetManagerPanel from './AssetManagerPanel'
import InteractionSettingsPanel from './InteractionSettingsPanel'
import PropertiesPanel from './PropertiesPanel'
import { publicAssetUrl } from '../../publicAssetUrl'
import {
  closeTabFocusLeft,
  EDIT_ISOLATION_TAB_ORDER,
  isMainScriptTabOpen,
  MAIN_SCRIPT_TAB_ORDER,
  type EditIsolationTabId,
  type MainScriptTabId,
} from './documentTabClose'
import {
  PROTOTYPE_SETTINGS_DEFAULTS,
  type EditDocumentFocus,
  type MainDocumentEditorTab,
  type SimViewportFocus,
} from './prototypeDefaults'
import styles from './StudioWindowsOS.module.css'

export type { EditDocumentFocus, MainDocumentEditorTab, SimViewportFocus }

const MENUS = ['File', 'Edit', 'View', 'Plugins', 'Test', 'Window', 'Help'] as const

/** Footer “Questions” overlay — add strings here to populate the list. */
const FOOTER_QUESTIONS: readonly string[] = []

/** Drone isolation document tab label — Explorer badge uses the same text when that column is focused. */
const DRONE_WORKSPACE_TAB_LABEL = 'Drone' as const

/** Single Explorer row when the Drone isolation document is focused. */
const DRONE_ISOLATION_EXPLORER_ROW_ID = 'drone-isolation-root' as const

const HOVER_SCRIPT_TAB_LABEL = 'HoverScript' as const

/** Tab hover — file path line (Figma Tooltip 3975:51893 / 3975:51736). */
const TAB_PATH_DRONE_RACER_DOCUMENT = 'Drone Racer/Drone Racer'
const TAB_PATH_BUNNY_DOCUMENT = 'Bunny/Bunny'
const TAB_PATH_DRONE_RACER_SCRIPT = 'Drone Racer/Script'
const TAB_PATH_DRONE_RACER_CLIENT_SCRIPT = 'Drone Racer (Client)/Script'
const TAB_PATH_DRONE_RACER_SERVER_SCRIPT = 'Drone Racer (Server)/Script'
const TAB_PATH_DRONE_RACER_CLIENT = 'Drone Racer (Client)'
const TAB_PATH_DRONE_RACER_SERVER = 'Drone Racer (Server)'
const TAB_PATH_DRONE_ASSET = 'Drone/Drone'
const TAB_PATH_DRONE_HOVERSCRIPT = 'Drone/HoverScript'

/** Main Drone Racer document — first “Script” tab body. */
const DRONE_RACER_MAIN_SCRIPT_PLACEHOLDER = 'this is a Drone Racer script' as const
const CLIENT_SCRIPT_PLACEHOLDER = 'this is a Client script' as const
const SERVER_SCRIPT_PLACEHOLDER = 'this is a Server script' as const

/** Asset isolation preview — selected art includes the white ring around the drone. */
const ASSET_ISOLATION_IMAGE = publicAssetUrl('assets/asset-isolation.jpg')
const ASSET_ISOLATION_IMAGE_FOCUSED = publicAssetUrl('assets/asset-isolation-selected.jpg')

/** Explorer edit tree — direct parent id per row (for “child of selected” tint). */
const EXPLORER_EDIT_PARENT: Record<string, string | null> = {
  workspace: null,
  camera: 'workspace',
  terrain: 'workspace',
  billboard: 'workspace',
  shop: 'workspace',
  shopkeeper: 'shop',
  counter: 'shop',
  shelves: 'shop',
  register: 'shop',
  door: 'shop',
  players: 'workspace',
  lighting: 'workspace',
  materialservice: 'workspace',
  /** Flat Bunny Explorer — single row id (not in datamodel tree). */
  bunnyExplorerRow: null,
}

/** Sim Explorer tree rows — no parent/child tint relationships in this mock. */
const EXPLORER_SIM_PARENT: Record<string, string | null> = {
  workspace: null,
  players: null,
  lighting: null,
  materialservice: null,
}

function isScriptDocumentTab(tab: MainDocumentEditorTab): boolean {
  return tab !== 'droneRacer'
}

/** Snapshot for Explorer while a Script tab is open — sim side, edit hierarchy, or Drone isolation tree. */
type ExplorerRetentionKind = 'sim-client' | 'sim-server' | 'edit-drone' | 'drone-isolation'

type ExplorerSelectionTintFocus = 'client' | 'server' | 'drone'

function resolveExplorerSelectionTintFocus(
  selectionTintActive: boolean,
  clientSim: boolean,
  simViewportFocus: SimViewportFocus,
  explorerWhileScriptFocus: ExplorerRetentionKind | null,
  droneDocumentFocused: boolean,
): ExplorerSelectionTintFocus | null {
  if (!selectionTintActive) return null

  if (droneDocumentFocused) return 'drone'
  if (
    explorerWhileScriptFocus === 'drone-isolation' ||
    explorerWhileScriptFocus === 'edit-drone'
  ) {
    return 'drone'
  }

  if (explorerWhileScriptFocus === 'sim-server') return 'server'
  if (explorerWhileScriptFocus === 'sim-client') return 'client'

  if (clientSim) return simViewportFocus

  return null
}

/** Clip-path (even-odd) covering `frame` with a rectangular hole for `hole` (percent of frame). */
function simTintClipPath(frame: DOMRect, hole: DOMRect): string | undefined {
  const fw = frame.width
  const fh = frame.height
  if (fw <= 0 || fh <= 0) return undefined
  let L = ((hole.left - frame.left) / fw) * 100
  let T = ((hole.top - frame.top) / fh) * 100
  let R = ((hole.right - frame.left) / fw) * 100
  let B = ((hole.bottom - frame.top) / fh) * 100
  L = Math.max(0, Math.min(100, L))
  T = Math.max(0, Math.min(100, T))
  R = Math.max(0, Math.min(100, R))
  B = Math.max(0, Math.min(100, B))
  if (R <= L + 0.02 || B <= T + 0.02) return undefined
  return `polygon(evenodd,0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${L}% ${T}%,${L}% ${B}%,${R}% ${B}%,${R}% ${T}%,${L}% ${T}%)`
}

function TabDiamond({ className }: { className?: string } = {}) {
  return (
    <svg
      className={className ?? styles.tabDiamond}
      viewBox="0 0 12 12"
      aria-hidden
    >
      <path
        d="M6 1.2 10.8 6 6 10.8 1.2 6Z"
        fill="currentColor"
        opacity={0.9}
      />
    </svg>
  )
}

/** Client sim — Drone Racer tab: same Lucide pattern as Server tab (`Server`), client brand hue. */
function TabCloseButton({ onClose }: { onClose: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      className={styles.tabClose}
      aria-label="Close tab"
      onPointerDown={(e) => {
        e.stopPropagation()
        onClose(e)
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClose(e)
      }}
    >
      <img src={publicAssetUrl('assets/tab-close.svg')} alt="" />
    </button>
  )
}

/** Client sim — Drone Racer tab: same Lucide pattern as Server tab (`Server`), client brand hue. */
function TabClientSimDocumentIcon() {
  return (
    <Monitor
      size={12}
      strokeWidth={1.5}
      className={`${styles.tabDiamond} ${styles.tabDiamondBrand}`}
      color="#2563eb"
      aria-hidden
    />
  )
}

/** Explorer disclosure — same stroke chevron as ribbon split (LegacyRibbon / RibbonToolbar), not Unicode triangles. */
function TreeChevron({ mode }: { mode: 'open' | 'closed' | 'spacer' }) {
  return (
    <span
      className={
        mode === 'closed'
          ? `${styles.treeChevron} ${styles.treeChevronClosed}`
          : styles.treeChevron
      }
      aria-hidden
    >
      {mode !== 'spacer' && (
        <svg
          className={styles.treeChevronSvg}
          width={10}
          height={10}
          viewBox="0 0 10 10"
        >
          <path
            d="M2 3L5 6.2L8 3"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}

/** Tab path tooltip: first hover delay vs quick chain to another tab (ms). */
const TAB_PATH_TOOLTIP_FIRST_DELAY_MS = 300
const TAB_PATH_TOOLTIP_CHAIN_WINDOW_MS = 1000

let tabPathTooltipLastOpenedAt = 0
let tabPathTooltipLastOpenedInstanceId: string | null = null

/** Figma Studio App Framework — Tooltip (3975:51736): inverse surface, Body small; shown below tab. */
function TabWithPathTooltip({
  path,
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: ComponentProps<'div'> & { path: string }) {
  const instanceId = useId()
  const [tipOpen, setTipOpen] = useState(false)
  const hoveringRef = useRef(false)
  const openTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current != null) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearOpenTimer(), [clearOpenTimer])

  const scheduleOpen = useCallback(() => {
    clearOpenTimer()
    const now = Date.now()
    const chainInWindow =
      tabPathTooltipLastOpenedAt > 0 &&
      now - tabPathTooltipLastOpenedAt < TAB_PATH_TOOLTIP_CHAIN_WINDOW_MS
    const chainDifferentTab =
      chainInWindow &&
      tabPathTooltipLastOpenedInstanceId !== null &&
      tabPathTooltipLastOpenedInstanceId !== instanceId
    const delay = chainDifferentTab ? 0 : TAB_PATH_TOOLTIP_FIRST_DELAY_MS

    openTimerRef.current = globalThis.setTimeout(() => {
      openTimerRef.current = null
      if (!hoveringRef.current) return
      setTipOpen(true)
      tabPathTooltipLastOpenedAt = Date.now()
      tabPathTooltipLastOpenedInstanceId = instanceId
    }, delay)
  }, [instanceId, clearOpenTimer])

  return (
    <div
      {...rest}
      className={`${className ?? ''} ${styles.tabWithPathTooltip}`}
      onMouseEnter={(e) => {
        onMouseEnter?.(e)
        hoveringRef.current = true
        scheduleOpen()
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e)
        hoveringRef.current = false
        clearOpenTimer()
        setTipOpen(false)
      }}
    >
      {children}
      {tipOpen ? (
        <span className={styles.tabPathTooltip} role="tooltip" data-node-id="3975:51738">
          {path}
        </span>
      ) : null}
    </div>
  )
}

type PanelChromeProps = {
  title: string
  assetVariant: 'explorer' | 'properties'
  /** Plain title or Explorer badge row: centered (default) vs left-aligned with panel padding. */
  titleAlign?: 'center' | 'left'
  /** Play mode: StatusBadge-style pill next to “Explorer” (Interaction settings). */
  explorerFocusBadgeTarget?: SimViewportFocus | null
  /** Edit mode: document column in focus (e.g. Drone isolation) — same pill chrome as Client/Server. */
  explorerDocumentBadgeLabel?: string | null
  /** Explorer badge: show colored status dot (Interaction settings). */
  explorerBadgeShowDot?: boolean
}

function ExplorerDocumentBadge({
  label,
  showIndicator,
}: {
  label: string
  showIndicator: boolean
}) {
  return (
    <span
      className={styles.explorerFocusBadge}
      data-name="ExplorerDocumentBadge"
      data-node-id="3856:139987-edit-doc"
    >
      <span className={styles.explorerFocusBadgePlate} aria-hidden />
      <span className={styles.explorerFocusBadgeRow}>
        {showIndicator ? (
          <span
            className={`${styles.explorerFocusBadgeDot} ${styles.explorerFocusBadgeDotDrone}`}
            aria-hidden
          />
        ) : null}
        <span className={styles.explorerFocusBadgeCaption}>{label}</span>
      </span>
    </span>
  )
}

function ExplorerFocusBadge({
  target,
  showIndicator,
}: {
  target: SimViewportFocus
  showIndicator: boolean
}) {
  const label = target === 'client' ? 'Client' : 'Server'
  return (
    <span
      className={styles.explorerFocusBadge}
      data-name="ExplorerFocusBadge"
      data-node-id="3856:139987"
    >
      <span className={styles.explorerFocusBadgePlate} aria-hidden />
      <span className={styles.explorerFocusBadgeRow}>
        {showIndicator ? (
          <span
            className={`${styles.explorerFocusBadgeDot} ${
              target === 'client'
                ? styles.explorerFocusBadgeDotClient
                : styles.explorerFocusBadgeDotServer
            }`}
            aria-hidden
          />
        ) : null}
        <span className={styles.explorerFocusBadgeCaption}>{label}</span>
      </span>
    </span>
  )
}

function PanelChrome({
  title,
  assetVariant,
  titleAlign = 'center',
  explorerFocusBadgeTarget = null,
  explorerDocumentBadgeLabel = null,
  explorerBadgeShowDot = true,
}: PanelChromeProps) {
  const close =
    assetVariant === 'explorer'
      ? publicAssetUrl('assets/panel-close.svg')
      : publicAssetUrl('assets/panel-close-x-2.svg')

  const showSimExplorerBadge =
    assetVariant === 'explorer' && explorerFocusBadgeTarget != null
  const showEditExplorerBadge =
    assetVariant === 'explorer' &&
    !!explorerDocumentBadgeLabel &&
    !showSimExplorerBadge

  const showExplorerBadge = showSimExplorerBadge || showEditExplorerBadge

  const explorerAria = showSimExplorerBadge
    ? `Explorer, ${
        explorerFocusBadgeTarget === 'client' ? 'Client' : 'Server'
      } focused`
    : showEditExplorerBadge
      ? `Explorer, ${explorerDocumentBadgeLabel} focused`
      : undefined

  const titleAlignClass =
    titleAlign === 'left' ? styles.panelTitleAlignLeft : styles.panelTitleAlignCenter
  const badgeAlignClass =
    titleAlign === 'left'
      ? styles.panelTitleWithBadgeAlignLeft
      : styles.panelTitleWithBadgeAlignCenter

  return (
    <header className={styles.panelHeader}>
      {showExplorerBadge ? (
        <div
          className={`${styles.panelTitleWithBadge} ${badgeAlignClass}`}
          role="group"
          aria-label={explorerAria}
        >
          <p className={styles.panelTitlePlain}>{title}</p>
          {showSimExplorerBadge ? (
            <ExplorerFocusBadge
              target={explorerFocusBadgeTarget!}
              showIndicator={explorerBadgeShowDot}
            />
          ) : (
            <ExplorerDocumentBadge
              label={explorerDocumentBadgeLabel!}
              showIndicator={explorerBadgeShowDot}
            />
          )}
        </div>
      ) : (
        <p className={`${styles.panelTitle} ${titleAlignClass}`}>{title}</p>
      )}
      <div className={styles.panelActions}>
        <button type="button" className={styles.panelAction} aria-label="Pop out panel">
          <SquareArrowOutUpRight
            size={12}
            strokeWidth={1.35}
            className={styles.panelPopoutIcon}
            aria-hidden
          />
        </button>
        <button type="button" className={styles.panelAction} aria-label="Close panel">
          <img src={close} alt="" />
        </button>
      </div>
    </header>
  )
}

function ExplorerTree({
  clientSim,
  bunnyFlatExplorer,
  explorerWhileScriptFocus,
  droneDocumentFocused,
  selectionTintActive,
  simViewportFocus,
  simSelectedRowId,
  onSimExplorerSelectRow,
}: {
  clientSim: boolean
  /** Bunny asset frame — Explorer is a single “Bunny” row (no datamodel hierarchy). */
  bunnyFlatExplorer?: boolean
  /**
   * Test + Script tab: which Explorer to mirror — last sim Client/Server, edit hierarchy, or Drone isolation.
   * `null` when not in that mode.
   */
  explorerWhileScriptFocus: ExplorerRetentionKind | null
  /** Drone isolation document focused — minimal Explorer (edit or test with asset in isolation). */
  droneDocumentFocused: boolean
  /** Testing UI: Selection tint — Explorer row hues follow client / server / drone focus. */
  selectionTintActive: boolean
  simViewportFocus: SimViewportFocus
  /** Sim: selected Explorer row for the current sim focus (client vs server); null until user picks. */
  simSelectedRowId: string | null
  onSimExplorerSelectRow: (rowId: string) => void
}) {
  const explorerTintFocus = useMemo(
    () =>
      resolveExplorerSelectionTintFocus(
        selectionTintActive,
        clientSim,
        simViewportFocus,
        explorerWhileScriptFocus,
        droneDocumentFocused,
      ),
    [
      selectionTintActive,
      clientSim,
      simViewportFocus,
      explorerWhileScriptFocus,
      droneDocumentFocused,
    ],
  )

  const explorerTreeProps = explorerTintFocus
    ? ({ 'data-explorer-tint': explorerTintFocus } as const)
    : undefined

  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [selectedEditRowId, setSelectedEditRowId] = useState<string | null>(null)
  const [hoveredSimRowClient, setHoveredSimRowClient] = useState<string | null>(null)
  const [hoveredSimRowServer, setHoveredSimRowServer] = useState<string | null>(null)

  const simHoveredRowId =
    simViewportFocus === 'client' ? hoveredSimRowClient : hoveredSimRowServer

  const setSimHoveredRow = (rowId: string | null) => {
    if (simViewportFocus === 'client') setHoveredSimRowClient(rowId)
    else setHoveredSimRowServer(rowId)
  }

  const editRowClass = (rowId: string) => {
    const hovered = hoveredRowId === rowId
    const selected = selectedEditRowId !== null && selectedEditRowId === rowId
    const childOfSelected =
      selectedEditRowId !== null && EXPLORER_EDIT_PARENT[rowId] === selectedEditRowId
    if (selected) {
      return [styles.treeRow, styles.treeRowInteractive, styles.selected].filter(Boolean).join(' ')
    }
    if (hovered) {
      return [styles.treeRow, styles.treeRowInteractive, styles.treeRowHover].filter(Boolean).join(' ')
    }
    if (childOfSelected) {
      return [styles.treeRow, styles.treeRowInteractive, styles.treeRowChildOfSelected]
        .filter(Boolean)
        .join(' ')
    }
    return [styles.treeRow, styles.treeRowInteractive].join(' ')
  }

  const buildSimRowClass = (parentMap: Record<string, string | null>) => (rowId: string) => {
    const hovered = simHoveredRowId === rowId
    const selected = simSelectedRowId !== null && simSelectedRowId === rowId
    const childOfSelected =
      simSelectedRowId !== null && parentMap[rowId] === simSelectedRowId
    if (selected) {
      return [styles.treeRow, styles.treeRowInteractive, styles.selected].filter(Boolean).join(' ')
    }
    if (hovered) {
      return [styles.treeRow, styles.treeRowInteractive, styles.treeRowHover].filter(Boolean).join(' ')
    }
    if (childOfSelected) {
      return [styles.treeRow, styles.treeRowInteractive, styles.treeRowChildOfSelected]
        .filter(Boolean)
        .join(' ')
    }
    return [styles.treeRow, styles.treeRowInteractive].join(' ')
  }

  const flatSimRowClass = buildSimRowClass(EXPLORER_SIM_PARENT)
  const hierarchySimRowClass = buildSimRowClass(EXPLORER_EDIT_PARENT)

  const bindFlatSimRow = (rowId: string) => ({
    className: flatSimRowClass(rowId),
    onMouseEnter: () => setSimHoveredRow(rowId),
    onMouseLeave: () => setSimHoveredRow(null),
    onClick: () => onSimExplorerSelectRow(rowId),
  })

  const bindEditExplorerRow = (rowId: string) => ({
    className: editRowClass(rowId),
    onMouseEnter: () => setHoveredRowId(rowId),
    onMouseLeave: () => setHoveredRowId(null),
    onClick: () => setSelectedEditRowId(rowId),
  })

  /** Play-mode full hierarchy — per-viewport selection + child-of-selected. */
  const bindPlayHierarchyRow = (rowId: string) => ({
    className: hierarchySimRowClass(rowId),
    onMouseEnter: () => setSimHoveredRow(rowId),
    onMouseLeave: () => setSimHoveredRow(null),
    onClick: () => onSimExplorerSelectRow(rowId),
  })

  const bindMainExplorerRow = (rowId: string) =>
    clientSim ? bindPlayHierarchyRow(rowId) : bindEditExplorerRow(rowId)

  const showDroneIsolationExplorer =
    droneDocumentFocused || explorerWhileScriptFocus === 'drone-isolation'

  useEffect(() => {
    if (showDroneIsolationExplorer) {
      setSelectedEditRowId(DRONE_ISOLATION_EXPLORER_ROW_ID)
      setHoveredRowId(null)
    }
  }, [showDroneIsolationExplorer])

  useEffect(() => {
    if (
      clientSim &&
      explorerWhileScriptFocus === 'edit-drone' &&
      simSelectedRowId === null
    ) {
      onSimExplorerSelectRow('workspace')
    }
  }, [clientSim, explorerWhileScriptFocus, simSelectedRowId, onSimExplorerSelectRow])

  if (bunnyFlatExplorer) {
    const rowId = 'bunnyExplorerRow' as const
    return (
      <div className={styles.tree} {...explorerTreeProps}>
        <div
          className={editRowClass(rowId)}
          onMouseEnter={() => setHoveredRowId(rowId)}
          onMouseLeave={() => setHoveredRowId(null)}
          onClick={() => setSelectedEditRowId(rowId)}
        >
          <TreeChevron mode="spacer" />
          <TabDiamond />
          <span className={styles.treeLabel}>Bunny</span>
        </div>
      </div>
    )
  }

  if (showDroneIsolationExplorer) {
    return (
      <div className={styles.tree} {...explorerTreeProps}>
        <div
          className={editRowClass(DRONE_ISOLATION_EXPLORER_ROW_ID)}
          onMouseEnter={() => setHoveredRowId(DRONE_ISOLATION_EXPLORER_ROW_ID)}
          onMouseLeave={() => setHoveredRowId(null)}
          onClick={() => setSelectedEditRowId(DRONE_ISOLATION_EXPLORER_ROW_ID)}
        >
          <TreeChevron mode="closed" />
          <img
            src={publicAssetUrl('assets/Model.png')}
            alt=""
            className={`${styles.treeExplorerModelIcon} ${styles.bitmapIconCrisp}`}
            aria-hidden
          />
          <span className={styles.treeLabel}>{DRONE_WORKSPACE_TAB_LABEL}</span>
        </div>
      </div>
    )
  }

  if (clientSim && explorerWhileScriptFocus === 'edit-drone') {
    return (
      <div className={styles.tree} {...explorerTreeProps}>
        <div {...bindFlatSimRow('workspace')}>
          <TreeChevron mode="closed" />
          <span className={styles.treeIcon} style={{ color: '#4a9eff' }}>
            ●
          </span>
          <span className={styles.treeLabel}>Workspace</span>
        </div>
        <div {...bindFlatSimRow('players')}>
          <TreeChevron mode="spacer" />
          <span className={styles.treeIcon} style={{ color: '#e8944a' }}>
            ☺
          </span>
          <span className={styles.treeLabel}>Players</span>
        </div>
        <div {...bindFlatSimRow('lighting')}>
          <TreeChevron mode="closed" />
          <span className={styles.treeIcon}>💡</span>
          <span className={styles.treeLabel}>Lighting</span>
        </div>
        <div {...bindFlatSimRow('materialservice')}>
          <TreeChevron mode="closed" />
          <span className={styles.treeIcon}>⌗</span>
          <span className={styles.treeLabel}>MaterialService</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tree} {...explorerTreeProps}>
      <div {...bindMainExplorerRow('workspace')}>
        <TreeChevron mode="open" />
        <span className={styles.treeIcon} style={{ color: '#4a9eff' }}>
          ●
        </span>
        <span className={styles.treeLabel}>Workspace</span>
      </div>
      <div {...bindMainExplorerRow('camera')} style={{ paddingLeft: 22 }}>
        <TreeChevron mode="spacer" />
        <span className={styles.treeIcon}>▣</span>
        <span className={styles.treeLabel}>Camera</span>
      </div>
      <div {...bindMainExplorerRow('terrain')} style={{ paddingLeft: 22 }}>
        <TreeChevron mode="spacer" />
        <span className={styles.treeIcon} style={{ color: '#6b4' }}>
          ▲
        </span>
        <span className={styles.treeLabel}>Terrain</span>
      </div>
      <div {...bindMainExplorerRow('billboard')} style={{ paddingLeft: 22 }}>
        <TreeChevron mode="closed" />
        <span className={styles.treeIcon} style={{ color: '#e8d44d' }}>
          ■
        </span>
        <span className={styles.treeLabel}>Billboard</span>
      </div>
      <div className={`${styles.treeNested} ${styles.guide}`}>
        <div {...bindMainExplorerRow('shop')}>
          <TreeChevron mode="open" />
          <span className={styles.treeIcon} style={{ color: '#e8d44d' }}>
            ■
          </span>
          <span className={styles.treeLabel}>Shop</span>
        </div>
        <div
          {...bindMainExplorerRow('shopkeeper')}
          style={{ paddingLeft: 20 }}
        >
          <TreeChevron mode="closed" />
          <span className={styles.treeIcon}>◇</span>
          <span className={styles.treeLabel}>Shopkeeper</span>
        </div>
        <div
          {...bindMainExplorerRow('counter')}
          style={{ paddingLeft: 20 }}
        >
          <TreeChevron mode="closed" />
          <span className={styles.treeIcon}>◇</span>
          <span className={styles.treeLabel}>Counter</span>
        </div>
        <div
          {...bindMainExplorerRow('shelves')}
          style={{ paddingLeft: 20 }}
        >
          <TreeChevron mode="closed" />
          <span className={styles.treeIcon}>◇</span>
          <span className={styles.treeLabel}>Shelves</span>
        </div>
        <div
          {...bindMainExplorerRow('register')}
          style={{ paddingLeft: 20 }}
        >
          <TreeChevron mode="closed" />
          <span className={styles.treeIcon}>◇</span>
          <span className={styles.treeLabel}>Register</span>
        </div>
        <div
          {...bindMainExplorerRow('door')}
          style={{ paddingLeft: 20 }}
        >
          <TreeChevron mode="closed" />
          <span className={styles.treeIcon}>◇</span>
          <span className={styles.treeLabel}>Door</span>
        </div>
      </div>
      <div {...bindMainExplorerRow('players')} style={{ paddingLeft: 22 }}>
        <TreeChevron mode="spacer" />
        <span className={styles.treeIcon} style={{ color: '#e8944a' }}>
          ☺
        </span>
        <span className={styles.treeLabel}>Players</span>
      </div>
      <div {...bindMainExplorerRow('lighting')} style={{ paddingLeft: 22 }}>
        <TreeChevron mode="closed" />
        <span className={styles.treeIcon}>💡</span>
        <span className={styles.treeLabel}>Lighting</span>
      </div>
      <div {...bindMainExplorerRow('materialservice')} style={{ paddingLeft: 22 }}>
        <TreeChevron mode="closed" />
        <span className={styles.treeIcon}>⌗</span>
        <span className={styles.treeLabel}>MaterialService</span>
      </div>
    </div>
  )
}

export type DroneRacerWorkspaceProps = {
  clientSim?: boolean
  /** Asset window opened from Interaction settings — Bunny viewport, no isolation column or Script tabs. */
  bunnyAssetWindow?: boolean
  /** Edit mode: second column with isolated-asset preview (Interaction settings). */
  showAssetInIsolation?: boolean
  /** Edit datamodel UI: inset stroke on the focused document workspace. */
  editDatamodelShowStroke?: boolean
  /** Which edit document column is focused (Drone isolation vs main). */
  editDocumentFocus: EditDocumentFocus
  onEditDocumentFocusChange: (focus: EditDocumentFocus) => void
  /** Main strip: Drone Racer 3D vs Script tabs (edit and test). */
  mainDocumentEditorTab: MainDocumentEditorTab
  onMainDocumentEditorTabChange: (tab: MainDocumentEditorTab) => void
  /** Split view: independent document tabs per Client / Server column. */
  splitClientDocumentTab?: MainDocumentEditorTab
  splitServerDocumentTab?: MainDocumentEditorTab
  onSplitClientDocumentTabChange?: (tab: MainDocumentEditorTab) => void
  onSplitServerDocumentTabChange?: (tab: MainDocumentEditorTab) => void
  scriptATabOpen?: boolean
  scriptBTabOpen?: boolean
  clientScriptTabOpen?: boolean
  serverScriptTabOpen?: boolean
  isolationTabOpen?: boolean
  hoverScriptTabOpen?: boolean
  onScriptATabOpenChange?: (open: boolean) => void
  onScriptBTabOpenChange?: (open: boolean) => void
  onClientScriptTabOpenChange?: (open: boolean) => void
  onServerScriptTabOpenChange?: (open: boolean) => void
  onIsolationTabOpenChange?: (open: boolean) => void
  onHoverScriptTabOpenChange?: (open: boolean) => void
  /** Test (play) mode: Client vs Server tab — datamodel stroke and tint follow this. */
  simViewportFocus?: SimViewportFocus
  onSimViewportFocusChange?: (focus: SimViewportFocus) => void
  /** Test mode: Interaction “Has semantic stroke” (brand inset when focus stroke is off). */
  playModeHasStroke?: boolean
  /** Test mode: white inset focus ring (Testing UI: Has focus stroke). */
  playModeHasFocusStroke?: boolean
  playModeSelectionTint?: boolean
  playModeFullTint?: boolean
  /** Test mode: `clientSimActive && playModeFullTint` — hole punch for full-frame tint. */
  tintActive?: boolean
  focusHoleRef?: Ref<HTMLDivElement | null>
  /** Test mode: Client and Server side by side (Testing UI: Split view). */
  playModeSplitView?: boolean
}

function DroneRacerWorkspace({
  clientSim,
  bunnyAssetWindow,
  showAssetInIsolation,
  editDatamodelShowStroke,
  editDocumentFocus,
  onEditDocumentFocusChange,
  mainDocumentEditorTab,
  onMainDocumentEditorTabChange,
  splitClientDocumentTab,
  splitServerDocumentTab,
  onSplitClientDocumentTabChange,
  onSplitServerDocumentTabChange,
  scriptATabOpen = true,
  scriptBTabOpen = true,
  clientScriptTabOpen = false,
  serverScriptTabOpen = false,
  isolationTabOpen = true,
  hoverScriptTabOpen = true,
  onScriptATabOpenChange,
  onScriptBTabOpenChange,
  onClientScriptTabOpenChange,
  onServerScriptTabOpenChange,
  onIsolationTabOpenChange,
  onHoverScriptTabOpenChange,
  simViewportFocus,
  onSimViewportFocusChange,
  playModeHasStroke,
  playModeHasFocusStroke,
  playModeSelectionTint,
  playModeFullTint,
  tintActive,
  focusHoleRef,
  playModeSplitView,
}: DroneRacerWorkspaceProps) {
  const [bunnyEditViewportFocused, setBunnyEditViewportFocused] = useState(false)

  useEffect(() => {
    if (clientSim) setBunnyEditViewportFocused(false)
  }, [clientSim])

  const simFocus = simViewportFocus ?? 'client'

  const usePerColumnDocumentTabs =
    !!clientSim &&
    !!playModeSplitView &&
    splitClientDocumentTab != null &&
    splitServerDocumentTab != null &&
    onSplitClientDocumentTabChange != null &&
    onSplitServerDocumentTabChange != null

  const clientDocumentTab = usePerColumnDocumentTabs
    ? splitClientDocumentTab!
    : mainDocumentEditorTab
  const serverDocumentTab = usePerColumnDocumentTabs
    ? splitServerDocumentTab!
    : mainDocumentEditorTab

  const mainDocumentScriptOpen = isScriptDocumentTab(mainDocumentEditorTab)
  const clientDocumentScriptOpen = isScriptDocumentTab(clientDocumentTab)
  const serverDocumentScriptOpen = isScriptDocumentTab(serverDocumentTab)

  const scriptTabsOpen = useMemo(
    () => ({
      scriptA: scriptATabOpen,
      scriptB: scriptBTabOpen,
      clientScript: clientScriptTabOpen && !!clientSim,
      serverScript: serverScriptTabOpen && !!clientSim,
    }),
    [scriptATabOpen, scriptBTabOpen, clientScriptTabOpen, serverScriptTabOpen, clientSim],
  )

  const setScriptTabOpen = useCallback(
    (tab: MainScriptTabId, open: boolean) => {
      if (tab === 'scriptA') onScriptATabOpenChange?.(open)
      else if (tab === 'scriptB') onScriptBTabOpenChange?.(open)
      else if (tab === 'clientScript') onClientScriptTabOpenChange?.(open)
      else if (tab === 'serverScript') onServerScriptTabOpenChange?.(open)
    },
    [
      onScriptATabOpenChange,
      onScriptBTabOpenChange,
      onClientScriptTabOpenChange,
      onServerScriptTabOpenChange,
    ],
  )

  const closeMainDocumentScriptTab = useCallback(
    (tab: MainScriptTabId) => {
      closeTabFocusLeft(
        MAIN_SCRIPT_TAB_ORDER,
        (t) => isMainScriptTabOpen(t, scriptTabsOpen),
        tab,
        mainDocumentEditorTab,
        onMainDocumentEditorTabChange,
        (t, open) => setScriptTabOpen(t, open),
        'droneRacer',
      )
    },
    [mainDocumentEditorTab, onMainDocumentEditorTabChange, scriptTabsOpen, setScriptTabOpen],
  )

  const closeSplitClientScriptTab = useCallback(
    (tab: MainScriptTabId) => {
      if (!onSplitClientDocumentTabChange) return
      closeTabFocusLeft(
        MAIN_SCRIPT_TAB_ORDER,
        (t) => isMainScriptTabOpen(t, scriptTabsOpen),
        tab,
        clientDocumentTab,
        onSplitClientDocumentTabChange,
        (t, open) => setScriptTabOpen(t, open),
        'droneRacer',
      )
    },
    [clientDocumentTab, onSplitClientDocumentTabChange, scriptTabsOpen, setScriptTabOpen],
  )

  const closeSplitServerScriptTab = useCallback(
    (tab: MainScriptTabId) => {
      if (!onSplitServerDocumentTabChange) return
      closeTabFocusLeft(
        MAIN_SCRIPT_TAB_ORDER,
        (t) => isMainScriptTabOpen(t, scriptTabsOpen),
        tab,
        serverDocumentTab,
        onSplitServerDocumentTabChange,
        (t, open) => setScriptTabOpen(t, open),
        'droneRacer',
      )
    },
    [serverDocumentTab, onSplitServerDocumentTabChange, scriptTabsOpen, setScriptTabOpen],
  )

  const closeEditIsolationTab = useCallback(
    (tab: EditIsolationTabId) => {
      const isOpen = (t: EditIsolationTabId) =>
        t === 'isolation' ? isolationTabOpen : hoverScriptTabOpen
      const visibleBefore = EDIT_ISOLATION_TAB_ORDER.filter(isOpen)
      const idx = visibleBefore.indexOf(tab)
      if (idx < 0) return

      if (tab === 'isolation') onIsolationTabOpenChange?.(false)
      else onHoverScriptTabOpenChange?.(false)

      if (editDocumentFocus !== tab) return

      const left = idx > 0 ? visibleBefore[idx - 1]! : ('main' as const)
      onEditDocumentFocusChange(left)
    },
    [
      editDocumentFocus,
      onEditDocumentFocusChange,
      isolationTabOpen,
      hoverScriptTabOpen,
      onIsolationTabOpenChange,
      onHoverScriptTabOpenChange,
    ],
  )

  /** Client / Server tab chrome: active only when that sim is focused and the 3D doc is selected (not Script). */
  const simClientTabChromeActive = simFocus === 'client' && mainDocumentEditorTab === 'droneRacer'
  const simServerTabChromeActive = simFocus === 'server' && mainDocumentEditorTab === 'droneRacer'
  const splitClientPrimaryTabActive = clientDocumentTab === 'droneRacer'
  const splitServerPrimaryTabActive = serverDocumentTab === 'droneRacer'

  /** Active = this tab is the visible document (only one active tab per strip). */
  const documentTabClass = (active: boolean) =>
    `${styles.tab} ${active ? styles.tabActive : styles.tabInactive}`

  const selectMainDroneRacerTab = useCallback(() => {
    onMainDocumentEditorTabChange('droneRacer')
    onEditDocumentFocusChange('main')
  }, [onEditDocumentFocusChange, onMainDocumentEditorTabChange])

  /** Edit: inset ring on main Drone Racer viewport (split = focused column; single = interaction “Has stroke”). */
  const mainEditInsetRing =
    !clientSim &&
    (showAssetInIsolation
      ? editDocumentFocus === 'main'
      : !!editDatamodelShowStroke || mainDocumentScriptOpen)

  /** Asset isolation column — inset ring when a document in that column has focus (Drone preview or HoverScript). */
  const droneIsolationPreviewActive =
    !!showAssetInIsolation && editDocumentFocus === 'isolation'
  const hoverScriptDocumentActive =
    !!showAssetInIsolation && editDocumentFocus === 'hoverScript'
  const isolationColumnEditInsetRing =
    droneIsolationPreviewActive || hoverScriptDocumentActive

  /** Split edit: inactive column — crop baked UI frame on placeholder art so only one inset ring reads as focus. */
  const mainInactiveInSplit =
    !clientSim && !!showAssetInIsolation && editDocumentFocus !== 'main'

  const strokeOn = !!playModeHasStroke
  const focusStrokeOn = !!playModeHasFocusStroke
  const simFullTintOn = !!playModeFullTint
  const simSelectionTintOn = !!playModeSelectionTint
  const simTintHoleActive = !!tintActive

  /**
   * Test + Show asset in isolation: Client/Server sim chrome (stroke, rings, tint hole) only while
   * the sim document strip has focus — not when Drone isolation is the active document.
   */
  const simDocumentChromeActive =
    !clientSim || !showAssetInIsolation || editDocumentFocus === 'main'

  /** Test: datamodel stroke on Client tab viewport while Client has sim focus (cyan). */
  const mainSimInsetRing =
    !!clientSim &&
    simDocumentChromeActive &&
    !!editDatamodelShowStroke &&
    simFocus === 'client'

  const clientSemanticStroke =
    !!clientSim &&
    simDocumentChromeActive &&
    strokeOn &&
    !focusStrokeOn &&
    simFocus === 'client'
  const serverSemanticStroke =
    !!clientSim &&
    simDocumentChromeActive &&
    strokeOn &&
    !focusStrokeOn &&
    simFocus === 'server'

  /**
   * Play focus inset: on 3D tabs follow Client/Server sim focus; on Script tabs keep the ring on
   * the column (split) or viewport (combined) showing that script.
   */
  const clientFocusChromeRing =
    !!clientSim &&
    simDocumentChromeActive &&
    focusStrokeOn &&
    (usePerColumnDocumentTabs
      ? splitClientPrimaryTabActive
        ? simFocus === 'client'
        : clientDocumentScriptOpen
      : simFocus === 'client' || mainDocumentScriptOpen)

  const serverFocusChromeRing =
    !!clientSim &&
    simDocumentChromeActive &&
    focusStrokeOn &&
    (usePerColumnDocumentTabs
      ? splitServerPrimaryTabActive
        ? simFocus === 'server'
        : serverDocumentScriptOpen
      : simFocus === 'server' && !mainDocumentScriptOpen)

  const clientElevateForSimTint =
    !!clientSim && simDocumentChromeActive && simTintHoleActive && simFocus === 'client'
  const serverElevateForSimTint =
    !!clientSim && simDocumentChromeActive && simTintHoleActive && simFocus === 'server'

  const clientSimTintFromServerFocus =
    !!clientSim &&
    simDocumentChromeActive &&
    simSelectionTintOn &&
    simFullTintOn &&
    simFocus === 'server'

  const serverSimTintFromClientFocus =
    !!clientSim &&
    simDocumentChromeActive &&
    simSelectionTintOn &&
    simFullTintOn &&
    simFocus === 'client'

  const clientTintHoleRef =
    !!clientSim && clientElevateForSimTint ? focusHoleRef : undefined
  const serverTintHoleRef =
    !!clientSim && serverElevateForSimTint ? focusHoleRef : undefined

  /** Same Drone Racer scene in edit and Client test tab (when asset isolation is off in test). */
  const droneViewportImage = (
    <img
      src={
        bunnyAssetWindow
          ? publicAssetUrl('assets/bunny-viewport.png')
          : publicAssetUrl('assets/viewport.png')
      }
      alt="3D viewport"
    />
  )

  /** Test + “Show asset in isolation”: Client panel shows sim art; Drone world stays in Client when iso is off. */
  const clientTestViewportBody =
    !!clientSim && !!showAssetInIsolation ? <ClientSim /> : droneViewportImage

  const scriptPlaceholderForTab = (tab: MainDocumentEditorTab) => {
    if (tab === 'clientScript') return CLIENT_SCRIPT_PLACEHOLDER
    if (tab === 'serverScript') return SERVER_SCRIPT_PLACEHOLDER
    return DRONE_RACER_MAIN_SCRIPT_PLACEHOLDER
  }

  const renderDocumentScriptBody = (activeScriptTab: MainDocumentEditorTab) => (
    <div
      className={styles.mainDocumentScriptFill}
      data-name="DroneRacerMainScript"
      onPointerDown={(e) => {
        e.stopPropagation()
        if (clientSim) {
          onSimViewportFocusChange?.(
            activeScriptTab === 'serverScript' ? 'server' : 'client',
          )
        }
        onEditDocumentFocusChange('main')
      }}
    >
      <pre className={styles.hoverScriptEditor} spellCheck={false}>
        {scriptPlaceholderForTab(activeScriptTab)}
      </pre>
    </div>
  )

  const useSplitColumnFocusChrome = !!clientSim && !!playModeSplitView

  const renderMainViewport = (
    showClientSimChrome: boolean,
    activeScriptTab: MainDocumentEditorTab | null,
  ) => {
    const showScript = activeScriptTab != null
    const viewportClass = [
      styles.viewport,
      showClientSimChrome && clientSemanticStroke ? styles.viewportClientFocused : null,
      showClientSimChrome && clientElevateForSimTint ? styles.viewportAboveSimTint : null,
      mainInactiveInSplit ? styles.editWorkspaceInactiveBleedCrop : null,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        ref={clientTintHoleRef}
        className={viewportClass}
        data-node-id="3842:134334"
        {...(bunnyAssetWindow && !clientSim ? { 'data-bunny-viewport-root': '' as const } : {})}
        onPointerDown={() => {
          if (clientSim) onSimViewportFocusChange?.('client')
          onEditDocumentFocusChange('main')
        }}
      >
        {clientSim
          ? showScript
            ? renderDocumentScriptBody(activeScriptTab!)
            : clientTestViewportBody
          : showScript
            ? renderDocumentScriptBody(activeScriptTab!)
            : droneViewportImage}
        {showClientSimChrome && clientSimTintFromServerFocus ? (
          <div className={styles.viewportSelectionTintClient} aria-hidden />
        ) : null}
        {mainEditInsetRing ||
        (bunnyAssetWindow && !clientSim && bunnyEditViewportFocused) ? (
          <div className={styles.editWorkspaceInsetRing} aria-hidden />
        ) : null}
        {showClientSimChrome && mainSimInsetRing ? (
          <div className={styles.simDatamodelStrokeOverlay} aria-hidden />
        ) : null}
        {showClientSimChrome && clientFocusChromeRing && !useSplitColumnFocusChrome ? (
          <div className={styles.editWorkspaceInsetRing} aria-hidden />
        ) : null}
      </div>
    )
  }

  const renderServerTestViewport = (showServerSimChrome: boolean) => (
    <div
      ref={serverTintHoleRef}
      className={[
        styles.serverViewport,
        showServerSimChrome && serverSemanticStroke ? styles.serverViewportFocused : null,
        showServerSimChrome && serverElevateForSimTint ? styles.viewportAboveSimTint : null,
      ]
        .filter(Boolean)
        .join(' ')}
      data-node-id="3841:113029-viewport"
      onPointerDown={() => {
        onSimViewportFocusChange?.('server')
        onEditDocumentFocusChange('main')
      }}
    >
      <ServerSim />
      {showServerSimChrome && serverSimTintFromClientFocus ? (
        <div className={styles.viewportSelectionTintServer} aria-hidden />
      ) : null}
      {showServerSimChrome &&
      !!clientSim &&
      !!editDatamodelShowStroke &&
      simFocus === 'server' ? (
        <div className={styles.serverSimDatamodelStrokeOverlay} aria-hidden />
      ) : null}
      {showServerSimChrome && serverFocusChromeRing && !useSplitColumnFocusChrome ? (
        <div className={styles.editWorkspaceInsetRing} aria-hidden />
      ) : null}
    </div>
  )

  const splitClientFocusChrome =
    useSplitColumnFocusChrome && clientFocusChromeRing ? (
      <div className={styles.editWorkspaceInsetRing} aria-hidden />
    ) : null

  const splitServerFocusChrome =
    useSplitColumnFocusChrome && serverFocusChromeRing ? (
      <div className={styles.editWorkspaceInsetRing} aria-hidden />
    ) : null

  const renderDocumentSecondaryTabs = (
    activeTab: MainDocumentEditorTab,
    onTabChange: (tab: MainDocumentEditorTab) => void,
    onCloseScriptTab: (tab: MainScriptTabId) => void,
    extraTabs?: { clientScript?: boolean; serverScript?: boolean },
    simColumn: SimViewportFocus = 'client',
  ) => {
    const focusSimColumn = () => {
      if (clientSim) onSimViewportFocusChange?.(simColumn)
    }

    return (
    <>
      {scriptATabOpen ? (
      <TabWithPathTooltip
        path={TAB_PATH_DRONE_RACER_SCRIPT}
        role="tab"
        tabIndex={0}
        aria-selected={activeTab === 'scriptA'}
        className={`${styles.tab} ${activeTab === 'scriptA' ? styles.tabActive : styles.tabInactive}`}
        onPointerDown={(e) => {
          e.stopPropagation()
          onTabChange('scriptA')
          focusSimColumn()
        }}
        onClick={(e) => {
          e.stopPropagation()
          onTabChange('scriptA')
          focusSimColumn()
        }}
      >
        <TabDiamond />
        <span>Script</span>
        <TabCloseButton onClose={() => onCloseScriptTab('scriptA')} />
      </TabWithPathTooltip>
      ) : null}
      {scriptBTabOpen ? (
      <TabWithPathTooltip
        path={TAB_PATH_DRONE_RACER_SCRIPT}
        role="tab"
        tabIndex={0}
        aria-selected={activeTab === 'scriptB'}
        className={`${styles.tab} ${
          activeTab === 'scriptB' ? styles.tabActive : styles.tabInactive
        }`}
        onPointerDown={(e) => {
          e.stopPropagation()
          onTabChange('scriptB')
          focusSimColumn()
        }}
        onClick={(e) => {
          e.stopPropagation()
          onTabChange('scriptB')
          focusSimColumn()
        }}
      >
        <TabDiamond />
        <span>Script</span>
        <TabCloseButton onClose={() => onCloseScriptTab('scriptB')} />
      </TabWithPathTooltip>
      ) : null}
      {extraTabs?.clientScript ? (
        <TabWithPathTooltip
          path={TAB_PATH_DRONE_RACER_CLIENT_SCRIPT}
          role="tab"
          tabIndex={0}
          aria-selected={activeTab === 'clientScript'}
          className={`${styles.tab} ${
            activeTab === 'clientScript' ? styles.tabActive : styles.tabInactive
          }`}
          onPointerDown={(e) => {
            e.stopPropagation()
            onTabChange('clientScript')
            if (clientSim) onSimViewportFocusChange?.('client')
          }}
          onClick={(e) => {
            e.stopPropagation()
            onTabChange('clientScript')
            if (clientSim) onSimViewportFocusChange?.('client')
          }}
        >
          <TabClientSimDocumentIcon />
          <span>Script</span>
          <TabCloseButton onClose={() => onCloseScriptTab('clientScript')} />
        </TabWithPathTooltip>
      ) : null}
      {extraTabs?.serverScript ? (
        <TabWithPathTooltip
          path={TAB_PATH_DRONE_RACER_SERVER_SCRIPT}
          role="tab"
          tabIndex={0}
          aria-selected={activeTab === 'serverScript'}
          className={`${styles.tab} ${
            activeTab === 'serverScript' ? styles.tabActive : styles.tabInactive
          }`}
          onPointerDown={(e) => {
            e.stopPropagation()
            onTabChange('serverScript')
            if (clientSim) onSimViewportFocusChange?.('server')
          }}
          onClick={(e) => {
            e.stopPropagation()
            onTabChange('serverScript')
            if (clientSim) onSimViewportFocusChange?.('server')
          }}
        >
          <Server
            size={12}
            strokeWidth={1.5}
            className={`${styles.tabDiamond} ${styles.tabDiamondBrand}`}
            color="#0c9b5a"
            aria-hidden
          />
          <span>Script</span>
          <TabCloseButton onClose={() => onCloseScriptTab('serverScript')} />
        </TabWithPathTooltip>
      ) : null}
    </>
    )
  }

  const combinedExtraScriptTabs = {
    clientScript: !!clientSim && clientScriptTabOpen,
    serverScript: !!clientSim && serverScriptTabOpen,
  }

  const optionalScriptTabs = bunnyAssetWindow
    ? null
    : renderDocumentSecondaryTabs(
        mainDocumentEditorTab,
        onMainDocumentEditorTabChange,
        closeMainDocumentScriptTab,
        combinedExtraScriptTabs,
      )

  const simClientServerTabRow = (
    <div className={styles.tabRow} data-node-id="3841:115140-sim-client-server">
      <TabWithPathTooltip
        path={TAB_PATH_DRONE_RACER_CLIENT}
        role="tab"
        tabIndex={0}
        aria-selected={simClientTabChromeActive}
        className={documentTabClass(simClientTabChromeActive)}
        onPointerDown={(e) => {
          e.stopPropagation()
          onMainDocumentEditorTabChange('droneRacer')
          onSimViewportFocusChange?.('client')
          onEditDocumentFocusChange('main')
        }}
        onClick={(e) => {
          e.stopPropagation()
          onMainDocumentEditorTabChange('droneRacer')
          onSimViewportFocusChange?.('client')
          onEditDocumentFocusChange('main')
        }}
      >
        <TabClientSimDocumentIcon />
        <span>Client</span>
        <button type="button" className={styles.tabClose} aria-label="Close tab">
          <img src={publicAssetUrl('assets/tab-close.svg')} alt="" />
        </button>
      </TabWithPathTooltip>
      <TabWithPathTooltip
        path={TAB_PATH_DRONE_RACER_SERVER}
        role="tab"
        tabIndex={0}
        aria-selected={simServerTabChromeActive}
        className={documentTabClass(simServerTabChromeActive)}
        onPointerDown={(e) => {
          e.stopPropagation()
          onMainDocumentEditorTabChange('droneRacer')
          onSimViewportFocusChange?.('server')
          onEditDocumentFocusChange('main')
        }}
        onClick={(e) => {
          e.stopPropagation()
          onMainDocumentEditorTabChange('droneRacer')
          onSimViewportFocusChange?.('server')
          onEditDocumentFocusChange('main')
        }}
      >
        <Server
          size={12}
          strokeWidth={1.5}
          className={`${styles.tabDiamond} ${styles.tabDiamondBrand}`}
          color="#0c9b5a"
          aria-hidden
        />
        <span>Server</span>
        <button type="button" className={styles.tabClose} aria-label="Close tab">
          <img src={publicAssetUrl('assets/tab-close.svg')} alt="" />
        </button>
      </TabWithPathTooltip>
      {optionalScriptTabs}
      <div className={styles.tabRowUnderline} aria-hidden>
        <img src={publicAssetUrl('assets/tab-underline.svg')} alt="" />
      </div>
    </div>
  )

  const focusClientSim = () => {
    if (usePerColumnDocumentTabs) {
      onSplitClientDocumentTabChange!('droneRacer')
    } else {
      onMainDocumentEditorTabChange('droneRacer')
    }
    onSimViewportFocusChange?.('client')
    onEditDocumentFocusChange('main')
  }

  const focusServerSim = () => {
    if (usePerColumnDocumentTabs) {
      onSplitServerDocumentTabChange!('droneRacer')
    } else {
      onMainDocumentEditorTabChange('droneRacer')
    }
    onSimViewportFocusChange?.('server')
    onEditDocumentFocusChange('main')
  }

  const simSplitClientTabRow = (
    <div
      className={`${styles.tabRow} ${styles.simSplitDocumentTabRow}`}
      data-node-id="3841:115140-split-client-tabs"
    >
      <TabWithPathTooltip
        path={TAB_PATH_DRONE_RACER_CLIENT}
        role="tab"
        tabIndex={0}
        aria-selected={splitClientPrimaryTabActive}
        className={documentTabClass(splitClientPrimaryTabActive)}
        onPointerDown={(e) => {
          e.stopPropagation()
          focusClientSim()
        }}
        onClick={(e) => {
          e.stopPropagation()
          focusClientSim()
        }}
      >
        <TabClientSimDocumentIcon />
        <span>Client</span>
        <button type="button" className={styles.tabClose} aria-label="Close tab">
          <img src={publicAssetUrl('assets/tab-close.svg')} alt="" />
        </button>
      </TabWithPathTooltip>
      {usePerColumnDocumentTabs
        ? renderDocumentSecondaryTabs(
            clientDocumentTab,
            onSplitClientDocumentTabChange!,
            closeSplitClientScriptTab,
            { clientScript: !!clientSim && clientScriptTabOpen },
            'client',
          )
        : optionalScriptTabs}
      <div className={styles.tabRowUnderline} aria-hidden>
        <img src={publicAssetUrl('assets/tab-underline.svg')} alt="" />
      </div>
    </div>
  )

  const simSplitServerTabRow = (
    <div
      className={`${styles.tabRow} ${styles.simSplitDocumentTabRow}`}
      data-node-id="3841:113029-split-server-tabs"
    >
      <TabWithPathTooltip
        path={TAB_PATH_DRONE_RACER_SERVER}
        role="tab"
        tabIndex={0}
        aria-selected={splitServerPrimaryTabActive}
        className={documentTabClass(splitServerPrimaryTabActive)}
        onPointerDown={(e) => {
          e.stopPropagation()
          focusServerSim()
        }}
        onClick={(e) => {
          e.stopPropagation()
          focusServerSim()
        }}
      >
        <Server
          size={12}
          strokeWidth={1.5}
          className={`${styles.tabDiamond} ${styles.tabDiamondBrand}`}
          color="#0c9b5a"
          aria-hidden
        />
        <span>Server</span>
        <button type="button" className={styles.tabClose} aria-label="Close tab">
          <img src={publicAssetUrl('assets/tab-close.svg')} alt="" />
        </button>
      </TabWithPathTooltip>
      {usePerColumnDocumentTabs
        ? renderDocumentSecondaryTabs(
            serverDocumentTab,
            onSplitServerDocumentTabChange!,
            closeSplitServerScriptTab,
            { serverScript: !!clientSim && serverScriptTabOpen },
            'server',
          )
        : optionalScriptTabs}
      <div className={styles.tabRowUnderline} aria-hidden>
        <img src={publicAssetUrl('assets/tab-underline.svg')} alt="" />
      </div>
    </div>
  )

  const assetIsolationTabRow = (
    <div
      className={`${styles.tabRow} ${styles.assetIsolationTabRow}`}
      data-node-id="3841:115139-iso-tabs"
    >
      {isolationTabOpen ? (
      <TabWithPathTooltip
        path={TAB_PATH_DRONE_ASSET}
        role="tab"
        tabIndex={0}
        aria-selected={editDocumentFocus === 'isolation'}
        className={`${styles.tab} ${
          editDocumentFocus === 'isolation' ? styles.tabActive : styles.tabInactive
        }`}
        onPointerDown={(e) => {
          e.stopPropagation()
          onEditDocumentFocusChange('isolation')
        }}
        onClick={(e) => {
          e.stopPropagation()
          onEditDocumentFocusChange('isolation')
        }}
      >
        <img
          src={publicAssetUrl('assets/Model.png')}
          alt=""
          className={`${styles.tabDiamond} ${styles.bitmapIconCrisp}`}
          aria-hidden
        />
        <span>{DRONE_WORKSPACE_TAB_LABEL}</span>
        <TabCloseButton onClose={() => closeEditIsolationTab('isolation')} />
      </TabWithPathTooltip>
      ) : null}
      {hoverScriptTabOpen ? (
      <TabWithPathTooltip
        path={TAB_PATH_DRONE_HOVERSCRIPT}
        role="tab"
        tabIndex={0}
        aria-selected={editDocumentFocus === 'hoverScript'}
        className={`${styles.tab} ${
          editDocumentFocus === 'hoverScript' ? styles.tabActive : styles.tabInactive
        }`}
        onPointerDown={(e) => {
          e.stopPropagation()
          onEditDocumentFocusChange('hoverScript')
        }}
        onClick={(e) => {
          e.stopPropagation()
          onEditDocumentFocusChange('hoverScript')
        }}
      >
        <TabDiamond />
        <span>{HOVER_SCRIPT_TAB_LABEL}</span>
        <TabCloseButton onClose={() => closeEditIsolationTab('hoverScript')} />
      </TabWithPathTooltip>
      ) : null}
      <div className={styles.tabRowUnderline} aria-hidden>
        <img src={publicAssetUrl('assets/tab-underline.svg')} alt="" />
      </div>
    </div>
  )

  const assetIsolationColumnAside = (
    <aside className={styles.assetIsolationPanel} aria-label={DRONE_WORKSPACE_TAB_LABEL}>
      <div
        className={[
          styles.assetIsolationWorkspace,
          isolationColumnEditInsetRing ? null : styles.editWorkspaceInactiveBleedCrop,
        ]
          .filter(Boolean)
          .join(' ')}
        onPointerDown={() =>
          onEditDocumentFocusChange(
            editDocumentFocus === 'hoverScript' ? 'hoverScript' : 'isolation',
          )
        }
      >
        {hoverScriptDocumentActive ? (
          <pre className={styles.hoverScriptEditor} spellCheck={false}>
            hello world
          </pre>
        ) : (
          <img
            src={
              droneIsolationPreviewActive ? ASSET_ISOLATION_IMAGE_FOCUSED : ASSET_ISOLATION_IMAGE
            }
            alt=""
          />
        )}
        {isolationColumnEditInsetRing ? (
          <div className={styles.editWorkspaceInsetRing} aria-hidden />
        ) : null}
      </div>
    </aside>
  )

  /** Single tabbed Client/Server + Script strip: Script lives in client viewport; Server sim is server viewport. */
  const simTabbedBodyViewport =
    mainDocumentScriptOpen || simFocus === 'client'
      ? renderMainViewport(
          true,
          mainDocumentScriptOpen ? mainDocumentEditorTab : null,
        )
      : renderServerTestViewport(true)

  const simTabbedClientServerStack = (
    <>
      {simClientServerTabRow}
      <div className={styles.simTabbedBody}>{simTabbedBodyViewport}</div>
    </>
  )

  if (clientSim) {
    if (showAssetInIsolation) {
      if (playModeSplitView) {
        return (
          <div className={styles.documentPanel} data-node-id="3841:115139">
            <div className={styles.testTriptychTabStrip}>
              <div
                className={styles.testTriptychTabCol}
                onPointerDown={() => {
                  onSimViewportFocusChange?.('client')
                  onEditDocumentFocusChange('main')
                }}
              >
                {simSplitClientTabRow}
              </div>
              <div
                className={styles.testTriptychTabCol}
                onPointerDown={() => {
                  onSimViewportFocusChange?.('server')
                  onEditDocumentFocusChange('main')
                }}
              >
                {simSplitServerTabRow}
              </div>
              <div className={styles.editTabStripIso}>
                {assetIsolationTabRow}
              </div>
            </div>
            <div className={styles.testTriptychBodyRow}>
              <div
                className={styles.simSplitClientWrap}
                onPointerDown={() => {
                  onSimViewportFocusChange?.('client')
                  onEditDocumentFocusChange('main')
                }}
              >
                {splitClientFocusChrome}
                <div className={styles.simTabbedBody}>
                  {renderMainViewport(
                    true,
                    clientDocumentScriptOpen ? clientDocumentTab : null,
                  )}
                </div>
              </div>
              <section
                className={styles.simSplitServerWrap}
                aria-label="Server simulation view"
                onPointerDown={() => {
                  onSimViewportFocusChange?.('server')
                  onEditDocumentFocusChange('main')
                }}
              >
                {splitServerFocusChrome}
                <div className={styles.simTabbedBody}>
                  {serverDocumentScriptOpen
                    ? renderMainViewport(false, serverDocumentTab)
                    : renderServerTestViewport(true)}
                </div>
              </section>
              {assetIsolationColumnAside}
            </div>
          </div>
        )
      }
      return (
        <div className={styles.documentPanel} data-node-id="3841:115139">
          <div className={styles.editCombinedTabStrip}>
            <div
              className={styles.editTabStripMain}
              onPointerDown={() => onEditDocumentFocusChange('main')}
            >
              {simClientServerTabRow}
            </div>
            <div className={styles.editTabStripIso}>
              {assetIsolationTabRow}
            </div>
          </div>
          <div className={styles.editWorkspaceSplit}>
            <div className={styles.testSimClientServerHost}>
              <div className={styles.simTabbedBody}>{simTabbedBodyViewport}</div>
            </div>
            {assetIsolationColumnAside}
          </div>
        </div>
      )
    }

    if (playModeSplitView) {
      return (
        <div className={styles.documentPanel} data-node-id="3841:115139">
          <div className={styles.simSplitViewportRow}>
            <div
              className={styles.simSplitClientWrap}
              onPointerDown={() => {
                onSimViewportFocusChange?.('client')
                onEditDocumentFocusChange('main')
              }}
            >
              {splitClientFocusChrome}
              {simSplitClientTabRow}
              <div className={styles.simTabbedBody}>
                {renderMainViewport(
                    true,
                    clientDocumentScriptOpen ? clientDocumentTab : null,
                  )}
              </div>
            </div>
            <section
              className={styles.simSplitServerWrap}
              aria-label="Server simulation view"
              onPointerDown={() => {
                onSimViewportFocusChange?.('server')
                onEditDocumentFocusChange('main')
              }}
            >
              {splitServerFocusChrome}
              {simSplitServerTabRow}
              <div className={styles.simTabbedBody}>
                {serverDocumentScriptOpen
                  ? renderMainViewport(false, serverDocumentTab)
                  : renderServerTestViewport(true)}
              </div>
            </section>
          </div>
        </div>
      )
    }
    return (
      <div className={styles.documentPanel} data-node-id="3841:115139">
        {simTabbedClientServerStack}
      </div>
    )
  }

  const mainDocumentTabRow = (
    <div className={styles.tabRow} data-node-id="3841:115140">
      <TabWithPathTooltip
        path={bunnyAssetWindow ? TAB_PATH_BUNNY_DOCUMENT : TAB_PATH_DRONE_RACER_DOCUMENT}
        role="tab"
        tabIndex={0}
        aria-selected={mainDocumentEditorTab === 'droneRacer'}
        className={`${styles.tab} ${
          mainDocumentEditorTab === 'droneRacer' ? styles.tabActive : styles.tabInactive
        }`}
        onPointerDown={(e) => {
          e.stopPropagation()
          selectMainDroneRacerTab()
        }}
        onClick={(e) => {
          e.stopPropagation()
          selectMainDroneRacerTab()
        }}
      >
        <TabDiamond />
        <span>{bunnyAssetWindow ? 'Bunny' : 'Drone Racer'}</span>
        <button type="button" className={styles.tabClose} aria-label="Close tab">
          <img src={publicAssetUrl('assets/tab-close.svg')} alt="" />
        </button>
      </TabWithPathTooltip>
      {optionalScriptTabs}
      <div className={styles.tabRowUnderline} aria-hidden>
        <img src={publicAssetUrl('assets/tab-underline.svg')} alt="" />
      </div>
    </div>
  )

  const documentPanelBunnyFocusProps =
    bunnyAssetWindow && !clientSim
      ? {
          onPointerDownCapture: (e: React.PointerEvent<HTMLDivElement>) => {
            const t = e.target as HTMLElement | null
            if (!t) return
            setBunnyEditViewportFocused(!!t.closest('[data-bunny-viewport-root]'))
          },
        }
      : {}

  return (
    <div
      className={styles.documentPanel}
      data-node-id="3841:115139"
      {...documentPanelBunnyFocusProps}
    >
      {showAssetInIsolation && !clientSim ? (
        <div className={styles.editCombinedTabStrip}>
          <div className={styles.editTabStripMain} onPointerDown={() => onEditDocumentFocusChange('main')}>
            {mainDocumentTabRow}
          </div>
          <div className={styles.editTabStripIso}>
            {assetIsolationTabRow}
          </div>
        </div>
      ) : (
        mainDocumentTabRow
      )}
      {showAssetInIsolation && !clientSim ? (
        <div className={styles.editWorkspaceSplit}>
          {renderMainViewport(
            true,
            mainDocumentScriptOpen ? mainDocumentEditorTab : null,
          )}
          {assetIsolationColumnAside}
        </div>
      ) : (
        renderMainViewport(
          true,
          mainDocumentScriptOpen ? mainDocumentEditorTab : null,
        )
      )}
    </div>
  )
}

/** Bunny asset window — same shell as `DroneRacerWorkspace` with fixed Bunny layout (DevTools / stack traces). */
export type BunnyWorkspaceProps = Omit<
  DroneRacerWorkspaceProps,
  'bunnyAssetWindow' | 'showAssetInIsolation'
>

export function BunnyWorkspace(props: BunnyWorkspaceProps) {
  return (
    <DroneRacerWorkspace {...props} bunnyAssetWindow showAssetInIsolation={false} />
  )
}

/**
 * Studio – Windows OS frame from Figma
 * (Studio App Framework 2026, node 3841:114990).
 */
export type StudioFrameVariant = 'studio' | 'bunny'

export type StudioWindowsOSProps = {
  /** Spawns another full Studio frame stacked above (wired from `App`). */
  onOpenAssetWindow?: () => void
  /** `bunny`: asset window — title, viewport art, no isolation column or Script tabs. */
  frameVariant?: StudioFrameVariant
  /** Bunny stacked frame: title-bar close removes this window (main studio omits this). */
  onCloseFrame?: () => void
}

export default function StudioWindowsOS({
  onOpenAssetWindow,
  frameVariant = 'studio',
  onCloseFrame,
}: StudioWindowsOSProps) {
  const bunnyAssetWindow = frameVariant === 'bunny'
  const [clientSimActive, setClientSimActive] = useState(false)
  const [simViewportFocus, setSimViewportFocus] = useState<SimViewportFocus>('client')
  /** Sim Explorer: selected row while Client viewport has sim focus (null until user selects). */
  const [simExplorerSelectedRowClient, setSimExplorerSelectedRowClient] = useState<string | null>(null)
  /** Sim Explorer: selected row while Server viewport has sim focus (null until user selects). */
  const [simExplorerSelectedRowServer, setSimExplorerSelectedRowServer] = useState<string | null>(null)
  /** Play mode: inset ring on focused client/server viewport — brand hue (Testing UI: Has semantic stroke). */
  const [playModeHasStroke, setPlayModeHasStroke] = useState(true)
  /** Play mode: sim viewport focus ring matches edit Drone Racer / asset isolation white inset (Testing UI). */
  const [playModeHasFocusStroke, setPlayModeHasFocusStroke] = useState(true)
  /** Play mode: Explorer header pill for Client vs Server focus (Figma 3856:139983). */
  const [explorerFocusBadge, setExplorerFocusBadge] = useState(true)
  /** Explorer badge pill: show Client/Server (or Drone) colored dot when focus badge is on. */
  const [explorerBadgeShowIndicator, setExplorerBadgeShowIndicator] = useState(true)
  /** Play mode: subtle full-frame tint by focused viewport (Interaction settings). */
  const [playModeFullTint, setPlayModeFullTint] = useState(false)
  /** Play mode: subtle tint on the focused client/server sim viewport (Interaction settings). */
  const [playModeSelectionTint, setPlayModeSelectionTint] = useState(false)
  /** Play mode: Client and Server as two columns (Testing UI: Split view). */
  const [playModeSplitView, setPlayModeSplitView] = useState(false)
  /** Interaction settings: asset isolation preview in viewport. */
  const [showAssetInIsolation, setShowAssetInIsolation] = useState(true)
  /** Interaction settings: Edit datamodel UI — show stroke. */
  const [editDatamodelShowStroke, setEditDatamodelShowStroke] = useState(false)
  /** Edit mode: focused document column (main vs asset isolation column tabs). */
  const [editWorkspaceDocumentFocus, setEditWorkspaceDocumentFocus] = useState<EditDocumentFocus>(
    'main',
  )

  /** Main document strip: Drone Racer 3D vs Script tabs (shared by edit + test workspace). */
  const [mainDocumentEditorTab, setMainDocumentEditorTab] = useState<MainDocumentEditorTab>(
    'droneRacer',
  )
  /** Split view: independent document tabs per Client / Server column. */
  const [splitClientDocumentTab, setSplitClientDocumentTab] =
    useState<MainDocumentEditorTab>('droneRacer')
  const [splitServerDocumentTab, setSplitServerDocumentTab] =
    useState<MainDocumentEditorTab>('droneRacer')
  const [scriptATabOpen, setScriptATabOpen] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.scriptATabOpen,
  )
  const [scriptBTabOpen, setScriptBTabOpen] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.scriptBTabOpen,
  )
  const [clientScriptTabOpen, setClientScriptTabOpen] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.clientScriptTabOpen,
  )
  const [serverScriptTabOpen, setServerScriptTabOpen] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.serverScriptTabOpen,
  )
  const [isolationTabOpen, setIsolationTabOpen] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.isolationTabOpen,
  )
  const [hoverScriptTabOpen, setHoverScriptTabOpen] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.hoverScriptTabOpen,
  )

  const openClientScriptTab = useCallback(() => {
    setClientScriptTabOpen(true)
    if (clientSimActive && playModeSplitView) {
      setSplitClientDocumentTab('clientScript')
      setSimViewportFocus('client')
    } else {
      setMainDocumentEditorTab('clientScript')
    }
    setEditWorkspaceDocumentFocus('main')
  }, [clientSimActive, playModeSplitView])

  const openServerScriptTab = useCallback(() => {
    setServerScriptTabOpen(true)
    if (clientSimActive && playModeSplitView) {
      setSplitServerDocumentTab('serverScript')
      setSimViewportFocus('server')
    } else {
      setMainDocumentEditorTab('serverScript')
    }
    setEditWorkspaceDocumentFocus('main')
  }, [clientSimActive, playModeSplitView])

  const focusedColumnDocumentTab =
    clientSimActive && playModeSplitView
      ? simViewportFocus === 'server'
        ? splitServerDocumentTab
        : splitClientDocumentTab
      : mainDocumentEditorTab

  const focusedColumnScriptOpen = isScriptDocumentTab(focusedColumnDocumentTab)

  /** While a script tab is open in test, which Explorer datamodel tree to show. */
  const explorerWhileScriptFocus: ExplorerRetentionKind | null = useMemo(() => {
    if (!clientSimActive || !focusedColumnScriptOpen) return null

    if (focusedColumnDocumentTab === 'clientScript') return 'sim-client'
    if (focusedColumnDocumentTab === 'serverScript') return 'sim-server'

    if (showAssetInIsolation && editWorkspaceDocumentFocus !== 'main') {
      return 'drone-isolation'
    }

    return simViewportFocus === 'server' ? 'sim-server' : 'sim-client'
  }, [
    clientSimActive,
    focusedColumnScriptOpen,
    focusedColumnDocumentTab,
    showAssetInIsolation,
    editWorkspaceDocumentFocus,
    simViewportFocus,
  ])

  const explorerSimFocusForTree: SimViewportFocus = useMemo(() => {
    if (focusedColumnDocumentTab === 'clientScript') return 'client'
    if (focusedColumnDocumentTab === 'serverScript') return 'server'
    return simViewportFocus
  }, [focusedColumnDocumentTab, simViewportFocus])

  const explorerHeaderSimFocus: SimViewportFocus =
    explorerWhileScriptFocus === 'sim-server'
      ? 'server'
      : explorerWhileScriptFocus === 'sim-client'
        ? 'client'
        : simViewportFocus

  /** Right rail: Explorer / Properties / Interaction panel — title alignment (Interaction settings). */
  const [panelTitlesLeftAligned, setPanelTitlesLeftAligned] = useState(true)

  /** Footer: questions checklist overlay. */
  const [footerQuestionsOpen, setFooterQuestionsOpen] = useState(false)

  const frameRef = useRef<HTMLDivElement | null>(null)
  const focusHoleRef = useRef<HTMLDivElement | null>(null)
  /** Edit-mode document tabs when entering Test — restored on exit. */
  const editDocumentBeforePlayRef = useRef<{
    mainDocumentEditorTab: MainDocumentEditorTab
    splitClientDocumentTab: MainDocumentEditorTab
    splitServerDocumentTab: MainDocumentEditorTab
    editWorkspaceDocumentFocus: EditDocumentFocus
  }>({
    mainDocumentEditorTab: 'droneRacer',
    splitClientDocumentTab: 'droneRacer',
    splitServerDocumentTab: 'droneRacer',
    editWorkspaceDocumentFocus: 'main',
  })
  /** Last test-mode document + sim focus — restored on re-enter. */
  const playModeSessionRef = useRef<{
    simViewportFocus: SimViewportFocus
    mainDocumentEditorTab: MainDocumentEditorTab
    splitClientDocumentTab: MainDocumentEditorTab
    splitServerDocumentTab: MainDocumentEditorTab
  }>({
    simViewportFocus: 'client',
    mainDocumentEditorTab: 'droneRacer',
    splitClientDocumentTab: 'droneRacer',
    splitServerDocumentTab: 'droneRacer',
  })
  const prevClientSimActiveRef = useRef(clientSimActive)
  const [tintClipPath, setTintClipPath] = useState<string | undefined>()

  const handlePrototypeReset = useCallback(() => {
    const d = PROTOTYPE_SETTINGS_DEFAULTS
    setClientSimActive(d.clientSimActive)
    setSimViewportFocus(d.simViewportFocus)
    setPlayModeHasStroke(d.playModeHasStroke)
    setPlayModeHasFocusStroke(d.playModeHasFocusStroke)
    setExplorerFocusBadge(d.explorerFocusBadge)
    setExplorerBadgeShowIndicator(d.explorerBadgeShowIndicator)
    setPlayModeFullTint(d.playModeFullTint)
    setPlayModeSelectionTint(d.playModeSelectionTint)
    setPlayModeSplitView(d.playModeSplitView)
    setShowAssetInIsolation(d.showAssetInIsolation)
    setEditDatamodelShowStroke(d.editDatamodelShowStroke)
    setEditWorkspaceDocumentFocus(d.editWorkspaceDocumentFocus)
    setPanelTitlesLeftAligned(d.panelTitlesLeftAligned)
    setMainDocumentEditorTab(d.mainDocumentEditorTab)
    setSplitClientDocumentTab(d.splitClientDocumentTab)
    setSplitServerDocumentTab(d.splitServerDocumentTab)
    setScriptATabOpen(d.scriptATabOpen)
    setScriptBTabOpen(d.scriptBTabOpen)
    setClientScriptTabOpen(d.clientScriptTabOpen)
    setServerScriptTabOpen(d.serverScriptTabOpen)
    setIsolationTabOpen(d.isolationTabOpen)
    setHoverScriptTabOpen(d.hoverScriptTabOpen)
    setSimExplorerSelectedRowClient(null)
    setSimExplorerSelectedRowServer(null)
    editDocumentBeforePlayRef.current = {
      mainDocumentEditorTab: d.mainDocumentEditorTab,
      splitClientDocumentTab: d.splitClientDocumentTab,
      splitServerDocumentTab: d.splitServerDocumentTab,
      editWorkspaceDocumentFocus: d.editWorkspaceDocumentFocus,
    }
    playModeSessionRef.current = {
      simViewportFocus: d.simViewportFocus,
      mainDocumentEditorTab: d.mainDocumentEditorTab,
      splitClientDocumentTab: d.splitClientDocumentTab,
      splitServerDocumentTab: d.splitServerDocumentTab,
    }
  }, [])

  const tintActive = clientSimActive && playModeFullTint

  const simExplorerSelectedRowId =
    clientSimActive && explorerSimFocusForTree === 'client'
      ? simExplorerSelectedRowClient
      : clientSimActive && explorerSimFocusForTree === 'server'
        ? simExplorerSelectedRowServer
        : null

  const onSimExplorerSelectRow = useCallback(
    (rowId: string) => {
      if (explorerSimFocusForTree === 'client') setSimExplorerSelectedRowClient(rowId)
      else setSimExplorerSelectedRowServer(rowId)
    },
    [explorerSimFocusForTree],
  )

  const panelChromeTitleAlign = panelTitlesLeftAligned ? ('left' as const) : ('center' as const)

  const updateTintHole = useCallback(() => {
    if (!clientSimActive || !playModeFullTint) {
      setTintClipPath(undefined)
      return
    }
    const frame = frameRef.current
    const hole = focusHoleRef.current
    if (!frame || !hole) {
      setTintClipPath(undefined)
      return
    }
    const path = simTintClipPath(frame.getBoundingClientRect(), hole.getBoundingClientRect())
    setTintClipPath(path)
  }, [clientSimActive, playModeFullTint])

  useLayoutEffect(() => {
    updateTintHole()
  }, [updateTintHole, simViewportFocus])

  useEffect(() => {
    if (!clientSimActive || !playModeFullTint) return
    const frame = frameRef.current
    if (!frame) return
    const ro = new ResizeObserver(() => {
      updateTintHole()
    })
    ro.observe(frame)
    const hole = focusHoleRef.current
    if (hole) ro.observe(hole)
    window.addEventListener('resize', updateTintHole)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateTintHole)
    }
  }, [clientSimActive, playModeFullTint, simViewportFocus, updateTintHole])

  useEffect(() => {
    const wasSim = prevClientSimActiveRef.current
    if (!wasSim && clientSimActive) {
      editDocumentBeforePlayRef.current = {
        mainDocumentEditorTab,
        splitClientDocumentTab,
        splitServerDocumentTab,
        editWorkspaceDocumentFocus,
      }
      const session = playModeSessionRef.current
      setSimViewportFocus(session.simViewportFocus)
      setMainDocumentEditorTab(session.mainDocumentEditorTab)
      setSplitClientDocumentTab(session.splitClientDocumentTab)
      setSplitServerDocumentTab(session.splitServerDocumentTab)
      setSimExplorerSelectedRowClient(null)
      setSimExplorerSelectedRowServer(null)
      setEditWorkspaceDocumentFocus('main')
    }
    if (wasSim && !clientSimActive) {
      playModeSessionRef.current = {
        simViewportFocus,
        mainDocumentEditorTab,
        splitClientDocumentTab,
        splitServerDocumentTab,
      }
      const edit = editDocumentBeforePlayRef.current
      setMainDocumentEditorTab(edit.mainDocumentEditorTab)
      setSplitClientDocumentTab(edit.splitClientDocumentTab)
      setSplitServerDocumentTab(edit.splitServerDocumentTab)
      const restoredFocus = edit.editWorkspaceDocumentFocus
      setEditWorkspaceDocumentFocus(
        !showAssetInIsolation && restoredFocus !== 'main' ? 'main' : restoredFocus,
      )
    }
    prevClientSimActiveRef.current = clientSimActive
    // editWorkspaceDocumentFocus intentionally omitted: only snapshot on sim toggle, not each focus tick.
  }, [clientSimActive, showAssetInIsolation])

  useEffect(() => {
    if (!showAssetInIsolation) setEditWorkspaceDocumentFocus('main')
  }, [showAssetInIsolation])

  useEffect(() => {
    if (!footerQuestionsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFooterQuestionsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [footerQuestionsOpen])

  return (
    <div
      ref={frameRef}
      className={styles.frame}
      data-node-id="3841:114990"
      data-name="Studio - Windows OS"
    >
      <header className={styles.appBar} data-node-id="3842:134467">
        <div className={styles.appBarLeft}>
          <button type="button" className={styles.logoBtn} aria-label="App menu">
            <img src={publicAssetUrl('assets/appbar-logo.svg')} alt="" />
          </button>
          <nav className={styles.menu} aria-label="Application menu">
            {MENUS.map((label) => (
              <span key={label} className={styles.menuItem}>
                {label}
              </span>
            ))}
          </nav>
        </div>
        <h1 className={styles.title}>{bunnyAssetWindow ? 'Bunny' : 'Drone Racer'}</h1>
        <div className={styles.appBarRight}>
          <button type="button" className={styles.winIcon} aria-label="Minimize">
            <img src={publicAssetUrl('assets/win-min.svg')} alt="" />
          </button>
          <button type="button" className={styles.winIcon} aria-label="Maximize">
            <img src={publicAssetUrl('assets/win-max.svg')} alt="" />
          </button>
          <button
            type="button"
            className={styles.winIcon}
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation()
              onCloseFrame?.()
            }}
          >
            <img src={publicAssetUrl('assets/win-close.svg')} alt="" />
          </button>
        </div>
      </header>

      <LegacyRibbon
        simulating={clientSimActive}
        testPlaybackDisabled={bunnyAssetWindow}
        onPlay={() => setClientSimActive(true)}
        onStop={() => setClientSimActive(false)}
      />

      <div className={styles.workspaceGutter} aria-hidden />

      <div className={styles.panels} data-node-id="3841:115136">
        {clientSimActive ? (
          <section className={styles.center} data-node-id="3841:115137">
            <div className={styles.centerWorkspace}>
              {bunnyAssetWindow ? (
                <BunnyWorkspace
                  clientSim
                  simViewportFocus={simViewportFocus}
                  onSimViewportFocusChange={setSimViewportFocus}
                  mainDocumentEditorTab={mainDocumentEditorTab}
                  onMainDocumentEditorTabChange={setMainDocumentEditorTab}
                  playModeHasStroke={playModeHasStroke}
                  playModeHasFocusStroke={playModeHasFocusStroke}
                  playModeSelectionTint={playModeSelectionTint}
                  playModeFullTint={playModeFullTint}
                  tintActive={tintActive}
                  focusHoleRef={focusHoleRef}
                  playModeSplitView={playModeSplitView}
                  editDatamodelShowStroke={editDatamodelShowStroke}
                  editDocumentFocus={editWorkspaceDocumentFocus}
                  onEditDocumentFocusChange={setEditWorkspaceDocumentFocus}
                />
              ) : (
                <DroneRacerWorkspace
                  clientSim
                  showAssetInIsolation={showAssetInIsolation}
                  simViewportFocus={simViewportFocus}
                  onSimViewportFocusChange={setSimViewportFocus}
                  mainDocumentEditorTab={mainDocumentEditorTab}
                  onMainDocumentEditorTabChange={setMainDocumentEditorTab}
                  splitClientDocumentTab={splitClientDocumentTab}
                  splitServerDocumentTab={splitServerDocumentTab}
                  onSplitClientDocumentTabChange={setSplitClientDocumentTab}
                  onSplitServerDocumentTabChange={setSplitServerDocumentTab}
                  scriptATabOpen={scriptATabOpen}
                  scriptBTabOpen={scriptBTabOpen}
                  clientScriptTabOpen={clientScriptTabOpen}
                  serverScriptTabOpen={serverScriptTabOpen}
                  isolationTabOpen={isolationTabOpen}
                  hoverScriptTabOpen={hoverScriptTabOpen}
                  onScriptATabOpenChange={setScriptATabOpen}
                  onScriptBTabOpenChange={setScriptBTabOpen}
                  onClientScriptTabOpenChange={setClientScriptTabOpen}
                  onServerScriptTabOpenChange={setServerScriptTabOpen}
                  onIsolationTabOpenChange={setIsolationTabOpen}
                  onHoverScriptTabOpenChange={setHoverScriptTabOpen}
                  playModeHasStroke={playModeHasStroke}
                  playModeHasFocusStroke={playModeHasFocusStroke}
                  playModeSelectionTint={playModeSelectionTint}
                  playModeFullTint={playModeFullTint}
                  tintActive={tintActive}
                  focusHoleRef={focusHoleRef}
                  playModeSplitView={playModeSplitView}
                  editDatamodelShowStroke={editDatamodelShowStroke}
                  editDocumentFocus={editWorkspaceDocumentFocus}
                  onEditDocumentFocusChange={setEditWorkspaceDocumentFocus}
                />
              )}
            </div>
            {!bunnyAssetWindow ? (
              <>
                <div className={styles.centerDockGutter} aria-hidden />
                <AssetManagerPanel />
              </>
            ) : null}
          </section>
        ) : (
          <section className={styles.center} data-node-id="3841:115137">
            <div className={styles.centerWorkspace}>
              {bunnyAssetWindow ? (
                <BunnyWorkspace
                  editDatamodelShowStroke={editDatamodelShowStroke}
                  editDocumentFocus={editWorkspaceDocumentFocus}
                  onEditDocumentFocusChange={setEditWorkspaceDocumentFocus}
                  mainDocumentEditorTab={mainDocumentEditorTab}
                  onMainDocumentEditorTabChange={setMainDocumentEditorTab}
                />
              ) : (
                <DroneRacerWorkspace
                  showAssetInIsolation={showAssetInIsolation}
                  editDatamodelShowStroke={editDatamodelShowStroke}
                  editDocumentFocus={editWorkspaceDocumentFocus}
                  onEditDocumentFocusChange={setEditWorkspaceDocumentFocus}
                  mainDocumentEditorTab={mainDocumentEditorTab}
                  onMainDocumentEditorTabChange={setMainDocumentEditorTab}
                  scriptATabOpen={scriptATabOpen}
                  scriptBTabOpen={scriptBTabOpen}
                  clientScriptTabOpen={clientScriptTabOpen}
                  serverScriptTabOpen={serverScriptTabOpen}
                  isolationTabOpen={isolationTabOpen}
                  hoverScriptTabOpen={hoverScriptTabOpen}
                  onScriptATabOpenChange={setScriptATabOpen}
                  onScriptBTabOpenChange={setScriptBTabOpen}
                  onClientScriptTabOpenChange={setClientScriptTabOpen}
                  onServerScriptTabOpenChange={setServerScriptTabOpen}
                  onIsolationTabOpenChange={setIsolationTabOpen}
                  onHoverScriptTabOpenChange={setHoverScriptTabOpen}
                />
              )}
            </div>
            {!bunnyAssetWindow ? (
              <>
                <div className={styles.centerDockGutter} aria-hidden />
                <AssetManagerPanel />
              </>
            ) : null}
          </section>
        )}

        <aside className={styles.right} data-node-id="3841:115190">
          <div className={styles.panel} data-node-id="3841:115191">
            <PanelChrome
              title={
                clientSimActive && explorerFocusBadge
                  ? 'Explorer'
                  : clientSimActive &&
                      !(
                        focusedColumnScriptOpen &&
                        explorerWhileScriptFocus === 'drone-isolation'
                      )
                    ? explorerHeaderSimFocus === 'server'
                      ? 'Explorer (Server)'
                      : 'Explorer (Client)'
                    : 'Explorer'
              }
              assetVariant="explorer"
              titleAlign={panelChromeTitleAlign}
              explorerFocusBadgeTarget={
                clientSimActive &&
                explorerFocusBadge &&
                !(showAssetInIsolation && editWorkspaceDocumentFocus !== 'main') &&
                !(focusedColumnScriptOpen && explorerWhileScriptFocus === 'drone-isolation')
                  ? explorerHeaderSimFocus
                  : null
              }
              explorerDocumentBadgeLabel={
                showAssetInIsolation && editWorkspaceDocumentFocus !== 'main'
                  ? DRONE_WORKSPACE_TAB_LABEL
                  : focusedColumnScriptOpen &&
                      explorerWhileScriptFocus === 'drone-isolation'
                    ? DRONE_WORKSPACE_TAB_LABEL
                    : null
              }
              explorerBadgeShowDot={
                !explorerFocusBadge || explorerBadgeShowIndicator
              }
            />
            <div className={styles.panelBody} data-node-id="3841:115193">
              <ExplorerTree
                clientSim={clientSimActive}
                bunnyFlatExplorer={bunnyAssetWindow}
                explorerWhileScriptFocus={explorerWhileScriptFocus}
                droneDocumentFocused={
                  showAssetInIsolation && editWorkspaceDocumentFocus !== 'main'
                }
                selectionTintActive={playModeSelectionTint}
                simViewportFocus={explorerHeaderSimFocus}
                simSelectedRowId={simExplorerSelectedRowId}
                onSimExplorerSelectRow={onSimExplorerSelectRow}
              />
            </div>
          </div>
          <div className={styles.panel} data-node-id="3841:115196">
            <PanelChrome title="Properties" assetVariant="properties" titleAlign={panelChromeTitleAlign} />
            <div className={styles.panelBody} data-node-id="3841:115198">
              <PropertiesPanel empty={clientSimActive} />
            </div>
          </div>
          <div className={`${styles.panel} ${styles.panelInteraction}`}>
            <PanelChrome
              title="Prototype settings"
              assetVariant="properties"
              titleAlign={panelChromeTitleAlign}
            />
            <div className={styles.panelBodyInteraction}>
              <InteractionSettingsPanel
                hasStroke={playModeHasStroke}
                onHasStrokeChange={setPlayModeHasStroke}
                hasFocusStroke={playModeHasFocusStroke}
                onHasFocusStrokeChange={setPlayModeHasFocusStroke}
                explorerFocusBadge={explorerFocusBadge}
                onExplorerFocusBadgeChange={setExplorerFocusBadge}
                explorerBadgeShowIndicator={explorerBadgeShowIndicator}
                onExplorerBadgeShowIndicatorChange={setExplorerBadgeShowIndicator}
                fullTint={playModeFullTint}
                onFullTintChange={setPlayModeFullTint}
                selectionTint={playModeSelectionTint}
                onSelectionTintChange={setPlayModeSelectionTint}
                splitView={playModeSplitView}
                onSplitViewChange={setPlayModeSplitView}
                showAssetInIsolation={showAssetInIsolation}
                onShowAssetInIsolationChange={setShowAssetInIsolation}
                editDatamodelShowStroke={editDatamodelShowStroke}
                onEditDatamodelShowStrokeChange={setEditDatamodelShowStroke}
                panelTitlesLeftAligned={panelTitlesLeftAligned}
                onPanelTitlesLeftAlignedChange={setPanelTitlesLeftAligned}
                bunnyAssetWindow={bunnyAssetWindow}
                onOpenAssetWindow={bunnyAssetWindow ? undefined : onOpenAssetWindow}
                onOpenClientScript={bunnyAssetWindow ? undefined : openClientScriptTab}
                onOpenServerScript={bunnyAssetWindow ? undefined : openServerScriptTab}
                testingMode={clientSimActive}
                onReset={bunnyAssetWindow ? undefined : handlePrototypeReset}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className={styles.workspaceGutter} aria-hidden />

      <div className={styles.commandBar} data-node-id="3841:115202">
        <div className={styles.cmdLeft}>
          <div className={styles.cmdDiamond} aria-hidden>
            <img src={publicAssetUrl('assets/cmd-diamond.svg')} alt="" />
          </div>
          <span className={styles.cmdPlaceholder}>
            Type a command or use Cmd+↑↓ for history
          </span>
        </div>
        <div className={styles.cmdRight}>
          <div className={styles.cmdToolbar}>
            <button type="button" className={styles.cmdTbBtn} aria-label="Bookmarks">
              <img src={publicAssetUrl('assets/cmd-bookmark.svg')} alt="" />
            </button>
            <button
              type="button"
              className={`${styles.cmdTbBtn} ${styles.cmdTbBtnActive}`}
              aria-label="History"
            >
              <img src={publicAssetUrl('assets/cmd-history.svg')} alt="" />
            </button>
            <button type="button" className={styles.cmdRun} disabled>
              Run ⌘↵
            </button>
            <button type="button" className={styles.cmdSelect}>
              Local
              <span className={styles.cmdSelectChevron}>▾</span>
            </button>
          </div>
        </div>
      </div>

      <footer className={styles.footer} data-node-id="3841:115204">
        <div className={styles.footerActions}>
          <button
            type="button"
            className={`${styles.footerBtn} ${footerQuestionsOpen ? styles.footerBtnActive : ''}`}
            aria-label="Questions"
            aria-expanded={footerQuestionsOpen}
            aria-controls="footer-questions-overlay"
            onClick={() => setFooterQuestionsOpen((o) => !o)}
          >
            <CircleHelp size={16} strokeWidth={1.75} className={styles.footerBtnIcon} aria-hidden />
          </button>
          <button type="button" className={styles.footerBtn} aria-label="Recent">
            <img src={publicAssetUrl('assets/footer-recent.svg')} alt="" />
          </button>
        </div>
      </footer>
      {footerQuestionsOpen ? (
        <>
          <div
            className={styles.questionsOverlayBackdrop}
            aria-hidden
            onClick={() => setFooterQuestionsOpen(false)}
          />
          <div
            id="footer-questions-overlay"
            className={styles.questionsOverlayPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-questions-title"
          >
            <div className={styles.questionsOverlayHeader}>
              <h2 id="footer-questions-title" className={styles.questionsOverlayTitle}>
                Questions
              </h2>
              <button
                type="button"
                className={styles.questionsOverlayClose}
                aria-label="Close"
                onClick={() => setFooterQuestionsOpen(false)}
              >
                ×
              </button>
            </div>
            {FOOTER_QUESTIONS.length > 0 ? (
              <ul className={styles.questionsOverlayList}>
                {FOOTER_QUESTIONS.map((q, i) => (
                  <li key={i} className={styles.questionsOverlayItem}>
                    {q}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.questionsOverlayEmpty}>
                Add entries to <code className={styles.questionsOverlayCode}>FOOTER_QUESTIONS</code> in{' '}
                <code className={styles.questionsOverlayCode}>StudioWindowsOS.tsx</code>.
              </p>
            )}
          </div>
        </>
      ) : null}
      {tintActive ? (
        <div
          className={styles.simFullTintOverlay}
          style={{
            background:
              simViewportFocus === 'client'
                ? 'rgba(37, 99, 235, 0.05)'
                : 'rgba(22, 163, 74, 0.05)',
            clipPath: tintClipPath ?? 'none',
          }}
          aria-hidden
        />
      ) : null}
    </div>
  )
}
