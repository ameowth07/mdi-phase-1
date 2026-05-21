import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ComponentProps, Ref } from 'react'
import { Monitor, Server, SquareArrowOutUpRight } from 'lucide-react'
import ClientSim from './ClientSim'
import LegacyRibbon from './LegacyRibbon'
import ServerSim from './ServerSim'
import AssetManagerPanel from './AssetManagerPanel'
import OutputPanel, { type OutputLogEntry } from './OutputPanel'
import {
  CAMERA_ZOOM_SCRIPT_DOCUMENT,
  CLIENT_SCRIPT_EDIT_SOURCE,
  CLIENT_SCRIPT_TEST_COPY_SOURCE,
  DEFAULT_CLIENT_SCRIPT_DOCUMENT,
  PLAYER_SCRIPT_TAB_LABEL,
  PLAYER_SCRIPT_TAB_PATH,
  SERVER_SCRIPT_EDIT_SOURCE,
  SERVER_SCRIPT_TAB_LABEL,
  SERVER_SCRIPT_TAB_PATH,
  SERVER_SCRIPT_TEST_COPY_SOURCE,
  type ClientScriptDocument,
} from './clientScripts'
import { resolveDatamodelTintFocus, type ExplorerRetentionKind } from './datamodelTint'
import InteractionSettingsPanel from './InteractionSettingsPanel'
import StudioFooter from './StudioFooter'
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

/** Faux children under Drone in the asset-isolation Explorer tree. */
const DRONE_ISOLATION_EXPLORER_CHILDREN = [
  { id: 'drone-isolation-hover-script', label: 'HoverScript' },
  { id: 'drone-isolation-frame', label: 'Frame' },
  { id: 'drone-isolation-rotor-a', label: 'RotorA' },
  { id: 'drone-isolation-rotor-b', label: 'RotorB' },
  { id: 'drone-isolation-sensor', label: 'Sensor' },
] as const

const DRONE_RACER_EXPLORER_ROWS = [
  'workspace',
  'camera',
  'terrain',
  'billboard',
  'shop',
  'shopkeeper',
  'counter',
  'shelves',
  'register',
  'door',
  'players',
  'lighting',
  'materialservice',
] as const

const FLAT_SIM_EXPLORER_ROWS = ['workspace', 'players', 'lighting', 'materialservice'] as const

const DRONE_ISOLATION_EXPLORER_ROWS = [
  DRONE_ISOLATION_EXPLORER_ROW_ID,
  ...DRONE_ISOLATION_EXPLORER_CHILDREN.map((child) => child.id),
] as const

type ExplorerTreeKind = 'bunny' | 'droneIsolation' | 'flatSim' | 'droneRacerHierarchy'

function pickRandomExplorerRow<T extends string>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]!
}

function pickDistinctRandomExplorerRows(pool: readonly string[]): [string, string] {
  const first = pickRandomExplorerRow(pool)
  if (pool.length === 1) return [first, first]
  let second = pickRandomExplorerRow(pool)
  while (second === first) second = pickRandomExplorerRow(pool)
  return [first, second]
}

const HOVER_SCRIPT_TAB_LABEL = 'HoverScript' as const

const INITIAL_OUTPUT_LOG: OutputLogEntry[] = [
  {
    id: 'seed-configured',
    timestamp: '23:31:31.708',
    message: 'Plugin has already been configured',
    variant: 'default',
  },
]

function formatOutputTimestamp(date = new Date()): string {
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const millis = String(date.getMilliseconds()).padStart(3, '0')
  return `${hours}:${minutes}:${seconds}.${millis}`
}

/** Tab hover — file path line (Figma Tooltip 3975:51893 / 3975:51736). */
const TAB_PATH_DRONE_RACER_DOCUMENT = 'Drone Racer/Drone Racer'
const TAB_PATH_BUNNY_DOCUMENT = 'Bunny/Bunny'
const TAB_PATH_DRONE_RACER_SCRIPT = 'Drone Racer/Script'
const TAB_PATH_DRONE_RACER_CLIENT = 'Drone Racer (Client)'
const TAB_PATH_DRONE_RACER_SERVER = 'Drone Racer (Server)'
const TAB_PATH_DRONE_ASSET = 'Drone/Drone'
const TAB_PATH_DRONE_HOVERSCRIPT = 'Drone/HoverScript'

/** Main Drone Racer document — first “Script” tab body. */
const DRONE_RACER_MAIN_SCRIPT_PLACEHOLDER = 'this is a Drone Racer script' as const
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
  [DRONE_ISOLATION_EXPLORER_ROW_ID]: null,
  'drone-isolation-hover-script': DRONE_ISOLATION_EXPLORER_ROW_ID,
  'drone-isolation-frame': DRONE_ISOLATION_EXPLORER_ROW_ID,
  'drone-isolation-rotor-a': DRONE_ISOLATION_EXPLORER_ROW_ID,
  'drone-isolation-rotor-b': DRONE_ISOLATION_EXPLORER_ROW_ID,
  'drone-isolation-sensor': DRONE_ISOLATION_EXPLORER_ROW_ID,
}

/** Explorer row → Properties breadcrumb label and Roblox class name (prototype default: Model). */
const EXPLORER_ROW_META: Record<string, { label: string; className: string }> = {
  workspace: { label: 'Workspace', className: 'Model' },
  camera: { label: 'Camera', className: 'Model' },
  terrain: { label: 'Terrain', className: 'Model' },
  billboard: { label: 'Billboard', className: 'Model' },
  shop: { label: 'Shop', className: 'Model' },
  shopkeeper: { label: 'Shopkeeper', className: 'Model' },
  counter: { label: 'Counter', className: 'Model' },
  shelves: { label: 'Shelves', className: 'Model' },
  register: { label: 'Register', className: 'Model' },
  door: { label: 'Door', className: 'Model' },
  players: { label: 'Players', className: 'Model' },
  lighting: { label: 'Lighting', className: 'Model' },
  materialservice: { label: 'MaterialService', className: 'Model' },
  bunnyExplorerRow: { label: 'Bunny', className: 'Model' },
  [DRONE_ISOLATION_EXPLORER_ROW_ID]: { label: DRONE_WORKSPACE_TAB_LABEL, className: 'Model' },
  'drone-isolation-hover-script': { label: 'HoverScript', className: 'Script' },
  'drone-isolation-frame': { label: 'Frame', className: 'Model' },
  'drone-isolation-rotor-a': { label: 'RotorA', className: 'Model' },
  'drone-isolation-rotor-b': { label: 'RotorB', className: 'Model' },
  'drone-isolation-sensor': { label: 'Sensor', className: 'Model' },
}

function explorerRowPropertiesBreadcrumb(rowId: string): string {
  const meta = EXPLORER_ROW_META[rowId] ?? {
    label: rowId.charAt(0).toUpperCase() + rowId.slice(1),
    className: 'Model',
  }
  return `${meta.className} "${meta.label}"`
}

function formatPropertiesPanelTitle(
  rowId: string,
  contextSegment: string | null,
): string {
  const rowPart = explorerRowPropertiesBreadcrumb(rowId)
  return contextSegment ? `Properties / ${contextSegment} / ${rowPart}` : `Properties / ${rowPart}`
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

function isDroneRacerMainScriptTab(tab: MainDocumentEditorTab): boolean {
  return tab === 'scriptA' || tab === 'scriptB'
}

/** Which datamodel a script tab belongs to (Drone Racer edit scripts vs Client/Server sim scripts). */
type ScriptDatamodelFocus = SimViewportFocus | 'drone'

function scriptTabDatamodelFocus(tab: MainDocumentEditorTab): ScriptDatamodelFocus {
  if (tab === 'serverScript') return 'server'
  if (tab === 'clientScript') return 'client'
  return 'drone'
}

function resolveViewportDatamodelFocus(
  activeScriptTab: MainDocumentEditorTab | null,
  simFocus: SimViewportFocus,
  splitColumn?: SimViewportFocus,
  splitMode?: boolean,
): ScriptDatamodelFocus {
  if (activeScriptTab) return scriptTabDatamodelFocus(activeScriptTab)
  if (splitMode && splitColumn != null) {
    return simFocus === splitColumn ? splitColumn : 'drone'
  }
  return simFocus
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

/** Edit-mode ModuleScript tab — document icon (4× asset, shown at 16×16). */
function TabScriptEditIcon() {
  return (
    <img
      src={publicAssetUrl('assets/tab-script-edit.png')}
      alt=""
      className={`${styles.tabDiamond} ${styles.tabScriptEditIcon}`}
      aria-hidden
    />
  )
}

/** Edit-mode LocalScript (client copy) — blue document + monitor (4× asset, 16×16 in tab). */
function TabLocalScriptEditIcon() {
  return (
    <img
      src={publicAssetUrl('assets/tab-localscript-edit.png')}
      alt=""
      className={`${styles.tabDiamond} ${styles.tabScriptEditIcon}`}
      aria-hidden
    />
  )
}

/** Drone Racer workspace tab — globe icon (4× asset, 16×16 in tab). */
function TabDroneRacerWorkspaceIcon() {
  return (
    <img
      src={publicAssetUrl('assets/tab-workspace-drone-racer.png')}
      alt=""
      className={`${styles.tabDiamond} ${styles.tabScriptEditIcon}`}
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
  /** Edit / Bunny original datamodel pill (light gray dot). */
  explorerOriginalDmBadgeLabel?: string | null
  /** Original DM badge dot — follows “Show indicator in badge”. */
  explorerOriginalDmBadgeShowDot?: boolean
}

function ExplorerDocumentBadge({
  label,
  showIndicator,
  dotVariant = 'drone',
}: {
  label: string
  showIndicator: boolean
  dotVariant?: 'drone' | 'original'
}) {
  const dotClass =
    dotVariant === 'original'
      ? styles.explorerFocusBadgeDotOriginal
      : styles.explorerFocusBadgeDotDrone

  return (
    <span
      className={styles.explorerFocusBadge}
      data-name="ExplorerDocumentBadge"
      data-node-id="3856:139987-edit-doc"
    >
      <span className={styles.explorerFocusBadgePlate} aria-hidden />
      <span className={styles.explorerFocusBadgeRow}>
        {showIndicator ? (
          <span className={`${styles.explorerFocusBadgeDot} ${dotClass}`} aria-hidden />
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
  explorerOriginalDmBadgeLabel = null,
  explorerOriginalDmBadgeShowDot = true,
}: PanelChromeProps) {
  const close =
    assetVariant === 'explorer'
      ? publicAssetUrl('assets/panel-close.svg')
      : publicAssetUrl('assets/panel-close-x-2.svg')

  const showSimExplorerBadge =
    assetVariant === 'explorer' && explorerFocusBadgeTarget != null
  const showIsolationExplorerBadge =
    assetVariant === 'explorer' &&
    !!explorerDocumentBadgeLabel &&
    !showSimExplorerBadge
  const showOriginalDmExplorerBadge =
    assetVariant === 'explorer' &&
    !!explorerOriginalDmBadgeLabel &&
    !showSimExplorerBadge &&
    !showIsolationExplorerBadge

  const showExplorerBadge =
    showSimExplorerBadge || showIsolationExplorerBadge || showOriginalDmExplorerBadge

  const explorerAria = showSimExplorerBadge
    ? `Explorer, ${
        explorerFocusBadgeTarget === 'client' ? 'Client' : 'Server'
      } focused`
    : showIsolationExplorerBadge
      ? `Explorer, ${explorerDocumentBadgeLabel} focused`
      : showOriginalDmExplorerBadge
        ? `Explorer, ${explorerOriginalDmBadgeLabel} focused`
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
          ) : showIsolationExplorerBadge ? (
            <ExplorerDocumentBadge
              label={explorerDocumentBadgeLabel!}
              showIndicator={explorerBadgeShowDot}
              dotVariant="drone"
            />
          ) : (
            <ExplorerDocumentBadge
              label={explorerOriginalDmBadgeLabel!}
              showIndicator={explorerOriginalDmBadgeShowDot}
              dotVariant="original"
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
  hideAssetTinting,
  selectionTintActive,
  simViewportFocus,
  simSelectedRowId,
  onSimExplorerSelectRow,
  editSelectedRowId,
  onEditSelectedRowIdChange,
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
  /** Edit datamodel UI: suppress Drone/asset Explorer row tint (Client/Server unchanged). */
  hideAssetTinting: boolean
  /** Testing UI: Selection tint — Explorer `data-explorer-tint` row hues (not viewport). */
  selectionTintActive: boolean
  simViewportFocus: SimViewportFocus
  /** Sim: selected Explorer row for the current sim focus (client vs server); null until user picks. */
  simSelectedRowId: string | null
  onSimExplorerSelectRow: (rowId: string) => void
  /** Edit mode: selected Explorer row (lifted for Properties breadcrumb). */
  editSelectedRowId: string | null
  onEditSelectedRowIdChange: (rowId: string) => void
}) {
  const explorerTintFocus = useMemo(
    () =>
      resolveDatamodelTintFocus(
        selectionTintActive,
        clientSim,
        simViewportFocus,
        explorerWhileScriptFocus,
        droneDocumentFocused,
        hideAssetTinting,
      ),
    [
      selectionTintActive,
      clientSim,
      simViewportFocus,
      explorerWhileScriptFocus,
      droneDocumentFocused,
      hideAssetTinting,
    ],
  )

  const explorerTreeProps = explorerTintFocus
    ? ({ 'data-explorer-tint': explorerTintFocus } as const)
    : undefined

  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
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
    const selected = editSelectedRowId !== null && editSelectedRowId === rowId
    const childOfSelected =
      editSelectedRowId !== null && EXPLORER_EDIT_PARENT[rowId] === editSelectedRowId
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
    onClick: () => onEditSelectedRowIdChange(rowId),
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

  if (bunnyFlatExplorer) {
    const rowId = 'bunnyExplorerRow' as const
    return (
      <div className={styles.tree} {...explorerTreeProps}>
        <div
          className={editRowClass(rowId)}
          onMouseEnter={() => setHoveredRowId(rowId)}
          onMouseLeave={() => setHoveredRowId(null)}
          onClick={() => onEditSelectedRowIdChange(rowId)}
        >
          <TreeChevron mode="spacer" />
          <TabDiamond />
          <span className={styles.treeLabel}>Bunny</span>
        </div>
      </div>
    )
  }

  if (showDroneIsolationExplorer) {
    const bindDroneIsolationRow = (rowId: string) => ({
      className: editRowClass(rowId),
      onMouseEnter: () => setHoveredRowId(rowId),
      onMouseLeave: () => setHoveredRowId(null),
      onClick: () => onEditSelectedRowIdChange(rowId),
    })

    return (
      <div className={styles.tree} {...explorerTreeProps}>
        <div {...bindDroneIsolationRow(DRONE_ISOLATION_EXPLORER_ROW_ID)}>
          <TreeChevron mode="open" />
          <img
            src={publicAssetUrl('assets/Model.png')}
            alt=""
            className={`${styles.treeExplorerModelIcon} ${styles.bitmapIconCrisp}`}
            aria-hidden
          />
          <span className={styles.treeLabel}>{DRONE_WORKSPACE_TAB_LABEL}</span>
        </div>
        <div className={`${styles.treeNested} ${styles.guide}`}>
          {DRONE_ISOLATION_EXPLORER_CHILDREN.map(({ id, label }) => (
            <div key={id} {...bindDroneIsolationRow(id)} style={{ paddingLeft: 20 }}>
              <TreeChevron mode="spacer" />
              <span className={styles.treeIcon}>◇</span>
              <span className={styles.treeLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (
    clientSim &&
    (explorerWhileScriptFocus === 'edit-drone' ||
      explorerWhileScriptFocus === 'sim-client' ||
      explorerWhileScriptFocus === 'sim-server')
  ) {
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
  /** Test mode: semantic inset — brand cyan/green on Client/Server; neutral ring on Drone Racer scripts. */
  playModeHasStroke?: boolean
  /** Test mode: white inset focus ring (Testing UI: Has focus stroke). */
  playModeHasFocusStroke?: boolean
  /** Test mode: full-frame tint hole punch (`clientSimActive && playModeFullTint` at shell). */
  tintActive?: boolean
  focusHoleRef?: Ref<HTMLDivElement | null>
  /** Test mode: Client and Server side by side (Testing UI: Split view). */
  playModeSplitView?: boolean
  /** Client Script tab label, path tooltip, and editor body. */
  clientScriptDocument?: ClientScriptDocument
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
  tintActive,
  focusHoleRef,
  playModeSplitView,
  clientScriptDocument = DEFAULT_CLIENT_SCRIPT_DOCUMENT,
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

  /** Keep sim focus (footer, Explorer badge) aligned with Client/Server script tabs. */
  useEffect(() => {
    if (!clientSim || !onSimViewportFocusChange) return
    if (usePerColumnDocumentTabs) {
      if (clientDocumentScriptOpen) {
        const dm = scriptTabDatamodelFocus(clientDocumentTab)
        if (dm === 'client' || dm === 'server') onSimViewportFocusChange(dm)
      } else if (serverDocumentScriptOpen) {
        const dm = scriptTabDatamodelFocus(serverDocumentTab)
        if (dm === 'client' || dm === 'server') onSimViewportFocusChange(dm)
      }
      return
    }
    if (!mainDocumentScriptOpen) return
    const dm = scriptTabDatamodelFocus(mainDocumentEditorTab)
    if (dm === 'client' || dm === 'server') onSimViewportFocusChange(dm)
  }, [
    clientSim,
    usePerColumnDocumentTabs,
    mainDocumentEditorTab,
    mainDocumentScriptOpen,
    clientDocumentTab,
    clientDocumentScriptOpen,
    serverDocumentTab,
    serverDocumentScriptOpen,
    onSimViewportFocusChange,
  ])

  const scriptTabsOpen = useMemo(
    () => ({
      scriptA: scriptATabOpen,
      scriptB: scriptBTabOpen,
      clientScript: clientScriptTabOpen,
      serverScript: serverScriptTabOpen,
    }),
    [scriptATabOpen, scriptBTabOpen, clientScriptTabOpen, serverScriptTabOpen],
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

  /** Split workspace: inactive column — crop baked UI frame so only the focused column shows inset ring. */
  const mainInactiveInSplit =
    !!showAssetInIsolation && editDocumentFocus !== 'main'

  const strokeOn = !!playModeHasStroke
  const focusStrokeOn = !!playModeHasFocusStroke
  const simTintHoleActive = !!tintActive
  /** Isolation / HoverScript column ring — edit always; test only when a stroke setting is on. */
  const showIsolationColumnChromeRing =
    isolationColumnEditInsetRing && (!clientSim || strokeOn || focusStrokeOn)

  /**
   * Test + Show asset in isolation: Client/Server sim chrome (stroke, rings, tint hole) only while
   * the sim document strip has focus — not when Drone isolation is the active document.
   */
  const simDocumentChromeActive =
    !clientSim || !showAssetInIsolation || editDocumentFocus === 'main'

  /** Test: datamodel stroke overlay on main viewport (per active script tab datamodel). */
  const showEditDatamodelStrokeOnMainViewport =
    !!clientSim && simDocumentChromeActive && !!editDatamodelShowStroke

  /**
   * Play focus inset (white): per column in split view; combined strip uses active script tab datamodel.
   */
  const clientFocusChromeRing =
    !!clientSim &&
    simDocumentChromeActive &&
    focusStrokeOn &&
    (usePerColumnDocumentTabs
      ? splitClientPrimaryTabActive
        ? simFocus === 'client'
        : clientDocumentTab === 'clientScript' ||
          isDroneRacerMainScriptTab(clientDocumentTab)
      : mainDocumentEditorTab === 'clientScript' ||
        isDroneRacerMainScriptTab(mainDocumentEditorTab) ||
        (simFocus === 'client' && !mainDocumentScriptOpen))

  const serverFocusChromeRing =
    !!clientSim &&
    simDocumentChromeActive &&
    focusStrokeOn &&
    (usePerColumnDocumentTabs
      ? splitServerPrimaryTabActive
        ? simFocus === 'server'
        : serverDocumentTab === 'serverScript'
      : mainDocumentEditorTab === 'serverScript' ||
        (simFocus === 'server' && !mainDocumentScriptOpen))

  /** Split view: brand semantic stroke on column wrap (Script tabs use viewport class inside). */
  const splitClientBrandSemanticStrokeClass =
    usePerColumnDocumentTabs &&
    strokeOn &&
    !focusStrokeOn &&
    simDocumentChromeActive
      ? clientDocumentTab === 'clientScript'
        ? styles.viewportClientFocused
        : splitClientPrimaryTabActive && simFocus === 'client'
          ? styles.viewportClientFocused
          : null
      : null

  const splitServerBrandSemanticStrokeClass =
    usePerColumnDocumentTabs &&
    strokeOn &&
    !focusStrokeOn &&
    simDocumentChromeActive
      ? serverDocumentTab === 'serverScript'
        ? styles.serverViewportFocused
        : splitServerPrimaryTabActive && simFocus === 'server'
          ? styles.serverViewportFocused
          : null
      : null

  const clientElevateForSimTint =
    !!clientSim && simDocumentChromeActive && simTintHoleActive && simFocus === 'client'
  const serverElevateForSimTint =
    !!clientSim && simDocumentChromeActive && simTintHoleActive && simFocus === 'server'

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
    if (tab === 'clientScript') {
      if (
        clientScriptDocument.tabLabel === PLAYER_SCRIPT_TAB_LABEL &&
        clientScriptDocument.tabPath === PLAYER_SCRIPT_TAB_PATH
      ) {
        return clientSim ? CLIENT_SCRIPT_TEST_COPY_SOURCE : CLIENT_SCRIPT_EDIT_SOURCE
      }
      return clientScriptDocument.source
    }
    if (tab === 'serverScript') {
      return clientSim ? SERVER_SCRIPT_TEST_COPY_SOURCE : SERVER_SCRIPT_EDIT_SOURCE
    }
    return DRONE_RACER_MAIN_SCRIPT_PLACEHOLDER
  }

  const renderDocumentScriptBody = (activeScriptTab: MainDocumentEditorTab) => (
    <div
      className={styles.mainDocumentScriptFill}
      data-name="DroneRacerMainScript"
      onPointerDown={(e) => {
        e.stopPropagation()
        if (clientSim && activeScriptTab === 'serverScript') {
          onSimViewportFocusChange?.('server')
        } else if (clientSim && activeScriptTab === 'clientScript') {
          onSimViewportFocusChange?.('client')
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
    /** Split view: which Client/Server column this viewport belongs to (stroke only when focused). */
    splitColumn?: SimViewportFocus,
  ) => {
    const showScript = activeScriptTab != null
    const datamodelFocus = resolveViewportDatamodelFocus(
      activeScriptTab,
      simFocus,
      splitColumn,
      useSplitColumnFocusChrome,
    )

    const viewportSemanticStrokeClass =
      showClientSimChrome && strokeOn && !focusStrokeOn
        ? datamodelFocus === 'server'
          ? styles.serverViewportFocused
          : datamodelFocus === 'client'
            ? styles.viewportClientFocused
            : null
        : null

    /** Drone Racer Script tabs — neutral inset ring is the semantic stroke (not Client/Server brand hues). */
    const droneScriptSemanticStrokeRing =
      showClientSimChrome &&
      strokeOn &&
      !focusStrokeOn &&
      activeScriptTab != null &&
      datamodelFocus === 'drone'

    const viewportWhiteFocusStrokeRing =
      showClientSimChrome &&
      focusStrokeOn &&
      !useSplitColumnFocusChrome &&
      (datamodelFocus === 'client' ||
        datamodelFocus === 'server' ||
        datamodelFocus === 'drone')

    const viewportClass = [
      styles.viewport,
      viewportSemanticStrokeClass,
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
        {mainEditInsetRing ||
        (bunnyAssetWindow && !clientSim && bunnyEditViewportFocused) ? (
          <div className={styles.editWorkspaceInsetRing} aria-hidden />
        ) : null}
        {showClientSimChrome &&
        showEditDatamodelStrokeOnMainViewport &&
        datamodelFocus === 'client' ? (
          <div className={styles.simDatamodelStrokeOverlay} aria-hidden />
        ) : null}
        {showClientSimChrome &&
        showEditDatamodelStrokeOnMainViewport &&
        datamodelFocus === 'server' ? (
          <div className={styles.serverSimDatamodelStrokeOverlay} aria-hidden />
        ) : null}
        {droneScriptSemanticStrokeRing || viewportWhiteFocusStrokeRing ? (
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
        showServerSimChrome && strokeOn && !focusStrokeOn && simFocus === 'server'
          ? styles.serverViewportFocused
          : null,
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
  ) => {
    const selectDroneRacerScriptTab = (tab: 'scriptA' | 'scriptB') => {
      onEditDocumentFocusChange('main')
      onTabChange(tab)
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
          selectDroneRacerScriptTab('scriptA')
        }}
        onClick={(e) => {
          e.stopPropagation()
          selectDroneRacerScriptTab('scriptA')
        }}
      >
        <TabScriptEditIcon />
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
          selectDroneRacerScriptTab('scriptB')
        }}
        onClick={(e) => {
          e.stopPropagation()
          selectDroneRacerScriptTab('scriptB')
        }}
      >
        <TabScriptEditIcon />
        <span>Script</span>
        <TabCloseButton onClose={() => onCloseScriptTab('scriptB')} />
      </TabWithPathTooltip>
      ) : null}
      {extraTabs?.clientScript ? (
        <TabWithPathTooltip
          path={clientScriptDocument.tabPath}
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
          {clientSim ? <TabClientSimDocumentIcon /> : <TabLocalScriptEditIcon />}
          <span>{clientScriptDocument.tabLabel}</span>
          <TabCloseButton onClose={() => onCloseScriptTab('clientScript')} />
        </TabWithPathTooltip>
      ) : null}
      {extraTabs?.serverScript ? (
        <TabWithPathTooltip
          path={SERVER_SCRIPT_TAB_PATH}
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
          {clientSim ? (
            <Server
              size={12}
              strokeWidth={1.5}
              className={`${styles.tabDiamond} ${styles.tabDiamondBrand}`}
              color="#0c9b5a"
              aria-hidden
            />
          ) : (
            <TabScriptEditIcon />
          )}
          <span>{SERVER_SCRIPT_TAB_LABEL}</span>
          <TabCloseButton onClose={() => onCloseScriptTab('serverScript')} />
        </TabWithPathTooltip>
      ) : null}
    </>
    )
  }

  const combinedExtraScriptTabs = {
    clientScript: clientScriptTabOpen,
    serverScript: serverScriptTabOpen,
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
        {showIsolationColumnChromeRing ? (
          <div className={styles.editWorkspaceInsetRing} aria-hidden />
        ) : null}
      </div>
    </aside>
  )

  /** Single tabbed Client/Server + Script strip: Script lives in client viewport; Server sim is server viewport. */
  const simTabbedBodyViewport =
    mainDocumentScriptOpen || simFocus === 'client'
      ? renderMainViewport(
          simDocumentChromeActive,
          mainDocumentScriptOpen ? mainDocumentEditorTab : null,
        )
      : renderServerTestViewport(simDocumentChromeActive)

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
                className={[styles.simSplitClientWrap, splitClientBrandSemanticStrokeClass]
                  .filter(Boolean)
                  .join(' ')}
                onPointerDown={() => {
                  onSimViewportFocusChange?.('client')
                  onEditDocumentFocusChange('main')
                }}
              >
                {splitClientFocusChrome}
                <div className={styles.simTabbedBody}>
                  {renderMainViewport(
                    simDocumentChromeActive,
                    clientDocumentScriptOpen ? clientDocumentTab : null,
                    'client',
                  )}
                </div>
              </div>
              <section
                className={[styles.simSplitServerWrap, splitServerBrandSemanticStrokeClass]
                  .filter(Boolean)
                  .join(' ')}
                aria-label="Server simulation view"
                onPointerDown={() => {
                  onSimViewportFocusChange?.('server')
                  onEditDocumentFocusChange('main')
                }}
              >
                {splitServerFocusChrome}
                <div className={styles.simTabbedBody}>
                  {serverDocumentScriptOpen
                    ? renderMainViewport(simDocumentChromeActive, serverDocumentTab, 'server')
                    : renderServerTestViewport(simDocumentChromeActive)}
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
              className={[styles.simSplitClientWrap, splitClientBrandSemanticStrokeClass]
                .filter(Boolean)
                .join(' ')}
              onPointerDown={() => {
                onSimViewportFocusChange?.('client')
                onEditDocumentFocusChange('main')
              }}
            >
              {splitClientFocusChrome}
              {simSplitClientTabRow}
              <div className={styles.simTabbedBody}>
                {renderMainViewport(
                    simDocumentChromeActive,
                    clientDocumentScriptOpen ? clientDocumentTab : null,
                    'client',
                  )}
              </div>
            </div>
            <section
              className={[styles.simSplitServerWrap, splitServerBrandSemanticStrokeClass]
                .filter(Boolean)
                .join(' ')}
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
                  ? renderMainViewport(simDocumentChromeActive, serverDocumentTab, 'server')
                  : renderServerTestViewport(simDocumentChromeActive)}
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
        {bunnyAssetWindow ? <TabDiamond /> : <TabDroneRacerWorkspaceIcon />}
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
  const [playModeHasStroke, setPlayModeHasStroke] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.playModeHasStroke,
  )
  /** Play mode: sim viewport focus ring matches edit Drone Racer / asset isolation white inset (Testing UI). */
  const [playModeHasFocusStroke, setPlayModeHasFocusStroke] = useState<boolean>(false)
  /** Explorer header: plain title only — no badges or title suffixes (Interaction settings). */
  const [explorerNoBadge, setExplorerNoBadge] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.explorerNoBadge,
  )
  /** Play mode: Explorer header pill for Client vs Server focus (Figma 3856:139983). */
  const [explorerFocusBadge, setExplorerFocusBadge] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.explorerFocusBadge,
  )
  /** Explorer badge pill: show Client/Server (or Drone) colored dot when focus badge is on. */
  const [explorerBadgeShowIndicator, setExplorerBadgeShowIndicator] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.explorerBadgeShowIndicator,
  )
  /** Explorer pill for edit / Bunny original datamodel (light gray dot). */
  const [explorerOriginalDmBadge, setExplorerOriginalDmBadge] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.explorerOriginalDmBadge,
  )
  const [explorerShowBreadcrumb, setExplorerShowBreadcrumb] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.explorerShowBreadcrumb,
  )
  /** Play mode: subtle full-frame tint by focused viewport (Interaction settings). */
  const [playModeFullTint, setPlayModeFullTint] = useState(false)
  /** Play mode: Explorer row hues by focused datamodel (Testing UI: Selection tint). */
  const [playModeSelectionTint, setPlayModeSelectionTint] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.playModeSelectionTint,
  )
  const [playModeFooterTint, setPlayModeFooterTint] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.playModeFooterTint,
  )
  /** Play mode: Client and Server as two columns (Testing UI: Split view). */
  const [playModeSplitView, setPlayModeSplitView] = useState(false)
  /** Interaction settings: asset isolation preview in viewport. */
  const [showAssetInIsolation, setShowAssetInIsolation] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.showAssetInIsolation,
  )
  /** Interaction settings: Edit datamodel UI — show stroke. */
  const [editDatamodelShowStroke, setEditDatamodelShowStroke] = useState(false)
  /** Edit datamodel UI: hide Drone/asset Explorer and footer tint. */
  const [hideAssetTinting, setHideAssetTinting] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.hideAssetTinting,
  )
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
  const [clientScriptDocument, setClientScriptDocument] = useState<ClientScriptDocument>(
    DEFAULT_CLIENT_SCRIPT_DOCUMENT,
  )

  const openCameraZoomScript = useCallback(() => {
    setClientScriptDocument(CAMERA_ZOOM_SCRIPT_DOCUMENT)
    setClientScriptTabOpen(true)
    if (clientSimActive && playModeSplitView) {
      setSplitClientDocumentTab('clientScript')
      setSimViewportFocus('client')
    } else {
      setMainDocumentEditorTab('clientScript')
    }
    setEditWorkspaceDocumentFocus('main')
  }, [clientSimActive, playModeSplitView])

  const openClientScriptTab = useCallback(() => {
    setClientScriptDocument(DEFAULT_CLIENT_SCRIPT_DOCUMENT)
    setClientScriptTabOpen(true)
    if (clientSimActive && playModeSplitView) {
      setSplitClientDocumentTab('clientScript')
      setSimViewportFocus('client')
    } else {
      setMainDocumentEditorTab('clientScript')
    }
    setEditWorkspaceDocumentFocus('main')
  }, [clientSimActive, playModeSplitView])

  /** Migrate stale client script tabs that still use the old "Script" label. */
  useEffect(() => {
    if (
      clientScriptTabOpen &&
      clientScriptDocument.tabLabel === 'Script' &&
      clientScriptDocument.tabPath === 'Drone Racer (Client)/Script'
    ) {
      setClientScriptDocument(DEFAULT_CLIENT_SCRIPT_DOCUMENT)
    }
  }, [clientScriptTabOpen, clientScriptDocument])

  const handleThrowError = useCallback(() => {
    setOutputPanelOpen(true)
    setOutputLogEntries((prev) => [
      ...prev,
      {
        id: `error-${Date.now()}`,
        timestamp: formatOutputTimestamp(),
        message: 'Error: Exception... - Line 4: CameraZoomScript',
        variant: 'error',
      },
    ])
  }, [])

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

  /**
   * Explorer chrome + tree — active Client/Server script tab even when sim viewport
   * focus lags (combined test strip) or the other column is selected (split view).
   */
  const explorerChromeDocumentTab = useMemo((): MainDocumentEditorTab => {
    if (clientSimActive && playModeSplitView) {
      if (splitClientDocumentTab === 'clientScript') return 'clientScript'
      if (splitServerDocumentTab === 'serverScript') return 'serverScript'
      return focusedColumnDocumentTab
    }
    if (clientSimActive && isScriptDocumentTab(mainDocumentEditorTab)) {
      return mainDocumentEditorTab
    }
    return focusedColumnDocumentTab
  }, [
    clientSimActive,
    playModeSplitView,
    splitClientDocumentTab,
    splitServerDocumentTab,
    mainDocumentEditorTab,
    focusedColumnDocumentTab,
  ])

  const explorerChromeScriptOpen = isScriptDocumentTab(explorerChromeDocumentTab)

  /** While a script tab is open, which Explorer datamodel tree to show (null = Drone Racer edit hierarchy). */
  const explorerWhileScriptFocus: ExplorerRetentionKind | null = useMemo(() => {
    if (showAssetInIsolation && editWorkspaceDocumentFocus !== 'main') {
      return 'drone-isolation'
    }

    if (!explorerChromeScriptOpen) return null

    if (isDroneRacerMainScriptTab(explorerChromeDocumentTab)) return null

    if (!clientSimActive) return null

    if (explorerChromeDocumentTab === 'clientScript') return 'sim-client'
    if (explorerChromeDocumentTab === 'serverScript') return 'sim-server'

    return simViewportFocus === 'server' ? 'sim-server' : 'sim-client'
  }, [
    clientSimActive,
    explorerChromeScriptOpen,
    explorerChromeDocumentTab,
    showAssetInIsolation,
    editWorkspaceDocumentFocus,
    simViewportFocus,
  ])

  const explorerSimFocusForTree: SimViewportFocus = useMemo(() => {
    if (explorerChromeDocumentTab === 'clientScript') return 'client'
    if (explorerChromeDocumentTab === 'serverScript') return 'server'
    return simViewportFocus
  }, [explorerChromeDocumentTab, simViewportFocus])

  const explorerShowsSimClientServerChrome =
    clientSimActive &&
    explorerChromeScriptOpen &&
    !isDroneRacerMainScriptTab(explorerChromeDocumentTab) &&
    explorerWhileScriptFocus !== 'drone-isolation'

  /** Test: Explorer Client/Server focus pill — sim viewport tabs and Client/Server script tabs. */
  const explorerShowsClientServerFocusBadge =
    clientSimActive &&
    !(showAssetInIsolation && editWorkspaceDocumentFocus !== 'main') &&
    (explorerShowsSimClientServerChrome ||
      (!explorerChromeScriptOpen && explorerChromeDocumentTab === 'droneRacer'))

  const explorerShowsDroneIsolationTree =
    (showAssetInIsolation && editWorkspaceDocumentFocus !== 'main') ||
    (!isDroneRacerMainScriptTab(explorerChromeDocumentTab) &&
      explorerChromeScriptOpen &&
      explorerWhileScriptFocus === 'drone-isolation')

  const explorerShowsOriginalDmTree =
    bunnyAssetWindow ||
    (!explorerShowsDroneIsolationTree &&
      !(
        clientSimActive &&
        (explorerWhileScriptFocus === 'sim-client' ||
          explorerWhileScriptFocus === 'sim-server')
      ))

  const explorerOriginalDmBadgeLabel =
    explorerOriginalDmBadge && explorerShowsOriginalDmTree
      ? bunnyAssetWindow
        ? 'Bunny'
        : 'Drone Racer'
      : null

  const explorerHeaderSimFocus: SimViewportFocus =
    explorerWhileScriptFocus === 'sim-server'
      ? 'server'
      : explorerWhileScriptFocus === 'sim-client'
        ? 'client'
        : simViewportFocus

  const explorerBreadcrumbSegment = useMemo(() => {
    if (bunnyAssetWindow) return 'Bunny'

    if (showAssetInIsolation && editWorkspaceDocumentFocus !== 'main') {
      return DRONE_WORKSPACE_TAB_LABEL
    }

    if (clientSimActive) {
      if (explorerChromeDocumentTab === 'clientScript') return 'Drone Racer / Client'
      if (explorerChromeDocumentTab === 'serverScript') return 'Drone Racer / Server'
      if (isDroneRacerMainScriptTab(explorerChromeDocumentTab)) return 'Drone Racer'
      return explorerHeaderSimFocus === 'server' ? 'Drone Racer / Server' : 'Drone Racer / Client'
    }

    if (isDroneRacerMainScriptTab(explorerChromeDocumentTab)) return 'Drone Racer'

    return 'Drone Racer'
  }, [
    bunnyAssetWindow,
    showAssetInIsolation,
    editWorkspaceDocumentFocus,
    clientSimActive,
    explorerChromeDocumentTab,
    explorerHeaderSimFocus,
  ])

  const explorerPanelTitle = explorerNoBadge
    ? 'Explorer'
    : explorerShowBreadcrumb && explorerBreadcrumbSegment
      ? `Explorer / ${explorerBreadcrumbSegment}`
      : clientSimActive && explorerFocusBadge
        ? 'Explorer'
        : explorerShowsClientServerFocusBadge
          ? explorerHeaderSimFocus === 'server'
            ? 'Explorer (Server)'
            : 'Explorer (Client)'
          : 'Explorer'

  const footerDatamodelTintFocus = useMemo(
    () =>
      resolveDatamodelTintFocus(
        playModeFooterTint,
        clientSimActive,
        explorerHeaderSimFocus,
        explorerWhileScriptFocus,
        showAssetInIsolation && editWorkspaceDocumentFocus !== 'main',
        hideAssetTinting,
      ),
    [
      playModeFooterTint,
      clientSimActive,
      explorerHeaderSimFocus,
      explorerWhileScriptFocus,
      showAssetInIsolation,
      editWorkspaceDocumentFocus,
      hideAssetTinting,
    ],
  )

  /** Right rail: Explorer / Properties / Interaction panel — title alignment (Interaction settings). */
  const [panelTitlesLeftAligned, setPanelTitlesLeftAligned] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.panelTitlesLeftAligned,
  )
  const [propertiesShowBreadcrumb, setPropertiesShowBreadcrumb] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.propertiesShowBreadcrumb,
  )
  const [editExplorerSelectedRowId, setEditExplorerSelectedRowId] = useState<string | null>(
    null,
  )
  const [explorerSelectionSeedEpoch, setExplorerSelectionSeedEpoch] = useState(0)

  const explorerTreeKind = useMemo((): ExplorerTreeKind => {
    if (bunnyAssetWindow) return 'bunny'
    if (explorerShowsDroneIsolationTree) return 'droneIsolation'
    if (
      clientSimActive &&
      (explorerWhileScriptFocus === 'sim-client' || explorerWhileScriptFocus === 'sim-server')
    ) {
      return 'flatSim'
    }
    return 'droneRacerHierarchy'
  }, [bunnyAssetWindow, explorerShowsDroneIsolationTree, clientSimActive, explorerWhileScriptFocus])

  const seedExplorerSelectionForTreeKind = useCallback((kind: ExplorerTreeKind) => {
    switch (kind) {
      case 'bunny':
        setEditExplorerSelectedRowId('bunnyExplorerRow')
        return
      case 'droneIsolation':
        setEditExplorerSelectedRowId(pickRandomExplorerRow(DRONE_ISOLATION_EXPLORER_ROWS))
        return
      case 'flatSim': {
        const [clientRow, serverRow] = pickDistinctRandomExplorerRows(FLAT_SIM_EXPLORER_ROWS)
        setSimExplorerSelectedRowClient(clientRow)
        setSimExplorerSelectedRowServer(serverRow)
        return
      }
      case 'droneRacerHierarchy': {
        setEditExplorerSelectedRowId(pickRandomExplorerRow(DRONE_RACER_EXPLORER_ROWS))
        if (clientSimActive) {
          const [clientRow, serverRow] = pickDistinctRandomExplorerRows(DRONE_RACER_EXPLORER_ROWS)
          setSimExplorerSelectedRowClient(clientRow)
          setSimExplorerSelectedRowServer(serverRow)
        }
      }
    }
  }, [clientSimActive])

  useEffect(() => {
    seedExplorerSelectionForTreeKind(explorerTreeKind)
  }, [
    explorerTreeKind,
    explorerSelectionSeedEpoch,
    clientSimActive,
    seedExplorerSelectionForTreeKind,
  ])

  const [outputPanelOpen, setOutputPanelOpen] = useState(false)
  const [outputLogEntries, setOutputLogEntries] = useState<OutputLogEntry[]>(INITIAL_OUTPUT_LOG)

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
    setExplorerNoBadge(d.explorerNoBadge)
    setExplorerFocusBadge(d.explorerFocusBadge)
    setExplorerBadgeShowIndicator(d.explorerBadgeShowIndicator)
    setExplorerOriginalDmBadge(d.explorerOriginalDmBadge)
    setExplorerShowBreadcrumb(d.explorerShowBreadcrumb)
    setPlayModeFullTint(d.playModeFullTint)
    setPlayModeSelectionTint(d.playModeSelectionTint)
    setPlayModeFooterTint(d.playModeFooterTint)
    setPlayModeSplitView(d.playModeSplitView)
    setShowAssetInIsolation(d.showAssetInIsolation)
    setEditDatamodelShowStroke(d.editDatamodelShowStroke)
    setHideAssetTinting(d.hideAssetTinting)
    setEditWorkspaceDocumentFocus(d.editWorkspaceDocumentFocus)
    setPanelTitlesLeftAligned(d.panelTitlesLeftAligned)
    setPropertiesShowBreadcrumb(d.propertiesShowBreadcrumb)
    setEditExplorerSelectedRowId(null)
    setMainDocumentEditorTab(d.mainDocumentEditorTab)
    setSplitClientDocumentTab(d.splitClientDocumentTab)
    setSplitServerDocumentTab(d.splitServerDocumentTab)
    setScriptATabOpen(d.scriptATabOpen)
    setScriptBTabOpen(d.scriptBTabOpen)
    setClientScriptTabOpen(d.clientScriptTabOpen)
    setServerScriptTabOpen(d.serverScriptTabOpen)
    setIsolationTabOpen(d.isolationTabOpen)
    setHoverScriptTabOpen(d.hoverScriptTabOpen)
    setClientScriptDocument(DEFAULT_CLIENT_SCRIPT_DOCUMENT)
    setOutputPanelOpen(false)
    setOutputLogEntries(INITIAL_OUTPUT_LOG)
    setSimExplorerSelectedRowClient(null)
    setSimExplorerSelectedRowServer(null)
    setExplorerSelectionSeedEpoch((epoch) => epoch + 1)
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

  const activeExplorerRowForProperties = useMemo(() => {
    if (explorerShowsDroneIsolationTree) return editExplorerSelectedRowId
    if (clientSimActive) return simExplorerSelectedRowId
    return editExplorerSelectedRowId
  }, [
    explorerShowsDroneIsolationTree,
    clientSimActive,
    simExplorerSelectedRowId,
    editExplorerSelectedRowId,
  ])

  const propertiesBreadcrumbContext = useMemo(() => {
    if (explorerShowsDroneIsolationTree) return DRONE_WORKSPACE_TAB_LABEL
    if (!clientSimActive) return null
    return explorerSimFocusForTree === 'server' ? 'Server' : 'Client'
  }, [clientSimActive, explorerShowsDroneIsolationTree, explorerSimFocusForTree])

  const propertiesPanelTitle =
    propertiesShowBreadcrumb && activeExplorerRowForProperties
      ? formatPropertiesPanelTitle(
          activeExplorerRowForProperties,
          propertiesBreadcrumbContext,
        )
      : 'Properties'

  const propertiesPanelEmpty = activeExplorerRowForProperties === null

  const panelChromeTitleAlign = panelTitlesLeftAligned ? ('left' as const) : ('center' as const)

  const centerBottomDock = !bunnyAssetWindow ? (
    <>
      <div className={styles.centerDockGutter} aria-hidden />
      <div className={styles.centerDock}>
        {outputPanelOpen ? (
          <>
            <OutputPanel
              entries={outputLogEntries}
              onClose={() => setOutputPanelOpen(false)}
              titleAlign={panelChromeTitleAlign}
              onErrorRowClick={() => openCameraZoomScript()}
            />
            <div className={styles.centerDockPanelGutter} aria-hidden />
          </>
        ) : null}
        <AssetManagerPanel fillDock={!outputPanelOpen} titleAlign={panelChromeTitleAlign} />
      </div>
    </>
  ) : null

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
      const testScriptTab: MainDocumentEditorTab | null =
        mainDocumentEditorTab === 'clientScript' || mainDocumentEditorTab === 'serverScript'
          ? mainDocumentEditorTab
          : splitClientDocumentTab === 'clientScript'
            ? 'clientScript'
            : splitServerDocumentTab === 'serverScript'
              ? 'serverScript'
              : null

      if (testScriptTab) {
        setMainDocumentEditorTab(testScriptTab)
      } else {
        setMainDocumentEditorTab(edit.mainDocumentEditorTab)
        setSplitClientDocumentTab(edit.splitClientDocumentTab)
        setSplitServerDocumentTab(edit.splitServerDocumentTab)
      }

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
                  tintActive={tintActive}
                  focusHoleRef={focusHoleRef}
                  playModeSplitView={playModeSplitView}
                  editDatamodelShowStroke={editDatamodelShowStroke}
                  editDocumentFocus={editWorkspaceDocumentFocus}
                  onEditDocumentFocusChange={setEditWorkspaceDocumentFocus}
                  clientScriptDocument={clientScriptDocument}
                />
              )}
            </div>
            {centerBottomDock}
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
                  clientScriptDocument={clientScriptDocument}
                />
              )}
            </div>
            {centerBottomDock}
          </section>
        )}

        <aside className={styles.right} data-node-id="3841:115190">
          <div className={styles.panel} data-node-id="3841:115191">
            <PanelChrome
              title={explorerPanelTitle}
              assetVariant="explorer"
              titleAlign={panelChromeTitleAlign}
              explorerFocusBadgeTarget={
                explorerNoBadge
                  ? null
                  : explorerFocusBadge && explorerShowsClientServerFocusBadge
                    ? explorerHeaderSimFocus
                    : null
              }
              explorerDocumentBadgeLabel={
                explorerNoBadge
                  ? null
                  : (explorerFocusBadge || explorerOriginalDmBadge) &&
                      showAssetInIsolation &&
                      editWorkspaceDocumentFocus !== 'main'
                    ? DRONE_WORKSPACE_TAB_LABEL
                    : null
              }
              explorerOriginalDmBadgeLabel={
                explorerNoBadge ? null : explorerOriginalDmBadgeLabel
              }
              explorerOriginalDmBadgeShowDot={explorerBadgeShowIndicator}
              explorerBadgeShowDot={
                !explorerFocusBadge || explorerBadgeShowIndicator
              }
            />
            <div className={styles.panelBody} data-node-id="3841:115193">
              <ExplorerTree
                clientSim={clientSimActive}
                bunnyFlatExplorer={bunnyAssetWindow}
                explorerWhileScriptFocus={explorerWhileScriptFocus}
                droneDocumentFocused={explorerShowsDroneIsolationTree}
                hideAssetTinting={hideAssetTinting}
                selectionTintActive={playModeSelectionTint}
                simViewportFocus={explorerHeaderSimFocus}
                simSelectedRowId={simExplorerSelectedRowId}
                onSimExplorerSelectRow={onSimExplorerSelectRow}
                editSelectedRowId={editExplorerSelectedRowId}
                onEditSelectedRowIdChange={setEditExplorerSelectedRowId}
              />
            </div>
          </div>
          <div className={styles.panel} data-node-id="3841:115196">
            <PanelChrome
              title={propertiesPanelTitle}
              assetVariant="properties"
              titleAlign={panelChromeTitleAlign}
            />
            <div className={styles.panelBody} data-node-id="3841:115198">
              <PropertiesPanel empty={propertiesPanelEmpty} />
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
                explorerNoBadge={explorerNoBadge}
                onExplorerNoBadgeChange={setExplorerNoBadge}
                explorerFocusBadge={explorerFocusBadge}
                onExplorerFocusBadgeChange={setExplorerFocusBadge}
                explorerBadgeShowIndicator={explorerBadgeShowIndicator}
                onExplorerBadgeShowIndicatorChange={setExplorerBadgeShowIndicator}
                explorerOriginalDmBadge={explorerOriginalDmBadge}
                onExplorerOriginalDmBadgeChange={setExplorerOriginalDmBadge}
                explorerShowBreadcrumb={explorerShowBreadcrumb}
                onExplorerShowBreadcrumbChange={setExplorerShowBreadcrumb}
                fullTint={playModeFullTint}
                onFullTintChange={setPlayModeFullTint}
                selectionTint={playModeSelectionTint}
                onSelectionTintChange={setPlayModeSelectionTint}
                footerTint={playModeFooterTint}
                onFooterTintChange={setPlayModeFooterTint}
                splitView={playModeSplitView}
                onSplitViewChange={setPlayModeSplitView}
                showAssetInIsolation={showAssetInIsolation}
                onShowAssetInIsolationChange={setShowAssetInIsolation}
                editDatamodelShowStroke={editDatamodelShowStroke}
                onEditDatamodelShowStrokeChange={setEditDatamodelShowStroke}
                hideAssetTinting={hideAssetTinting}
                onHideAssetTintingChange={setHideAssetTinting}
                panelTitlesLeftAligned={panelTitlesLeftAligned}
                onPanelTitlesLeftAlignedChange={setPanelTitlesLeftAligned}
                propertiesShowBreadcrumb={propertiesShowBreadcrumb}
                onPropertiesShowBreadcrumbChange={setPropertiesShowBreadcrumb}
                bunnyAssetWindow={bunnyAssetWindow}
                onOpenAssetWindow={bunnyAssetWindow ? undefined : onOpenAssetWindow}
                onOpenClientScript={bunnyAssetWindow ? undefined : openClientScriptTab}
                onOpenServerScript={bunnyAssetWindow ? undefined : openServerScriptTab}
                onThrowError={bunnyAssetWindow ? undefined : handleThrowError}
                testingMode={clientSimActive}
                onReset={bunnyAssetWindow ? undefined : handlePrototypeReset}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className={styles.workspaceGutter} aria-hidden />

      <StudioFooter
        questions={FOOTER_QUESTIONS}
        datamodelTintFocus={footerDatamodelTintFocus}
      />

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
