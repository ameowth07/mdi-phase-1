import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  ComponentProps,
  Dispatch,
  MouseEvent,
  PointerEvent,
  Ref,
  RefObject,
  SetStateAction,
} from 'react'
import { Monitor, Server, SquareArrowOutUpRight } from 'lucide-react'
import ClientSim from './ClientSim'
import LegacyRibbon from './LegacyRibbon'
import TestAppMenu, { type TestAppMenuFocusTarget } from './TestAppMenu'
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
import {
  DATAMODEL_INSET_FOCUS_BORDER,
  resolveDatamodelTintFocus,
  resolveExplorerSelectionTintFocus,
  type ExplorerRetentionKind,
} from './datamodelTint'
import InteractionSettingsPanel from './InteractionSettingsPanel'
import StudioFooter from './StudioFooter'
import PropertiesPanel from './PropertiesPanel'
import { publicAssetUrl } from '../../publicAssetUrl'
import {
  buildDefaultSimDocumentTabOrder,
  closeTabFocusLeft,
  EDIT_ISOLATION_TAB_ORDER,
  insertStripTabAfterAnchor,
  isMainScriptTabOpen,
  MAIN_SCRIPT_TAB_ORDER,
  type EditIsolationTabId,
  type MainScriptTabId,
  type SimDocumentStripTab,
} from './documentTabClose'
import {
  buildInitialExplorerSelectionByClient,
  buildMultiClientSimDocumentTabOrder,
  insertClientInstanceTabInOrder,
  openClientIndicesFromSessionOrder,
  resolvePlaySessionFocus,
  clientInstanceIndexFromStripTab,
  explorerTreeForClientInstance,
  isSimClientInstanceId,
  isSimClientStripTab,
  parseSimClientInstanceIndex,
  simClientInstanceId,
  simClientInstanceLabel,
  type SimClientExplorerRow,
} from './simMultiClient'
import { mergeVisibleTabReorder } from './documentTabReorder'
import {
  buildDefaultPersistentZoneKeys,
  isoTabKey,
  mainScriptTabKey,
  moveTabBetweenZones,
  persistentKeysToCombined,
  ensureMultiClientMainZoneKeys,
  injectMultiClientMainZoneDefaults,
  mergeOpenTabOrder,
  persistentMainZoneKeysForSimOrder,
  reconcileCombinedZoneKeys,
  reorderZoneTabKeys,
  simTabKey,
  syncAllDocumentOrdersFromPersistentZones,
  syncScriptOrderFromSimOrder,
  syncSimOrderFromScriptOrder,
  tabKeyInZone,
  type CombinedTabKey,
  type CombinedTabStripZone,
  type PersistentTabKey,
} from './documentTabStripZone'
import { useDualZoneTabDrag, tabDragClassesForDual, type DualZoneTabDragBindings } from './useDualZoneTabDrag'
import { useTabRowDragReorder, type TabRowDragBindings } from './useTabRowDragReorder'
import PanelDockZone from './PanelDockZone'
import FloatingPanelWindow from './FloatingPanelWindow'
import FloatingDocumentWindow from './FloatingDocumentWindow'
import type { FloatingDocumentPosition } from './floatingDocument'
import { createFloatingDocumentWindow } from './floatingDocument'
import {
  createFloatingWindow,
  findFloatingWindowWithTab,
  mergeFloatingWindows,
  removeFloatingSidePanelTab,
  type FloatingPanelWindowState,
  type FloatingSidePanelId,
} from './floatingSidePanel'
import {
  createDefaultPanelDockLayout,
  layoutWithoutPanels,
  syncOutputPanelInLayout,
  type DockPanelId,
  type PanelDockLayoutState,
} from './panelDock'
import { usePanelDockDrag } from './usePanelDockDrag'
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
const TAB_PATH_DRONE_RACER_SCRIPT_A = 'Drone Racer/Script'
const TAB_PATH_DRONE_RACER_SCRIPT_B = 'Drone Racer/Script'
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
  'c2-replicated': { label: 'ReplicatedStorage', className: 'Folder' },
  'c2-starter': { label: 'StarterPlayer', className: 'StarterPlayer' },
  'c2-startergui': { label: 'StarterGui', className: 'StarterGui' },
  'c2-sound': { label: 'SoundService', className: 'SoundService' },
  'c3-workspace': { label: 'Workspace', className: 'Model' },
  'c3-characters': { label: 'Characters', className: 'Folder' },
  'c3-replicatedfirst': { label: 'ReplicatedFirst', className: 'ReplicatedFirst' },
  'c3-text': { label: 'TextChatService', className: 'TextChatService' },
  'c4-workspace': { label: 'Workspace', className: 'Model' },
  'c4-players': { label: 'Players', className: 'Players' },
  'c4-pathfinding': { label: 'PathfindingService', className: 'PathfindingService' },
  'c4-localization': { label: 'LocalizationService', className: 'LocalizationService' },
  bunnyExplorerRow: { label: 'Bunny', className: 'Model' },
  [DRONE_ISOLATION_EXPLORER_ROW_ID]: { label: DRONE_WORKSPACE_TAB_LABEL, className: 'Model' },
  'drone-isolation-hover-script': { label: 'HoverScript', className: 'Script' },
  'drone-isolation-frame': { label: 'Frame', className: 'Model' },
  'drone-isolation-rotor-a': { label: 'RotorA', className: 'Model' },
  'drone-isolation-rotor-b': { label: 'RotorB', className: 'Model' },
  'drone-isolation-sensor': { label: 'Sensor', className: 'Model' },
}

function explorerRowMeta(rowId: string): { label: string; className: string } {
  return (
    EXPLORER_ROW_META[rowId] ?? {
      label: rowId.charAt(0).toUpperCase() + rowId.slice(1),
      className: 'Model',
    }
  )
}

function explorerRowPropertiesBreadcrumb(rowId: string): string {
  const meta = explorerRowMeta(rowId)
  return `${meta.className} "${meta.label}"`
}

function formatPropertiesPanelTitle(
  rowId: string,
  contextSegment: string | null,
): string {
  const rowPart = explorerRowPropertiesBreadcrumb(rowId)
  return contextSegment ? `Properties / ${contextSegment} / ${rowPart}` : `Properties / ${rowPart}`
}

const DRONE_WORKSPACE_BREADCRUMB = 'Drone Racer'

/** Drop workspace name from breadcrumb when not showing full in-window path. */
function breadcrumbSegmentForDisplay(
  fullSegment: string | null,
  includeWorkspace: boolean,
): string | null {
  if (!fullSegment) return null
  if (includeWorkspace) return fullSegment
  if (fullSegment === DRONE_WORKSPACE_BREADCRUMB) return null
  if (fullSegment.startsWith(`${DRONE_WORKSPACE_BREADCRUMB} / `)) {
    return fullSegment.slice(`${DRONE_WORKSPACE_BREADCRUMB} / `.length)
  }
  return fullSegment
}

function formatExplorerPanelTitle(displaySegment: string | null): string {
  return displaySegment ? `Explorer / ${displaySegment}` : 'Explorer'
}

function simStripTabAnchor(
  mainTab: MainDocumentEditorTab,
  simFocus: SimViewportFocus,
): SimDocumentStripTab {
  if (mainTab === 'droneRacer') return simFocus
  if (isScriptDocumentTab(mainTab)) return mainTab
  return simFocus
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

function simStripTabDatamodel(tabId: SimDocumentStripTab): ScriptDatamodelFocus {
  if (tabId === 'server') return 'server'
  if (tabId === 'client' || isSimClientInstanceId(tabId)) return 'client'
  if (tabId === 'clientScript') return 'client'
  if (tabId === 'serverScript') return 'server'
  return 'drone'
}

function droneRacerDocumentTabDatamodel(
  simFocus: SimViewportFocus,
  clientSim: boolean,
): ScriptDatamodelFocus {
  return clientSim ? simFocus : 'drone'
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

/** Client sim — Drone Racer tab: brand hue matches semantic Client stroke. */
function TabClientSimDocumentIcon() {
  return (
    <Monitor
      size={12}
      strokeWidth={1.5}
      className={`${styles.tabDiamond} ${styles.tabDiamondBrand}`}
      color={DATAMODEL_INSET_FOCUS_BORDER.client}
      aria-hidden
    />
  )
}

/** Server sim — Drone Racer tab: brand hue matches semantic Server stroke. */
function TabServerSimDocumentIcon() {
  return (
    <Server
      size={12}
      strokeWidth={1.5}
      className={`${styles.tabDiamond} ${styles.tabDiamondBrand}`}
      color={DATAMODEL_INSET_FOCUS_BORDER.server}
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

/** Path tooltip: first hover delay vs quick chain to another host (ms). */
const PATH_TOOLTIP_FIRST_DELAY_MS = 300
const PATH_TOOLTIP_CHAIN_WINDOW_MS = 1000

let pathTooltipLastOpenedAt = 0
let pathTooltipLastOpenedInstanceId: string | null = null

function usePathTooltip(path: string, enabled: boolean) {
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
    if (!enabled) return
    clearOpenTimer()
    const now = Date.now()
    const chainInWindow =
      pathTooltipLastOpenedAt > 0 &&
      now - pathTooltipLastOpenedAt < PATH_TOOLTIP_CHAIN_WINDOW_MS
    const chainDifferentHost =
      chainInWindow &&
      pathTooltipLastOpenedInstanceId !== null &&
      pathTooltipLastOpenedInstanceId !== instanceId
    const delay = chainDifferentHost ? 0 : PATH_TOOLTIP_FIRST_DELAY_MS

    openTimerRef.current = globalThis.setTimeout(() => {
      openTimerRef.current = null
      if (!hoveringRef.current) return
      setTipOpen(true)
      pathTooltipLastOpenedAt = Date.now()
      pathTooltipLastOpenedInstanceId = instanceId
    }, delay)
  }, [enabled, instanceId, clearOpenTimer])

  const onMouseEnter = useCallback(
    (e: MouseEvent) => {
      hoveringRef.current = true
      scheduleOpen()
      return e
    },
    [scheduleOpen],
  )

  const onMouseLeave = useCallback(() => {
    hoveringRef.current = false
    clearOpenTimer()
    setTipOpen(false)
  }, [clearOpenTimer])

  return { tipOpen: enabled && tipOpen, onMouseEnter, onMouseLeave, path }
}

/** Figma Studio App Framework — Tooltip (3975:51736): inverse surface, Body small; shown below host. */
function PathTooltipBubble({
  path,
  align = 'center',
}: {
  path: string
  align?: 'center' | 'start'
}) {
  const alignClass =
    align === 'start' ? styles.pathTooltipAlignStart : styles.pathTooltipAlignCenter

  return (
    <span
      className={`${styles.pathTooltip} ${alignClass}`}
      role="tooltip"
      data-node-id="3975:51738"
    >
      {path}
    </span>
  )
}

/** Figma Studio App Framework — Tooltip (3975:51736): inverse surface, Body small; shown below tab. */
function TabWithPathTooltip({
  path,
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  onPointerDown,
  ...rest
}: ComponentProps<'div'> & { path: string }) {
  const tooltip = usePathTooltip(path, true)

  return (
    <div
      {...rest}
      className={`${className ?? ''} ${styles.pathTooltipHost}`}
      onPointerDown={onPointerDown}
      onMouseEnter={(e) => {
        onMouseEnter?.(e)
        tooltip.onMouseEnter(e)
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e)
        tooltip.onMouseLeave()
      }}
    >
      {children}
      {tooltip.tipOpen ? <PathTooltipBubble path={path} /> : null}
    </div>
  )
}

function tabDragClasses(drag: TabRowDragBindings, index: number): string {
  return drag.tabClass(index, {
    tabDraggable: styles.tabDraggable,
    tabDragging: styles.tabDragging,
    tabDropTarget: styles.tabDropTarget,
  })
}

function tabActivateHandlers(drag: TabRowDragBindings, activate: () => void) {
  return {
    onClick: (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      if (drag.consumeClickAfterDrag()) return
      activate()
    },
  }
}

function isDualZoneTabDrag(
  drag: TabRowDragBindings | DualZoneTabDragBindings,
): drag is DualZoneTabDragBindings {
  return 'mainRowRef' in drag
}

const TAB_DRAG_STYLE_CLASSES = {
  tabDraggable: styles.tabDraggable,
  tabDragging: styles.tabDragging,
  tabDropTarget: styles.tabDropTarget,
} as const

function tabDragClassesAny(
  drag: TabRowDragBindings | DualZoneTabDragBindings,
  index: number,
  zone?: CombinedTabStripZone,
): string {
  if (isDualZoneTabDrag(drag)) {
    return tabDragClassesForDual(drag, zone!, index, TAB_DRAG_STYLE_CLASSES)
  }
  return tabDragClasses(drag, index)
}

function tabPropsAny(
  drag: TabRowDragBindings | DualZoneTabDragBindings,
  index: number,
  zone?: CombinedTabStripZone,
) {
  if (isDualZoneTabDrag(drag)) return drag.getTabProps(zone!, index)
  return drag.getTabProps(index)
}

function tabActivateHandlersAny(
  drag: TabRowDragBindings | DualZoneTabDragBindings,
  activate: () => void,
) {
  return {
    onClick: (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      if (drag.consumeClickAfterDrag()) return
      activate()
    },
  }
}

type PanelChromeProps = {
  title: string
  assetVariant: 'explorer' | 'properties'
  /** When set, the close control invokes this handler. */
  onClose?: () => void
  /** Floating panel: drag by header (excludes action buttons). */
  draggable?: boolean
  onDragHandlePointerDown?: (e: PointerEvent<HTMLElement>) => void
  /** Dock layout: drag panel between zones/stacks by header. */
  onPanelDockDragPointerDown?: (e: PointerEvent<HTMLElement>) => void
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

/**
 * Progressive panel title truncation — collapse middle segments left-to-right, keep tail.
 * e.g. Properties / Drone Racer / Client / Model "Door"
 *   → Properties / ... / Client / Model "Door"
 *   → Properties / ... / ... / Model "Door"
 */
function panelTitleTruncationLevels(title: string): readonly string[] {
  const segments = title.split(' / ')
  if (segments.length < 3) return [title]

  const levels: string[] = [title]
  const middleCount = segments.length - 2
  for (let collapsed = 1; collapsed <= middleCount; collapsed++) {
    levels.push(
      [
        segments[0],
        ...Array<string>(collapsed).fill('...'),
        ...segments.slice(1 + collapsed),
      ].join(' / '),
    )
  }
  return levels
}

const PANEL_CHROME_TITLE_ACTION_GAP_PX = 4

function panelTitleLabelHost(el: HTMLElement): HTMLElement {
  const parent = el.parentElement
  if (parent?.classList.contains(styles.panelTitleWithBadge)) return parent
  return el
}

function measurePanelTitleTextWidth(text: string): number {
  const measure = document.createElement('span')
  measure.className = `${styles.panelTitle} ${styles.panelTitleLabel}`
  measure.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;white-space:nowrap;margin:0;'
  measure.textContent = text
  document.body.appendChild(measure)
  const width = measure.scrollWidth
  measure.remove()
  return width
}

/** Space from title host left edge to panel actions (not shrink-wrapped label width). */
function panelTitleAvailableWidth(el: HTMLElement): number {
  const header = el.closest('header')
  const actions = header?.querySelector(`.${styles.panelActions}`) as HTMLElement | null
  if (!header || !actions) return 0
  const host = panelTitleLabelHost(el)
  const slotStart = host.getBoundingClientRect().left
  const slotEnd = actions.getBoundingClientRect().left
  return Math.max(slotEnd - slotStart - PANEL_CHROME_TITLE_ACTION_GAP_PX, 0)
}

function panelTitleRequiredWidth(el: HTMLElement, text: string, className: string): number {
  const host = panelTitleLabelHost(el)
  const textWidth = measurePanelTitleTextWidth(text)

  if (host !== el) {
    const badge = host.querySelector(':scope > span') as HTMLElement | null
    const badgeWidth = badge?.getBoundingClientRect().width ?? 0
    const gap = parseFloat(getComputedStyle(host).gap) || 10
    return textWidth + badgeWidth + gap
  }

  if (className.includes(styles.panelTitleAlignCenter)) {
    const slotWidth = host.getBoundingClientRect().width
    return slotWidth / 2 + textWidth / 2
  }

  return textWidth
}

function panelTitleFits(el: HTMLElement, text: string, className: string): boolean {
  const available = panelTitleAvailableWidth(el)
  if (!Number.isFinite(available) || available <= 0) return false
  return panelTitleRequiredWidth(el, text, className) <= available + 1
}

function pickPanelTitleDisplay(el: HTMLElement, title: string, className: string): string {
  const levels = panelTitleTruncationLevels(title)
  if (levels.length === 1) return title

  const available = panelTitleAvailableWidth(el)
  if (available <= 0) return title

  if (panelTitleFits(el, title, className)) return title

  for (let i = 1; i < levels.length; i++) {
    const candidate = levels[i]!
    if (panelTitleFits(el, candidate, className)) return candidate
  }
  return levels[levels.length - 1]!
}

function PanelChromeTitle({ title, className }: { title: string; className: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [displayTitle, setDisplayTitle] = useState(title)

  const syncTitleDisplay = useCallback(() => {
    const el = ref.current
    if (!el || panelTitleAvailableWidth(el) <= 0) return
    const next = pickPanelTitleDisplay(el, title, className)
    setDisplayTitle((prev) => (prev === next ? prev : next))
  }, [title, className])

  useLayoutEffect(() => {
    syncTitleDisplay()
    const header = ref.current?.closest('header')
    if (!header) return
    const ro = new ResizeObserver(syncTitleDisplay)
    ro.observe(header)
    return () => ro.disconnect()
  }, [syncTitleDisplay])

  const isTruncated = displayTitle !== title
  const tooltip = usePathTooltip(title, isTruncated)
  const tooltipAlign = className.includes(styles.panelTitleAlignCenter) ? 'center' : 'start'

  return (
    <div
      ref={ref}
      className={`${styles.pathTooltipHost} ${className}`}
      onMouseEnter={tooltip.onMouseEnter}
      onMouseLeave={tooltip.onMouseLeave}
    >
      <span className={styles.panelTitleLabel}>{displayTitle}</span>
      {tooltip.tipOpen ? <PathTooltipBubble path={title} align={tooltipAlign} /> : null}
    </div>
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
  onClose,
  draggable = false,
  onDragHandlePointerDown,
  onPanelDockDragPointerDown,
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

  const headerDraggable = draggable || onPanelDockDragPointerDown != null
  const onHeaderPointerDown = draggable
    ? onDragHandlePointerDown
    : onPanelDockDragPointerDown

  return (
    <header
      className={`${styles.panelHeader} ${headerDraggable ? styles.panelHeaderDraggable : ''}`}
      onPointerDown={headerDraggable ? onHeaderPointerDown : undefined}
    >
      {showExplorerBadge ? (
        <div
          className={`${styles.panelTitleWithBadge} ${badgeAlignClass}`}
          role="group"
          aria-label={explorerAria}
        >
          <PanelChromeTitle title={title} className={styles.panelTitlePlain} />
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
        <PanelChromeTitle title={title} className={`${styles.panelTitle} ${titleAlignClass}`} />
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
        <button
          type="button"
          className={styles.panelAction}
          aria-label="Close panel"
          onClick={onClose}
        >
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
  simMultiClientMode,
  simActiveClientInstanceIndex,
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
  /** Testing UI: Selection tint — Explorer `data-explorer-tint` row hues (not viewport). */
  selectionTintActive: boolean
  simViewportFocus: SimViewportFocus
  /** Server & Clients: distinct Explorer per client instance tab. */
  simMultiClientMode?: boolean
  simActiveClientInstanceIndex?: number
  /** Sim: selected Explorer row for the current sim focus (client vs server); null until user picks. */
  simSelectedRowId: string | null
  onSimExplorerSelectRow: (rowId: string) => void
  /** Edit mode: selected Explorer row (lifted for Properties breadcrumb). */
  editSelectedRowId: string | null
  onEditSelectedRowIdChange: (rowId: string) => void
}) {
  const explorerTintFocus = useMemo(
    () =>
      resolveExplorerSelectionTintFocus(
        selectionTintActive,
        clientSim,
        simViewportFocus,
        explorerWhileScriptFocus,
      ),
    [selectionTintActive, clientSim, simViewportFocus, explorerWhileScriptFocus],
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
    (explorerWhileScriptFocus === 'sim-client' || explorerWhileScriptFocus === 'sim-server')
  ) {
    const clientTreeRows: SimClientExplorerRow[] =
      simMultiClientMode && simViewportFocus === 'client' && simActiveClientInstanceIndex != null
        ? explorerTreeForClientInstance(simActiveClientInstanceIndex)
        : [
            { id: 'workspace', label: 'Workspace', icon: '●', iconColor: '#4a9eff' },
            { id: 'players', label: 'Players', icon: '☺', iconColor: '#e8944a' },
            { id: 'lighting', label: 'Lighting', icon: '💡' },
            { id: 'materialservice', label: 'MaterialService', icon: '⌗' },
          ]

    return (
      <div className={styles.tree} {...explorerTreeProps}>
        {clientTreeRows.map((row, rowIndex) => (
          <div key={row.id} {...bindFlatSimRow(row.id)}>
            <TreeChevron mode={rowIndex === 0 ? 'closed' : rowIndex === 1 ? 'spacer' : 'closed'} />
            <span
              className={styles.treeIcon}
              style={row.iconColor != null ? { color: row.iconColor } : undefined}
            >
              {row.icon}
            </span>
            <span className={styles.treeLabel}>{row.label}</span>
          </div>
        ))}
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
  /** Test mode: Client / Server document tabs in the tab strip. */
  simClientTabOpen?: boolean
  simServerTabOpen?: boolean
  /** Test mode: left-to-right order for Client / Server / Script tabs in the strip. */
  simDocumentTabOrder?: SimDocumentStripTab[]
  onSimDocumentTabOrderChange?: Dispatch<SetStateAction<SimDocumentStripTab[]>>
  /** Edit mode: Script tab order in the main document strip. */
  scriptTabOrder?: MainScriptTabId[]
  onScriptTabOrderChange?: Dispatch<SetStateAction<MainScriptTabId[]>>
  /** Edit mode: asset isolation tab order. */
  editIsolationTabOrder?: EditIsolationTabId[]
  onEditIsolationTabOrderChange?: Dispatch<SetStateAction<EditIsolationTabId[]>>
  /** Combined main/iso tab strip: explicit left-to-right tab keys per zone (null = default placement). */
  combinedMainZoneKeys?: PersistentTabKey[] | null
  combinedIsoZoneKeys?: PersistentTabKey[] | null
  onCombinedMainZoneKeysChange?: Dispatch<SetStateAction<PersistentTabKey[] | null>>
  onCombinedIsoZoneKeysChange?: Dispatch<SetStateAction<PersistentTabKey[] | null>>
  isolationTabOpen?: boolean
  hoverScriptTabOpen?: boolean
  onScriptATabOpenChange?: (open: boolean) => void
  onScriptBTabOpenChange?: (open: boolean) => void
  onClientScriptTabOpenChange?: (open: boolean) => void
  onServerScriptTabOpenChange?: (open: boolean) => void
  onSimClientTabOpenChange?: (open: boolean) => void
  onSimServerTabOpenChange?: (open: boolean) => void
  onIsolationTabOpenChange?: (open: boolean) => void
  onHoverScriptTabOpenChange?: (open: boolean) => void
  /** Test (play) mode: Client vs Server tab — datamodel stroke and tint follow this. */
  simViewportFocus?: SimViewportFocus
  onSimViewportFocusChange?: (focus: SimViewportFocus) => void
  /** Server & Clients play: one datamodel tab per spawned client (`client-1` …). */
  simMultiClientMode?: boolean
  simClientInstanceCount?: number
  /** Active Client / Server datamodel tab in the test strip. */
  simFocusedStripTab?: SimDocumentStripTab
  onSimFocusedStripTabChange?: (tab: SimDocumentStripTab) => void
  /** Test mode: semantic inset — brand cyan/green on Client/Server; neutral ring on Drone Racer scripts. */
  playModeHasStroke?: boolean
  /** Test mode: white inset focus ring (Testing UI: Has focus stroke). */
  playModeHasFocusStroke?: boolean
  /** Test mode: 1px top stroke on the active document tab (Testing UI: Tab stroke). */
  playModeTabStroke?: boolean
  /** Asset isolation column undocked as a floating document window. */
  documentUndocked?: boolean
  floatingDocumentPosition?: FloatingDocumentPosition | null
  onFloatingDocumentPositionChange?: (position: FloatingDocumentPosition) => void
  onDockDocument?: () => void
  frameRef?: RefObject<HTMLDivElement | null>
  panelChromeTitleAlign?: 'center' | 'left'
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
  simClientTabOpen = true,
  simServerTabOpen = true,
  simDocumentTabOrder = ['client', 'server'],
  onSimDocumentTabOrderChange,
  scriptTabOrder = [...MAIN_SCRIPT_TAB_ORDER],
  onScriptTabOrderChange,
  editIsolationTabOrder = [...EDIT_ISOLATION_TAB_ORDER],
  onEditIsolationTabOrderChange,
  combinedMainZoneKeys = null,
  combinedIsoZoneKeys = null,
  onCombinedMainZoneKeysChange,
  onCombinedIsoZoneKeysChange,
  isolationTabOpen = true,
  hoverScriptTabOpen = true,
  onScriptATabOpenChange,
  onScriptBTabOpenChange,
  onClientScriptTabOpenChange,
  onServerScriptTabOpenChange,
  onSimClientTabOpenChange,
  onSimServerTabOpenChange,
  onIsolationTabOpenChange,
  onHoverScriptTabOpenChange,
  simViewportFocus,
  onSimViewportFocusChange,
  simMultiClientMode = false,
  simClientInstanceCount = 1,
  simFocusedStripTab = 'client',
  onSimFocusedStripTabChange,
  playModeHasStroke,
  playModeHasFocusStroke,
  playModeTabStroke,
  documentUndocked = false,
  floatingDocumentPosition = null,
  onFloatingDocumentPositionChange,
  onDockDocument,
  frameRef,
  panelChromeTitleAlign = 'center',
  tintActive,
  focusHoleRef,
  playModeSplitView,
  clientScriptDocument = DEFAULT_CLIENT_SCRIPT_DOCUMENT,
}: DroneRacerWorkspaceProps) {
  const [bunnyEditViewportFocused, setBunnyEditViewportFocused] = useState(false)
  const [framePortalTarget, setFramePortalTarget] = useState<HTMLElement | null>(null)

  const showIsolationDocked = !!showAssetInIsolation && !documentUndocked

  useLayoutEffect(() => {
    setFramePortalTarget(frameRef?.current ?? null)
  })

  useEffect(() => {
    if (!showAssetInIsolation && documentUndocked) onDockDocument?.()
  }, [showAssetInIsolation, documentUndocked, onDockDocument])

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

  const isSimStripTabOpen = useCallback(
    (tab: SimDocumentStripTab) => {
      if (tab === 'client') return simClientTabOpen && !simMultiClientMode
      if (isSimClientInstanceId(tab)) {
        if (!simMultiClientMode || !simClientTabOpen) return false
        if (!simDocumentTabOrder.includes(tab)) return false
        const index = parseSimClientInstanceIndex(tab)
        return index >= 1 && index <= simClientInstanceCount
      }
      if (tab === 'server') return simServerTabOpen
      return isMainScriptTabOpen(tab, scriptTabsOpen)
    },
    [
      simClientTabOpen,
      simServerTabOpen,
      simMultiClientMode,
      simClientInstanceCount,
      simDocumentTabOrder,
      scriptTabsOpen,
    ],
  )

  const combinedStripMode = !!showAssetInIsolation && !playModeSplitView

  const isPersistentTabKeyOpen = useCallback(
    (key: PersistentTabKey) => {
      if (key.startsWith('dm:')) {
        if (key === 'dm:client') return simClientTabOpen && !simMultiClientMode
        if (key === 'dm:server') return simServerTabOpen
        if (/^dm:client-\d+$/.test(key)) {
          const index = Number.parseInt(key.slice('dm:client-'.length), 10)
          return (
            simMultiClientMode &&
            simClientTabOpen &&
            index >= 1 &&
            index <= simClientInstanceCount
          )
        }
        return false
      }
      if (key.startsWith('iso:')) {
        const id = key.slice(4) as EditIsolationTabId
        return id === 'isolation' ? isolationTabOpen : hoverScriptTabOpen
      }
      return isMainScriptTabOpen(key.slice(7) as MainScriptTabId, scriptTabsOpen)
    },
    [
      simClientTabOpen,
      simServerTabOpen,
      simMultiClientMode,
      simClientInstanceCount,
      isolationTabOpen,
      hoverScriptTabOpen,
      scriptTabsOpen,
    ],
  )

  const combinedStripLayoutMode = clientSim ? 'sim' : 'edit'

  const defaultCombinedMainZoneKeys = useMemo(
    () =>
      injectMultiClientMainZoneDefaults(
        buildDefaultPersistentZoneKeys(
          'main',
          simDocumentTabOrder,
          scriptTabOrder,
          editIsolationTabOrder,
          isPersistentTabKeyOpen,
        ),
        simClientInstanceCount,
        !!clientSim && simMultiClientMode,
      ),
    [
      simDocumentTabOrder,
      editIsolationTabOrder,
      scriptTabOrder,
      isPersistentTabKeyOpen,
      simClientInstanceCount,
      clientSim,
      simMultiClientMode,
    ],
  )

  const defaultCombinedIsoZoneKeys = useMemo(
    () =>
      buildDefaultPersistentZoneKeys(
        'iso',
        simDocumentTabOrder,
        scriptTabOrder,
        editIsolationTabOrder,
        isPersistentTabKeyOpen,
      ),
    [simDocumentTabOrder, editIsolationTabOrder, scriptTabOrder, isPersistentTabKeyOpen],
  )

  const {
    main: combinedMainZonePersistentKeys,
    iso: combinedIsoZonePersistentKeys,
  } = useMemo(() => {
    const reconciled = reconcileCombinedZoneKeys(
      combinedMainZoneKeys,
      combinedIsoZoneKeys,
      defaultCombinedMainZoneKeys,
      defaultCombinedIsoZoneKeys,
    )
    return {
      main: ensureMultiClientMainZoneKeys(
        reconciled.main,
        simClientInstanceCount,
        !!clientSim && simMultiClientMode,
      ),
      iso: reconciled.iso,
    }
  }, [
    combinedMainZoneKeys,
    combinedIsoZoneKeys,
    defaultCombinedMainZoneKeys,
    defaultCombinedIsoZoneKeys,
    simClientInstanceCount,
    clientSim,
    simMultiClientMode,
  ])

  const combinedMainZoneTabKeys = useMemo(
    () => persistentKeysToCombined(combinedMainZonePersistentKeys, combinedStripLayoutMode),
    [combinedMainZonePersistentKeys, combinedStripLayoutMode],
  )

  const combinedIsoZoneTabKeys = useMemo(
    () => persistentKeysToCombined(combinedIsoZonePersistentKeys, combinedStripLayoutMode),
    [combinedIsoZonePersistentKeys, combinedStripLayoutMode],
  )

  const simDocumentTabOrderRef = useRef(simDocumentTabOrder)
  simDocumentTabOrderRef.current = simDocumentTabOrder
  const scriptTabOrderRef = useRef(scriptTabOrder)
  scriptTabOrderRef.current = scriptTabOrder
  const editIsolationTabOrderRef = useRef(editIsolationTabOrder)
  editIsolationTabOrderRef.current = editIsolationTabOrder

  const applyCombinedZonePersistentUpdate = useCallback(
    (mainPersistent: PersistentTabKey[], isoPersistent: PersistentTabKey[]) => {
      onCombinedMainZoneKeysChange?.(mainPersistent)
      onCombinedIsoZoneKeysChange?.(isoPersistent)

      const synced = syncAllDocumentOrdersFromPersistentZones(
        mainPersistent,
        isoPersistent,
        simDocumentTabOrderRef.current,
        scriptTabOrderRef.current,
        editIsolationTabOrderRef.current,
      )
      onSimDocumentTabOrderChange?.(synced.simOrder)
      onScriptTabOrderChange?.(synced.scriptOrder)
      onEditIsolationTabOrderChange?.(synced.isoTabOrder)
    },
    [
      onCombinedMainZoneKeysChange,
      onCombinedIsoZoneKeysChange,
      onSimDocumentTabOrderChange,
      onScriptTabOrderChange,
      onEditIsolationTabOrderChange,
    ],
  )

  const combinedTabDrag = useDualZoneTabDrag({
    onReorderWithin: (zone, from, to) => {
      if (zone === 'main') {
        applyCombinedZonePersistentUpdate(
          reorderZoneTabKeys(combinedMainZonePersistentKeys, from, to),
          combinedIsoZonePersistentKeys,
        )
      } else {
        applyCombinedZonePersistentUpdate(
          combinedMainZonePersistentKeys,
          reorderZoneTabKeys(combinedIsoZonePersistentKeys, from, to),
        )
      }
    },
    onMoveBetween: (fromZone, fromIndex, toZone, toIndex) => {
      const moved = moveTabBetweenZones(
        combinedMainZonePersistentKeys,
        combinedIsoZonePersistentKeys,
        fromZone,
        fromIndex,
        toZone,
        toIndex,
      )
      if (moved) applyCombinedZonePersistentUpdate(moved.mainKeys, moved.isoKeys)
    },
  })

  const hoverScriptInMainZone =
    combinedStripMode &&
    tabKeyInZone(
      isoTabKey('hoverScript'),
      'main',
      combinedMainZoneTabKeys,
      combinedIsoZoneTabKeys,
    )
  const hoverScriptInIsoZone =
    !combinedStripMode ||
    tabKeyInZone(
      isoTabKey('hoverScript'),
      'iso',
      combinedMainZoneTabKeys,
      combinedIsoZoneTabKeys,
    )
  const isolationInMainZone =
    combinedStripMode &&
    tabKeyInZone(
      isoTabKey('isolation'),
      'main',
      combinedMainZoneTabKeys,
      combinedIsoZoneTabKeys,
    )
  const isolationInIsoZone =
    !combinedStripMode ||
    tabKeyInZone(
      isoTabKey('isolation'),
      'iso',
      combinedMainZoneTabKeys,
      combinedIsoZoneTabKeys,
    )

  const droneIsolationPreviewInIso =
    !!showAssetInIsolation && editDocumentFocus === 'isolation' && isolationInIsoZone
  const droneIsolationInMainViewport =
    !!showAssetInIsolation && editDocumentFocus === 'isolation' && isolationInMainZone
  const hoverScriptDocumentInIso =
    !!showAssetInIsolation && editDocumentFocus === 'hoverScript' && hoverScriptInIsoZone
  const hoverScriptInMainViewport =
    !!showAssetInIsolation && editDocumentFocus === 'hoverScript' && hoverScriptInMainZone

  const mainColumnDocumentFocused =
    editDocumentFocus === 'main' ||
    droneIsolationInMainViewport ||
    hoverScriptInMainViewport

  const simScriptTabInIsoZone = useCallback(
    (tab: MainScriptTabId) =>
      combinedStripMode &&
      tabKeyInZone(simTabKey(tab), 'iso', combinedMainZoneTabKeys, combinedIsoZoneTabKeys),
    [combinedStripMode, combinedMainZoneTabKeys, combinedIsoZoneTabKeys],
  )

  const simScriptTabInMainZone = useCallback(
    (tab: MainScriptTabId) =>
      !combinedStripMode ||
      tabKeyInZone(simTabKey(tab), 'main', combinedMainZoneTabKeys, combinedIsoZoneTabKeys),
    [combinedStripMode, combinedMainZoneTabKeys, combinedIsoZoneTabKeys],
  )

  const editScriptTabInIsoZone = useCallback(
    (tab: MainScriptTabId) =>
      combinedStripMode &&
      tabKeyInZone(mainScriptTabKey(tab), 'iso', combinedMainZoneTabKeys, combinedIsoZoneTabKeys),
    [combinedStripMode, combinedMainZoneTabKeys, combinedIsoZoneTabKeys],
  )

  const editScriptTabInMainZone = useCallback(
    (tab: MainScriptTabId) =>
      !combinedStripMode ||
      tabKeyInZone(mainScriptTabKey(tab), 'main', combinedMainZoneTabKeys, combinedIsoZoneTabKeys),
    [combinedStripMode, combinedMainZoneTabKeys, combinedIsoZoneTabKeys],
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
      onSimDocumentTabOrderChange?.(simDocumentTabOrder.filter((t) => t !== tab))
    },
    [
      mainDocumentEditorTab,
      onMainDocumentEditorTabChange,
      scriptTabsOpen,
      setScriptTabOpen,
      onSimDocumentTabOrderChange,
      simDocumentTabOrder,
    ],
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
      onSimDocumentTabOrderChange?.(simDocumentTabOrder.filter((t) => t !== tab))
    },
    [
      clientDocumentTab,
      onSplitClientDocumentTabChange,
      scriptTabsOpen,
      setScriptTabOpen,
      onSimDocumentTabOrderChange,
      simDocumentTabOrder,
    ],
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
      onSimDocumentTabOrderChange?.(simDocumentTabOrder.filter((t) => t !== tab))
    },
    [
      serverDocumentTab,
      onSplitServerDocumentTabChange,
      scriptTabsOpen,
      setScriptTabOpen,
      onSimDocumentTabOrderChange,
      simDocumentTabOrder,
    ],
  )

  const closeSimClientTab = useCallback(() => {
    if (!onSimClientTabOpenChange) return
    onSimClientTabOpenChange(false)
    onSimDocumentTabOrderChange?.(
      simDocumentTabOrder.filter((t) => t !== 'client' && !isSimClientInstanceId(t)),
    )
    if (!simServerTabOpen) return
    if (simFocus === 'client') {
      onSimViewportFocusChange?.('server')
      onSimFocusedStripTabChange?.('server')
      if (usePerColumnDocumentTabs) {
        onSplitServerDocumentTabChange?.('droneRacer')
      } else {
        onMainDocumentEditorTabChange('droneRacer')
      }
      onEditDocumentFocusChange('main')
    }
  }, [
    onSimClientTabOpenChange,
    onSimDocumentTabOrderChange,
    simDocumentTabOrder,
    simServerTabOpen,
    simFocus,
    onSimViewportFocusChange,
    onSimFocusedStripTabChange,
    usePerColumnDocumentTabs,
    onSplitServerDocumentTabChange,
    onMainDocumentEditorTabChange,
    onEditDocumentFocusChange,
  ])

  const closeSimClientInstanceTab = useCallback(
    (tab: SimDocumentStripTab) => {
      if (!isSimClientInstanceId(tab)) return
      const nextOrder = simDocumentTabOrder.filter((t) => t !== tab)
      onSimDocumentTabOrderChange?.(nextOrder)
      const remainingClients = nextOrder.filter(isSimClientInstanceId)
      if (remainingClients.length === 0) {
        onSimClientTabOpenChange?.(false)
      }
      if (simFocus === 'client' && simFocusedStripTab === tab) {
        const fallbackClient = remainingClients[0]
        if (fallbackClient == null) {
          onSimViewportFocusChange?.('server')
          onSimFocusedStripTabChange?.('server')
        } else {
          onSimViewportFocusChange?.('client')
          onSimFocusedStripTabChange?.(fallbackClient)
        }
        onMainDocumentEditorTabChange('droneRacer')
        onEditDocumentFocusChange('main')
      }
    },
    [
      simDocumentTabOrder,
      onSimDocumentTabOrderChange,
      onSimClientTabOpenChange,
      simFocus,
      simFocusedStripTab,
      onSimViewportFocusChange,
      onSimFocusedStripTabChange,
      onMainDocumentEditorTabChange,
      onEditDocumentFocusChange,
    ],
  )

  const selectSimClientStripTab = useCallback(
    (tab: SimDocumentStripTab) => {
      onSimViewportFocusChange?.('client')
      onSimFocusedStripTabChange?.(tab)
      onMainDocumentEditorTabChange('droneRacer')
      onEditDocumentFocusChange('main')
    },
    [
      onSimViewportFocusChange,
      onSimFocusedStripTabChange,
      onMainDocumentEditorTabChange,
      onEditDocumentFocusChange,
    ],
  )

  const isSimClientStripTabActive = useCallback(
    (tab: SimDocumentStripTab) => {
      if (!isSimClientStripTab(tab)) return false
      if (mainDocumentEditorTab !== 'droneRacer' || simFocus !== 'client') return false
      if (simMultiClientMode) return simFocusedStripTab === tab
      return tab === 'client'
    },
    [mainDocumentEditorTab, simFocus, simMultiClientMode, simFocusedStripTab],
  )

  const closeSimServerTab = useCallback(() => {
    if (!onSimServerTabOpenChange) return
    onSimServerTabOpenChange(false)
    onSimDocumentTabOrderChange?.(simDocumentTabOrder.filter((t) => t !== 'server'))
    if (!simClientTabOpen) return
    if (simFocus === 'server') {
      onSimViewportFocusChange?.('client')
      onSimFocusedStripTabChange?.(
        simMultiClientMode ? simClientInstanceId(1) : 'client',
      )
      if (usePerColumnDocumentTabs) {
        onSplitClientDocumentTabChange?.('droneRacer')
      } else {
        onMainDocumentEditorTabChange('droneRacer')
      }
      onEditDocumentFocusChange('main')
    }
  }, [
    onSimServerTabOpenChange,
    onSimDocumentTabOrderChange,
    simDocumentTabOrder,
    simClientTabOpen,
    simFocus,
    simMultiClientMode,
    onSimViewportFocusChange,
    onSimFocusedStripTabChange,
    usePerColumnDocumentTabs,
    onSplitClientDocumentTabChange,
    onMainDocumentEditorTabChange,
    onEditDocumentFocusChange,
  ])

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

  const simServerTabChromeActive =
    simFocus === 'server' && mainDocumentEditorTab === 'droneRacer'
  const splitClientPrimaryTabActive = clientDocumentTab === 'droneRacer'
  const splitServerPrimaryTabActive = serverDocumentTab === 'droneRacer'

  const strokeOn = !!playModeHasStroke
  const focusStrokeOn = !!playModeHasFocusStroke
  const tabStrokeOn = !!playModeTabStroke
  /** Main document strip: top stroke only while the main column has focus. */
  const mainStripTabStrokeActive = editDocumentFocus === 'main'

  /** Active = this tab is the visible document (only one active tab per strip). */
  const buildTabClass = (
    active: boolean,
    datamodel: ScriptDatamodelFocus | null,
    dragClass = '',
    tabStrokeActive?: boolean,
  ) => {
    const parts = [styles.tab, active ? styles.tabActive : styles.tabInactive]
    const showTabStroke = tabStrokeActive ?? active
    if (showTabStroke && tabStrokeOn) {
      parts.push(styles.tabActiveTopStroke)
      if (strokeOn && datamodel != null) {
        parts.push(
          datamodel === 'client'
            ? styles.tabActiveTopStrokeClient
            : datamodel === 'server'
              ? styles.tabActiveTopStrokeServer
              : styles.tabActiveTopStrokeDrone,
        )
      }
    }
    if (dragClass) parts.push(dragClass)
    return parts.join(' ')
  }

  const selectMainDroneRacerTab = useCallback(() => {
    onMainDocumentEditorTabChange('droneRacer')
    onEditDocumentFocusChange('main')
  }, [onEditDocumentFocusChange, onMainDocumentEditorTabChange])

  /** Edit: inset ring on main Drone Racer viewport (split = focused column; single = main doc focused). */
  const mainEditInsetRing =
    !clientSim &&
    (showAssetInIsolation
      ? mainColumnDocumentFocused
      : editDocumentFocus === 'main' &&
        (mainDocumentEditorTab === 'droneRacer' ||
          !!editDatamodelShowStroke ||
          mainDocumentScriptOpen))

  /** Asset isolation column — inset ring when a document in that column has focus (Drone preview or HoverScript). */
  const isolationColumnEditInsetRing =
    droneIsolationPreviewInIso || hoverScriptDocumentInIso

  /** Split workspace: inactive column — crop baked UI frame so only the focused column shows inset ring. */
  const mainInactiveInSplit = !!showAssetInIsolation && !mainColumnDocumentFocused

  const simTintHoleActive = !!tintActive
  /** Isolation / HoverScript column ring — edit always; test only when a stroke setting is on. */
  const showIsolationColumnChromeRing =
    isolationColumnEditInsetRing && (!clientSim || strokeOn || focusStrokeOn)

  /**
   * Test + Show asset in isolation: Client/Server sim chrome (stroke, rings, tint hole) only while
   * the sim document strip has focus — not when Drone isolation is the active document.
   */
  const simDocumentChromeActive =
    !clientSim || !showAssetInIsolation || mainColumnDocumentFocused

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
        : clientDocumentTab === 'clientScript'
      : mainDocumentEditorTab === 'clientScript' ||
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

  const openEditScriptTabs = useMemo(
    () => scriptTabOrder.filter((t) => isMainScriptTabOpen(t, scriptTabsOpen)),
    [scriptTabOrder, scriptTabsOpen],
  )

  const clientColumnStripTabs: SimDocumentStripTab[] = [
    'client',
    'scriptA',
    'scriptB',
    'clientScript',
  ]
  const serverColumnStripTabs: SimDocumentStripTab[] = ['server', 'serverScript']

  const openEditIsolationTabs = useMemo(
    () =>
      editIsolationTabOrder.filter((t) =>
        t === 'isolation' ? isolationTabOpen : hoverScriptTabOpen,
      ),
    [editIsolationTabOrder, isolationTabOpen, hoverScriptTabOpen],
  )

  const simCombinedTabDrag = useTabRowDragReorder(
    useCallback(
      (from, to) => {
        onSimDocumentTabOrderChange?.((order) => {
          const next = mergeVisibleTabReorder(
            order,
            order.filter((t) => isSimStripTabOpen(t)),
            from,
            to,
          )
          onScriptTabOrderChange?.((scriptOrder) =>
            syncScriptOrderFromSimOrder(next, scriptOrder),
          )
          return next
        })
      },
      [onSimDocumentTabOrderChange, onScriptTabOrderChange, isSimStripTabOpen],
    ),
  )

  const simSplitClientTabDrag = useTabRowDragReorder(
    useCallback(
      (from, to) => {
        onSimDocumentTabOrderChange?.((order) => {
          const visible = order.filter(
            (t) => clientColumnStripTabs.includes(t) && isSimStripTabOpen(t),
          )
          return mergeVisibleTabReorder(order, visible, from, to)
        })
      },
      [
        onSimDocumentTabOrderChange,
        simClientTabOpen,
        simServerTabOpen,
        scriptATabOpen,
        scriptBTabOpen,
        clientScriptTabOpen,
        serverScriptTabOpen,
      ],
    ),
  )

  const simSplitServerTabDrag = useTabRowDragReorder(
    useCallback(
      (from, to) => {
        onSimDocumentTabOrderChange?.((order) => {
          const visible = order.filter(
            (t) => serverColumnStripTabs.includes(t) && isSimStripTabOpen(t),
          )
          return mergeVisibleTabReorder(order, visible, from, to)
        })
      },
      [
        onSimDocumentTabOrderChange,
        simClientTabOpen,
        simServerTabOpen,
        scriptATabOpen,
        scriptBTabOpen,
        clientScriptTabOpen,
        serverScriptTabOpen,
      ],
    ),
  )

  const editScriptTabDrag = useTabRowDragReorder(
    useCallback(
      (from, to) => {
        onScriptTabOrderChange?.((order) => {
          const next = mergeVisibleTabReorder(
            order,
            order.filter((t) => isMainScriptTabOpen(t, scriptTabsOpen)),
            from,
            to,
          )
          onSimDocumentTabOrderChange?.((simOrder) =>
            syncSimOrderFromScriptOrder(simOrder, next),
          )
          return next
        })
      },
      [onScriptTabOrderChange, onSimDocumentTabOrderChange, scriptTabsOpen],
    ),
  )

  const editIsolationTabDrag = useTabRowDragReorder(
    useCallback(
      (from, to) => {
        onEditIsolationTabOrderChange?.((order) =>
          mergeVisibleTabReorder(
            order,
            order.filter((t) => (t === 'isolation' ? isolationTabOpen : hoverScriptTabOpen)),
            from,
            to,
          ),
        )
      },
      [onEditIsolationTabOrderChange, isolationTabOpen, hoverScriptTabOpen],
    ),
  )

  const renderDocumentSecondaryTabs = (
    activeTab: MainDocumentEditorTab,
    onTabChange: (tab: MainDocumentEditorTab) => void,
    onCloseScriptTab: (tab: MainScriptTabId) => void,
    orderedOpenTabs: MainScriptTabId[],
    drag: TabRowDragBindings,
    extraTabs?: { clientScript?: boolean; serverScript?: boolean },
  ) => {
    const selectDroneRacerScriptTab = (tab: 'scriptA' | 'scriptB') => {
      onEditDocumentFocusChange('main')
      onTabChange(tab)
    }

    const showTab = (tabId: MainScriptTabId) => {
      if (tabId === 'clientScript') return extraTabs?.clientScript ?? false
      if (tabId === 'serverScript') return extraTabs?.serverScript ?? false
      return isMainScriptTabOpen(tabId, scriptTabsOpen)
    }

    return (
      <>
        {orderedOpenTabs.filter(showTab).map((tabId, tabIndex) => {
          const tabClass = (selected: boolean) =>
            buildTabClass(
              selected,
              selected ? scriptTabDatamodelFocus(tabId as MainDocumentEditorTab) : null,
              tabDragClasses(drag, tabIndex),
              selected && mainStripTabStrokeActive,
            )

          switch (tabId) {
            case 'scriptA':
              return (
                <TabWithPathTooltip
                  key="scriptA"
                  path={TAB_PATH_DRONE_RACER_SCRIPT_A}
                  role="tab"
                  tabIndex={0}
                  aria-selected={activeTab === 'scriptA'}
                  className={tabClass(activeTab === 'scriptA')}
                  {...drag.getTabProps(tabIndex)}
                  {...tabActivateHandlers(drag, () => selectDroneRacerScriptTab('scriptA'))}
                >
                  <TabScriptEditIcon />
                  <span>Script</span>
                  <TabCloseButton onClose={() => onCloseScriptTab('scriptA')} />
                </TabWithPathTooltip>
              )
            case 'scriptB':
              return (
                <TabWithPathTooltip
                  key="scriptB"
                  path={TAB_PATH_DRONE_RACER_SCRIPT_B}
                  role="tab"
                  tabIndex={0}
                  aria-selected={activeTab === 'scriptB'}
                  className={tabClass(activeTab === 'scriptB')}
                  {...drag.getTabProps(tabIndex)}
                  {...tabActivateHandlers(drag, () => selectDroneRacerScriptTab('scriptB'))}
                >
                  <TabScriptEditIcon />
                  <span>Script</span>
                  <TabCloseButton onClose={() => onCloseScriptTab('scriptB')} />
                </TabWithPathTooltip>
              )
            case 'clientScript':
              return (
                <TabWithPathTooltip
                  key="clientScript"
                  path={clientScriptDocument.tabPath}
                  role="tab"
                  tabIndex={0}
                  aria-selected={activeTab === 'clientScript'}
                  className={tabClass(activeTab === 'clientScript')}
                  {...drag.getTabProps(tabIndex)}
                  {...tabActivateHandlers(drag, () => {
                    onTabChange('clientScript')
                    if (clientSim) onSimViewportFocusChange?.('client')
                  })}
                >
                  {clientSim ? <TabClientSimDocumentIcon /> : <TabLocalScriptEditIcon />}
                  <span>{clientScriptDocument.tabLabel}</span>
                  <TabCloseButton onClose={() => onCloseScriptTab('clientScript')} />
                </TabWithPathTooltip>
              )
            case 'serverScript':
              return (
                <TabWithPathTooltip
                  key="serverScript"
                  path={SERVER_SCRIPT_TAB_PATH}
                  role="tab"
                  tabIndex={0}
                  aria-selected={activeTab === 'serverScript'}
                  className={tabClass(activeTab === 'serverScript')}
                  {...drag.getTabProps(tabIndex)}
                  {...tabActivateHandlers(drag, () => {
                    onTabChange('serverScript')
                    if (clientSim) onSimViewportFocusChange?.('server')
                  })}
                >
                  {clientSim ? <TabServerSimDocumentIcon /> : <TabScriptEditIcon />}
                  <span>{SERVER_SCRIPT_TAB_LABEL}</span>
                  <TabCloseButton onClose={() => onCloseScriptTab('serverScript')} />
                </TabWithPathTooltip>
              )
            default:
              return null
          }
        })}
      </>
    )
  }

  const renderSimDocumentStripTab = (
    tabId: SimDocumentStripTab,
    tabIndex: number,
    drag: TabRowDragBindings | DualZoneTabDragBindings,
    strip: {
      activeTab: MainDocumentEditorTab
      onTabChange: (tab: MainDocumentEditorTab) => void
      onCloseScriptTab: (tab: MainScriptTabId) => void
      isClientTabActive: (tab: SimDocumentStripTab) => boolean
      serverDmActive: boolean
    },
    dragZone?: CombinedTabStripZone,
  ) => {
    const selectDroneRacerScriptTab = (tab: 'scriptA' | 'scriptB') => {
      onEditDocumentFocusChange('main')
      strip.onTabChange(tab)
    }

    const simTabClass = (active: boolean, tabId: SimDocumentStripTab) =>
      buildTabClass(
        active,
        active ? simStripTabDatamodel(tabId) : null,
        tabDragClassesAny(drag, tabIndex, dragZone),
        active && mainStripTabStrokeActive,
      )

    if (isSimClientInstanceId(tabId)) {
      const clientIndex = parseSimClientInstanceIndex(tabId)
      const clientActive = strip.isClientTabActive(tabId)
      return (
        <TabWithPathTooltip
          key={tabId}
          path={`${TAB_PATH_DRONE_RACER_CLIENT} (${simClientInstanceLabel(clientIndex)})`}
          role="tab"
          tabIndex={0}
          aria-selected={clientActive}
          className={simTabClass(clientActive, tabId)}
          {...tabPropsAny(drag, tabIndex, dragZone)}
          {...tabActivateHandlersAny(drag, () => {
            strip.onTabChange('droneRacer')
            selectSimClientStripTab(tabId)
          })}
        >
          <TabClientSimDocumentIcon />
          <span>{simClientInstanceLabel(clientIndex)}</span>
          <TabCloseButton onClose={() => closeSimClientInstanceTab(tabId)} />
        </TabWithPathTooltip>
      )
    }

    switch (tabId) {
      case 'client':
        return (
          <TabWithPathTooltip
            key="client"
            path={TAB_PATH_DRONE_RACER_CLIENT}
            role="tab"
            tabIndex={0}
            aria-selected={strip.isClientTabActive('client')}
            className={simTabClass(strip.isClientTabActive('client'), 'client')}
            {...tabPropsAny(drag, tabIndex, dragZone)}
            {...tabActivateHandlersAny(drag, () => {
              strip.onTabChange('droneRacer')
              selectSimClientStripTab('client')
            })}
          >
            <TabClientSimDocumentIcon />
            <span>Client</span>
            <TabCloseButton onClose={closeSimClientTab} />
          </TabWithPathTooltip>
        )
      case 'server':
        return (
          <TabWithPathTooltip
            key="server"
            path={TAB_PATH_DRONE_RACER_SERVER}
            role="tab"
            tabIndex={0}
            aria-selected={strip.serverDmActive}
            className={simTabClass(strip.serverDmActive, 'server')}
            {...tabPropsAny(drag, tabIndex, dragZone)}
            {...tabActivateHandlersAny(drag, () => {
              strip.onTabChange('droneRacer')
              onSimViewportFocusChange?.('server')
              onSimFocusedStripTabChange?.('server')
              onEditDocumentFocusChange('main')
            })}
          >
            <TabServerSimDocumentIcon />
            <span>Server</span>
            <TabCloseButton onClose={closeSimServerTab} />
          </TabWithPathTooltip>
        )
      case 'scriptA':
        return (
          <TabWithPathTooltip
            key="scriptA"
            path={TAB_PATH_DRONE_RACER_SCRIPT_A}
            role="tab"
            tabIndex={0}
            aria-selected={strip.activeTab === 'scriptA'}
            className={simTabClass(strip.activeTab === 'scriptA', 'scriptA')}
            {...tabPropsAny(drag, tabIndex, dragZone)}
            {...tabActivateHandlersAny(drag, () => selectDroneRacerScriptTab('scriptA'))}
          >
            <TabScriptEditIcon />
            <span>Script</span>
            <TabCloseButton onClose={() => strip.onCloseScriptTab('scriptA')} />
          </TabWithPathTooltip>
        )
      case 'scriptB':
        return (
          <TabWithPathTooltip
            key="scriptB"
            path={TAB_PATH_DRONE_RACER_SCRIPT_B}
            role="tab"
            tabIndex={0}
            aria-selected={strip.activeTab === 'scriptB'}
            className={simTabClass(strip.activeTab === 'scriptB', 'scriptB')}
            {...tabPropsAny(drag, tabIndex, dragZone)}
            {...tabActivateHandlersAny(drag, () => selectDroneRacerScriptTab('scriptB'))}
          >
            <TabScriptEditIcon />
            <span>Script</span>
            <TabCloseButton onClose={() => strip.onCloseScriptTab('scriptB')} />
          </TabWithPathTooltip>
        )
      case 'clientScript':
        return (
          <TabWithPathTooltip
            key="clientScript"
            path={clientScriptDocument.tabPath}
            role="tab"
            tabIndex={0}
            aria-selected={strip.activeTab === 'clientScript'}
            className={simTabClass(strip.activeTab === 'clientScript', 'clientScript')}
            {...tabPropsAny(drag, tabIndex, dragZone)}
            {...tabActivateHandlersAny(drag, () => {
              strip.onTabChange('clientScript')
              if (clientSim) onSimViewportFocusChange?.('client')
            })}
          >
            {clientSim ? <TabClientSimDocumentIcon /> : <TabLocalScriptEditIcon />}
            <span>{clientScriptDocument.tabLabel}</span>
            <TabCloseButton onClose={() => strip.onCloseScriptTab('clientScript')} />
          </TabWithPathTooltip>
        )
      case 'serverScript':
        return (
          <TabWithPathTooltip
            key="serverScript"
            path={SERVER_SCRIPT_TAB_PATH}
            role="tab"
            tabIndex={0}
            aria-selected={strip.activeTab === 'serverScript'}
            className={simTabClass(strip.activeTab === 'serverScript', 'serverScript')}
            {...tabPropsAny(drag, tabIndex, dragZone)}
            {...tabActivateHandlersAny(drag, () => {
              strip.onTabChange('serverScript')
              if (clientSim) onSimViewportFocusChange?.('server')
            })}
          >
            {clientSim ? <TabServerSimDocumentIcon /> : <TabScriptEditIcon />}
            <span>{SERVER_SCRIPT_TAB_LABEL}</span>
            <TabCloseButton onClose={() => strip.onCloseScriptTab('serverScript')} />
          </TabWithPathTooltip>
        )
      default:
        return null
    }
  }

  const renderSimDocumentStripRow = (
    orderedTabs: SimDocumentStripTab[],
    strip: {
      activeTab: MainDocumentEditorTab
      onTabChange: (tab: MainDocumentEditorTab) => void
      onCloseScriptTab: (tab: MainScriptTabId) => void
      isClientTabActive: (tab: SimDocumentStripTab) => boolean
      serverDmActive: boolean
    },
    rowProps: { className?: string; 'data-node-id'?: string },
    drag: TabRowDragBindings,
  ) => (
    <div
      ref={drag.rowRef}
      className={`${styles.tabRow} ${rowProps.className ?? ''}`.trim()}
      data-node-id={rowProps['data-node-id']}
    >
      {orderedTabs
        .filter(isSimStripTabOpen)
        .map((tabId, tabIndex) => renderSimDocumentStripTab(tabId, tabIndex, drag, strip))}
      <div className={styles.tabRowUnderline} aria-hidden>
        <img src={publicAssetUrl('assets/tab-underline.svg')} alt="" />
      </div>
    </div>
  )

  const tabbedStripContext = {
    activeTab: mainDocumentEditorTab,
    onTabChange: onMainDocumentEditorTabChange,
    onCloseScriptTab: closeMainDocumentScriptTab,
    isClientTabActive: isSimClientStripTabActive,
    serverDmActive: simServerTabChromeActive,
  }

  const renderCombinedIsolationTab = (
    tabId: EditIsolationTabId,
    tabIndex: number,
    zone: CombinedTabStripZone,
  ) => {
    const tabClass = (selected: boolean) =>
      buildTabClass(selected, selected ? 'drone' : null, tabDragClassesAny(combinedTabDrag, tabIndex, zone))

    if (tabId === 'isolation') {
      return (
        <TabWithPathTooltip
          key="isolation"
          path={TAB_PATH_DRONE_ASSET}
          role="tab"
          tabIndex={0}
          aria-selected={editDocumentFocus === 'isolation'}
          className={tabClass(editDocumentFocus === 'isolation')}
          {...tabPropsAny(combinedTabDrag, tabIndex, zone)}
          {...tabActivateHandlersAny(combinedTabDrag, () =>
            onEditDocumentFocusChange('isolation'),
          )}
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
      )
    }

    return (
      <TabWithPathTooltip
        key="hoverScript"
        path={TAB_PATH_DRONE_HOVERSCRIPT}
        role="tab"
        tabIndex={0}
        aria-selected={editDocumentFocus === 'hoverScript'}
        className={tabClass(editDocumentFocus === 'hoverScript')}
        {...tabPropsAny(combinedTabDrag, tabIndex, zone)}
        {...tabActivateHandlersAny(combinedTabDrag, () =>
          onEditDocumentFocusChange('hoverScript'),
        )}
      >
        <TabDiamond />
        <span>{HOVER_SCRIPT_TAB_LABEL}</span>
        <TabCloseButton onClose={() => closeEditIsolationTab('hoverScript')} />
      </TabWithPathTooltip>
    )
  }

  const renderCombinedEditScriptTab = (
    tabId: MainScriptTabId,
    tabIndex: number,
    zone: CombinedTabStripZone,
  ) => {
    const tabClass = (selected: boolean) =>
      buildTabClass(
        selected,
        selected ? scriptTabDatamodelFocus(tabId as MainDocumentEditorTab) : null,
        tabDragClassesAny(combinedTabDrag, tabIndex, zone),
        zone === 'main' ? selected && mainStripTabStrokeActive : undefined,
      )

    const selectDroneRacerScriptTab = (tab: 'scriptA' | 'scriptB') => {
      onEditDocumentFocusChange('main')
      onMainDocumentEditorTabChange(tab)
    }

    switch (tabId) {
      case 'scriptA':
        return (
          <TabWithPathTooltip
            key="scriptA"
            path={TAB_PATH_DRONE_RACER_SCRIPT_A}
            role="tab"
            tabIndex={0}
            aria-selected={mainDocumentEditorTab === 'scriptA'}
            className={tabClass(mainDocumentEditorTab === 'scriptA')}
            {...tabPropsAny(combinedTabDrag, tabIndex, zone)}
            {...tabActivateHandlersAny(combinedTabDrag, () => selectDroneRacerScriptTab('scriptA'))}
          >
            <TabScriptEditIcon />
            <span>Script</span>
            <TabCloseButton onClose={() => closeMainDocumentScriptTab('scriptA')} />
          </TabWithPathTooltip>
        )
      case 'scriptB':
        return (
          <TabWithPathTooltip
            key="scriptB"
            path={TAB_PATH_DRONE_RACER_SCRIPT_B}
            role="tab"
            tabIndex={0}
            aria-selected={mainDocumentEditorTab === 'scriptB'}
            className={tabClass(mainDocumentEditorTab === 'scriptB')}
            {...tabPropsAny(combinedTabDrag, tabIndex, zone)}
            {...tabActivateHandlersAny(combinedTabDrag, () => selectDroneRacerScriptTab('scriptB'))}
          >
            <TabScriptEditIcon />
            <span>Script</span>
            <TabCloseButton onClose={() => closeMainDocumentScriptTab('scriptB')} />
          </TabWithPathTooltip>
        )
      case 'clientScript':
        return (
          <TabWithPathTooltip
            key="clientScript"
            path={clientScriptDocument.tabPath}
            role="tab"
            tabIndex={0}
            aria-selected={mainDocumentEditorTab === 'clientScript'}
            className={tabClass(mainDocumentEditorTab === 'clientScript')}
            {...tabPropsAny(combinedTabDrag, tabIndex, zone)}
            {...tabActivateHandlersAny(combinedTabDrag, () => {
              onEditDocumentFocusChange('main')
              onMainDocumentEditorTabChange('clientScript')
            })}
          >
            <TabLocalScriptEditIcon />
            <span>{clientScriptDocument.tabLabel}</span>
            <TabCloseButton onClose={() => closeMainDocumentScriptTab('clientScript')} />
          </TabWithPathTooltip>
        )
      case 'serverScript':
        return (
          <TabWithPathTooltip
            key="serverScript"
            path={SERVER_SCRIPT_TAB_PATH}
            role="tab"
            tabIndex={0}
            aria-selected={mainDocumentEditorTab === 'serverScript'}
            className={tabClass(mainDocumentEditorTab === 'serverScript')}
            {...tabPropsAny(combinedTabDrag, tabIndex, zone)}
            {...tabActivateHandlersAny(combinedTabDrag, () => {
              onEditDocumentFocusChange('main')
              onMainDocumentEditorTabChange('serverScript')
            })}
          >
            <TabScriptEditIcon />
            <span>{SERVER_SCRIPT_TAB_LABEL}</span>
            <TabCloseButton onClose={() => closeMainDocumentScriptTab('serverScript')} />
          </TabWithPathTooltip>
        )
      default:
        return null
    }
  }

  const renderCombinedZoneTab = (
    key: CombinedTabKey,
    tabIndex: number,
    zone: CombinedTabStripZone,
  ) => {
    if (key.startsWith('sim:')) {
      return renderSimDocumentStripTab(
        key.slice(4) as SimDocumentStripTab,
        tabIndex,
        combinedTabDrag,
        tabbedStripContext,
        zone,
      )
    }
    if (key.startsWith('iso:')) {
      return renderCombinedIsolationTab(key.slice(4) as EditIsolationTabId, tabIndex, zone)
    }
    return renderCombinedEditScriptTab(key.slice(5) as MainScriptTabId, tabIndex, zone)
  }

  const renderCombinedZoneTabRow = (
    zone: CombinedTabStripZone,
    keys: CombinedTabKey[],
    rowProps: { className?: string; 'data-node-id'?: string },
  ) => (
    <div
      ref={zone === 'main' ? combinedTabDrag.mainRowRef : combinedTabDrag.isoRowRef}
      className={`${styles.tabRow} ${zone === 'iso' ? styles.assetIsolationTabRow : ''} ${rowProps.className ?? ''}`.trim()}
      data-node-id={rowProps['data-node-id']}
    >
      {keys
        .filter((key) => {
          if (!clientSim || !key.startsWith('sim:')) return true
          const tab = key.slice(4) as SimDocumentStripTab
          return isSimStripTabOpen(tab)
        })
        .map((key, tabIndex) => renderCombinedZoneTab(key, tabIndex, zone))}
      <div className={styles.tabRowUnderline} aria-hidden>
        <img src={publicAssetUrl('assets/tab-underline.svg')} alt="" />
      </div>
    </div>
  )

  const simClientServerTabRow = combinedStripMode
    ? renderCombinedZoneTabRow('main', combinedMainZoneTabKeys, {
        'data-node-id': '3841:115140-sim-client-server',
      })
    : renderSimDocumentStripRow(
        simDocumentTabOrder,
        tabbedStripContext,
        { 'data-node-id': '3841:115140-sim-client-server' },
        simCombinedTabDrag,
      )

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
        openEditScriptTabs,
        editScriptTabDrag,
        combinedExtraScriptTabs,
      )

  const simSplitClientTabRow = renderSimDocumentStripRow(
    simDocumentTabOrder.filter((tab) => clientColumnStripTabs.includes(tab)),
    {
      activeTab: clientDocumentTab,
      onTabChange: onSplitClientDocumentTabChange!,
      onCloseScriptTab: closeSplitClientScriptTab,
      isClientTabActive: isSimClientStripTabActive,
      serverDmActive: false,
    },
    {
      className: styles.simSplitDocumentTabRow,
      'data-node-id': '3841:115140-split-client-tabs',
    },
    simSplitClientTabDrag,
  )

  const simSplitServerTabRow = renderSimDocumentStripRow(
    simDocumentTabOrder.filter((tab) => serverColumnStripTabs.includes(tab)),
    {
      activeTab: serverDocumentTab,
      onTabChange: onSplitServerDocumentTabChange!,
      onCloseScriptTab: closeSplitServerScriptTab,
      isClientTabActive: () => false,
      serverDmActive: splitServerPrimaryTabActive,
    },
    {
      className: styles.simSplitDocumentTabRow,
      'data-node-id': '3841:113029-split-server-tabs',
    },
    simSplitServerTabDrag,
  )

  const assetIsolationTabRow = combinedStripMode ? (
    renderCombinedZoneTabRow('iso', combinedIsoZoneTabKeys, {
      'data-node-id': '3841:115139-iso-tabs',
    })
  ) : (
    <div
      ref={editIsolationTabDrag.rowRef}
      className={`${styles.tabRow} ${styles.assetIsolationTabRow}`}
      data-node-id="3841:115139-iso-tabs"
    >
        {openEditIsolationTabs.map((tabId, tabIndex) => {
        const tabClass = (selected: boolean) =>
          buildTabClass(selected, selected ? 'drone' : null, tabDragClasses(editIsolationTabDrag, tabIndex))

        if (tabId === 'isolation') {
          return (
            <TabWithPathTooltip
              key="isolation"
              path={TAB_PATH_DRONE_ASSET}
              role="tab"
              tabIndex={0}
              aria-selected={editDocumentFocus === 'isolation'}
              className={tabClass(editDocumentFocus === 'isolation')}
              {...editIsolationTabDrag.getTabProps(tabIndex)}
              {...tabActivateHandlers(editIsolationTabDrag, () =>
                onEditDocumentFocusChange('isolation'),
              )}
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
          )
        }

        return (
          <TabWithPathTooltip
            key="hoverScript"
            path={TAB_PATH_DRONE_HOVERSCRIPT}
            role="tab"
            tabIndex={0}
            aria-selected={editDocumentFocus === 'hoverScript'}
            className={tabClass(editDocumentFocus === 'hoverScript')}
            {...editIsolationTabDrag.getTabProps(tabIndex)}
            {...tabActivateHandlers(editIsolationTabDrag, () =>
              onEditDocumentFocusChange('hoverScript'),
            )}
          >
            <TabDiamond />
            <span>{HOVER_SCRIPT_TAB_LABEL}</span>
            <TabCloseButton onClose={() => closeEditIsolationTab('hoverScript')} />
          </TabWithPathTooltip>
        )
      })}
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
        {(() => {
          const isoColumnScriptTab =
            combinedStripMode &&
            mainDocumentScriptOpen &&
            (clientSim
              ? simScriptTabInIsoZone(mainDocumentEditorTab as MainScriptTabId)
              : editScriptTabInIsoZone(mainDocumentEditorTab as MainScriptTabId))
              ? mainDocumentEditorTab
              : null

          if (isoColumnScriptTab != null) {
            return renderDocumentScriptBody(isoColumnScriptTab)
          }
          if (hoverScriptDocumentInIso) {
            return (
              <pre className={styles.hoverScriptEditor} spellCheck={false}>
                hello world
              </pre>
            )
          }
          return (
            <img
              src={
                droneIsolationPreviewInIso
                  ? ASSET_ISOLATION_IMAGE_FOCUSED
                  : ASSET_ISOLATION_IMAGE
              }
              alt=""
            />
          )
        })()}
        {showIsolationColumnChromeRing ? (
          <div className={styles.editWorkspaceInsetRing} aria-hidden />
        ) : null}
      </div>
    </aside>
  )

  const floatingDocumentPortal =
    documentUndocked &&
    showAssetInIsolation &&
    framePortalTarget != null &&
    onFloatingDocumentPositionChange != null &&
    onDockDocument != null &&
    frameRef != null
      ? createPortal(
          <FloatingDocumentWindow
            frameRef={frameRef}
            title="Drone Racer"
            position={floatingDocumentPosition}
            onPositionChange={onFloatingDocumentPositionChange}
            onDock={onDockDocument}
            titleAlign={panelChromeTitleAlign}
          >
            <div
              className={styles.floatingDocumentTabStrip}
              onPointerDown={() =>
                onEditDocumentFocusChange(
                  editDocumentFocus === 'hoverScript' ? 'hoverScript' : 'isolation',
                )
              }
            >
              {assetIsolationTabRow}
            </div>
            {assetIsolationColumnAside}
          </FloatingDocumentWindow>,
          framePortalTarget,
        )
      : null

  /** Zone placement decides which column shows the script; not `editDocumentFocus` (iso panel chrome). */
  const mainViewportScriptTab =
    mainDocumentScriptOpen &&
    (clientSim
      ? simScriptTabInMainZone(mainDocumentEditorTab as MainScriptTabId)
      : editScriptTabInMainZone(mainDocumentEditorTab as MainScriptTabId))
      ? mainDocumentEditorTab
      : null

  const renderMainColumnBody = () => {
    if (droneIsolationInMainViewport) {
      return (
        <img
          src={
            editDocumentFocus === 'isolation'
              ? ASSET_ISOLATION_IMAGE_FOCUSED
              : ASSET_ISOLATION_IMAGE
          }
          alt=""
        />
      )
    }
    if (hoverScriptInMainViewport) {
      return (
        <pre className={styles.hoverScriptEditor} spellCheck={false}>
          hello world
        </pre>
      )
    }
    if (mainViewportScriptTab != null) {
      return renderDocumentScriptBody(mainViewportScriptTab)
    }
    return null
  }

  /** Single tabbed Client/Server + Script strip: Script lives in client viewport; Server sim is server viewport. */
  const simTabbedBodyViewport = (() => {
    /**
     * Drone Racer script tabs must use `renderMainViewport` so play-mode semantic / focus
     * inset rings apply. The generic main-column wrapper only renders `mainEditInsetRing`,
     * which is edit-only (`!clientSim`) — rings vanished when Client/Server tabs were closed.
     */
    if (
      mainViewportScriptTab != null &&
      !droneIsolationInMainViewport &&
      !hoverScriptInMainViewport
    ) {
      return renderMainViewport(simDocumentChromeActive, mainViewportScriptTab)
    }

    const mainColumnOverride = renderMainColumnBody()
    if (mainColumnOverride != null) {
      return (
        <div
          className={[styles.viewport, mainInactiveInSplit ? styles.editWorkspaceInactiveBleedCrop : null]
            .filter(Boolean)
            .join(' ')}
          onPointerDown={() => {
            if (clientSim) onSimViewportFocusChange?.('client')
            onEditDocumentFocusChange(
              hoverScriptInMainViewport
                ? 'hoverScript'
                : droneIsolationInMainViewport
                  ? 'isolation'
                  : 'main',
            )
          }}
        >
          {mainColumnOverride}
          {mainEditInsetRing ? (
            <div className={styles.editWorkspaceInsetRing} aria-hidden />
          ) : null}
        </div>
      )
    }
    if (
      simClientTabOpen &&
      (!simServerTabOpen || simFocus === 'client')
    ) {
      return renderMainViewport(simDocumentChromeActive, null)
    }
    if (simServerTabOpen) {
      return renderServerTestViewport(simDocumentChromeActive)
    }
    return null
  })()

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
          <>
            <div className={styles.documentPanel} data-node-id="3841:115139">
            <div className={styles.testTriptychTabStrip}>
              {simClientTabOpen ? (
                <div
                  className={styles.testTriptychTabCol}
                  onPointerDown={() => {
                    onSimViewportFocusChange?.('client')
                    onEditDocumentFocusChange('main')
                  }}
                >
                  {simSplitClientTabRow}
                </div>
              ) : null}
              {simServerTabOpen ? (
                <div
                  className={styles.testTriptychTabCol}
                  onPointerDown={() => {
                    onSimViewportFocusChange?.('server')
                    onEditDocumentFocusChange('main')
                  }}
                >
                  {simSplitServerTabRow}
                </div>
              ) : null}
              {showIsolationDocked ? (
                <div className={styles.editTabStripIso}>{assetIsolationTabRow}</div>
              ) : null}
            </div>
            <div className={styles.testTriptychBodyRow}>
              {simClientTabOpen ? (
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
              ) : null}
              {simServerTabOpen ? (
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
              ) : null}
              {showIsolationDocked ? assetIsolationColumnAside : null}
            </div>
          </div>
            {floatingDocumentPortal}
          </>
        )
      }
      return (
        <>
          <div className={styles.documentPanel} data-node-id="3841:115139">
          <div className={styles.editCombinedTabStrip}>
            <div
              className={styles.editTabStripMain}
              onPointerDown={() => onEditDocumentFocusChange('main')}
            >
              {simClientServerTabRow}
            </div>
            {showIsolationDocked ? (
              <div className={styles.editTabStripIso}>{assetIsolationTabRow}</div>
            ) : null}
          </div>
          <div className={styles.editWorkspaceSplit}>
            <div className={styles.testSimClientServerHost}>
              <div className={styles.simTabbedBody}>{simTabbedBodyViewport}</div>
            </div>
            {showIsolationDocked ? assetIsolationColumnAside : null}
          </div>
        </div>
          {floatingDocumentPortal}
        </>
      )
    }

    if (playModeSplitView) {
      return (
        <div className={styles.documentPanel} data-node-id="3841:115139">
          <div className={styles.simSplitViewportRow}>
            {simClientTabOpen ? (
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
            ) : null}
            {simServerTabOpen ? (
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
            ) : null}
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
    <div
      ref={combinedStripMode ? combinedTabDrag.mainRowRef : editScriptTabDrag.rowRef}
      className={styles.tabRow}
      data-node-id="3841:115140"
    >
      <TabWithPathTooltip
        path={bunnyAssetWindow ? TAB_PATH_BUNNY_DOCUMENT : TAB_PATH_DRONE_RACER_DOCUMENT}
        role="tab"
        tabIndex={0}
        aria-selected={mainDocumentEditorTab === 'droneRacer'}
        className={buildTabClass(
          mainDocumentEditorTab === 'droneRacer',
          mainDocumentEditorTab === 'droneRacer'
            ? droneRacerDocumentTabDatamodel(simFocus, !!clientSim)
            : null,
          '',
          mainDocumentEditorTab === 'droneRacer' && mainStripTabStrokeActive,
        )}
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
      {combinedStripMode
        ? combinedMainZoneTabKeys.map((key, tabIndex) =>
            renderCombinedZoneTab(key, tabIndex, 'main'),
          )
        : optionalScriptTabs}
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
    <>
      <div
        className={styles.documentPanel}
        data-node-id="3841:115139"
        {...documentPanelBunnyFocusProps}
      >
        {showIsolationDocked && !clientSim ? (
          <div className={styles.editCombinedTabStrip}>
            <div className={styles.editTabStripMain} onPointerDown={() => onEditDocumentFocusChange('main')}>
              {mainDocumentTabRow}
            </div>
            <div className={styles.editTabStripIso}>{assetIsolationTabRow}</div>
          </div>
        ) : (
          mainDocumentTabRow
        )}
        {showIsolationDocked && !clientSim ? (
          <div className={styles.editWorkspaceSplit}>
            {(() => {
              const mainColumnOverride = renderMainColumnBody()
              if (mainColumnOverride != null) {
                return (
                  <div
                    className={styles.viewport}
                    onPointerDown={() =>
                      onEditDocumentFocusChange(
                        hoverScriptInMainViewport
                          ? 'hoverScript'
                          : droneIsolationInMainViewport
                            ? 'isolation'
                            : 'main',
                      )
                    }
                  >
                    {mainColumnOverride}
                    {mainEditInsetRing ? (
                      <div className={styles.editWorkspaceInsetRing} aria-hidden />
                    ) : null}
                  </div>
                )
              }
              return renderMainViewport(false, mainViewportScriptTab)
            })()}
            {assetIsolationColumnAside}
          </div>
        ) : (
          renderMainViewport(false, mainViewportScriptTab)
        )}
      </div>
      {floatingDocumentPortal}
    </>
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
  /** Server & Clients: one Explorer selection per client instance tab. */
  const [simExplorerSelectionByClient, setSimExplorerSelectionByClient] = useState<
    Record<number, string | null>
  >({})
  const [simMultiClientMode, setSimMultiClientMode] = useState(false)
  const [simClientInstanceCount, setSimClientInstanceCount] = useState(1)
  const [simFocusedStripTab, setSimFocusedStripTab] = useState<SimDocumentStripTab>('client')
  /** Play mode: inset ring on focused client/server viewport — brand hue (Testing UI: Has semantic stroke). */
  const [playModeHasStroke, setPlayModeHasStroke] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.playModeHasStroke,
  )
  /** Play mode: sim viewport focus ring matches edit Drone Racer / asset isolation white inset (Testing UI). */
  const [playModeHasFocusStroke, setPlayModeHasFocusStroke] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.playModeHasFocusStroke,
  )
  const [playModeTabStroke, setPlayModeTabStroke] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.playModeTabStroke,
  )
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
  const [showFullBreadcrumbWhenDetached, setShowFullBreadcrumbWhenDetached] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.showFullBreadcrumbWhenDetached,
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
  const [simClientTabOpen, setSimClientTabOpen] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.simClientTabOpen,
  )
  const [simServerTabOpen, setSimServerTabOpen] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.simServerTabOpen,
  )
  const [toggleOpensDmIfClosed, setToggleOpensDmIfClosed] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.toggleOpensDmIfClosed,
  )
  const [simDocumentTabOrder, setSimDocumentTabOrder] = useState<SimDocumentStripTab[]>(() =>
    buildDefaultSimDocumentTabOrder({
      client: PROTOTYPE_SETTINGS_DEFAULTS.simClientTabOpen,
      server: PROTOTYPE_SETTINGS_DEFAULTS.simServerTabOpen,
      scriptA: PROTOTYPE_SETTINGS_DEFAULTS.scriptATabOpen,
      scriptB: PROTOTYPE_SETTINGS_DEFAULTS.scriptBTabOpen,
      clientScript: PROTOTYPE_SETTINGS_DEFAULTS.clientScriptTabOpen,
      serverScript: PROTOTYPE_SETTINGS_DEFAULTS.serverScriptTabOpen,
    }),
  )
  const [scriptTabOrder, setScriptTabOrder] = useState<MainScriptTabId[]>(() => [
    ...MAIN_SCRIPT_TAB_ORDER,
  ])
  const [editIsolationTabOrder, setEditIsolationTabOrder] = useState<EditIsolationTabId[]>(() => [
    ...EDIT_ISOLATION_TAB_ORDER,
  ])
  const [combinedMainZoneKeys, setCombinedMainZoneKeys] = useState<PersistentTabKey[] | null>(null)
  const [combinedIsoZoneKeys, setCombinedIsoZoneKeys] = useState<PersistentTabKey[] | null>(null)
  const [isolationTabOpen, setIsolationTabOpen] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.isolationTabOpen,
  )
  const [hoverScriptTabOpen, setHoverScriptTabOpen] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.hoverScriptTabOpen,
  )
  const [clientScriptDocument, setClientScriptDocument] = useState<ClientScriptDocument>(
    DEFAULT_CLIENT_SCRIPT_DOCUMENT,
  )

  const toggleTestMenuView = useCallback(
    (target: TestAppMenuFocusTarget) => {
      if (!clientSimActive) return

      const isActive =
        target === 'server'
          ? simServerTabOpen
          : target === 'client'
            ? simClientTabOpen
            : simClientTabOpen &&
              simDocumentTabOrder.includes(simClientInstanceId(target.clientIndex))

      if (isActive) {
        if (target === 'server') {
          const nextOrder = simDocumentTabOrder.filter((t) => t !== 'server')
          setSimServerTabOpen(false)
          setSimDocumentTabOrder(nextOrder)
          if (simViewportFocus === 'server') {
            if (simClientTabOpen) {
              const clientTab: SimDocumentStripTab = simMultiClientMode
                ? nextOrder.find(isSimClientInstanceId) ?? simClientInstanceId(1)
                : 'client'
              setSimViewportFocus('client')
              setSimFocusedStripTab(clientTab)
            }
            setMainDocumentEditorTab('droneRacer')
            setEditWorkspaceDocumentFocus('main')
          }
          return
        }

        if (target === 'client') {
          setSimClientTabOpen(false)
          setSimDocumentTabOrder((order) =>
            order.filter((t) => t !== 'client' && !isSimClientInstanceId(t)),
          )
          if (simViewportFocus === 'client') {
            if (simServerTabOpen) {
              setSimViewportFocus('server')
              setSimFocusedStripTab('server')
            }
            setMainDocumentEditorTab('droneRacer')
            setEditWorkspaceDocumentFocus('main')
          }
          return
        }

        const tab = simClientInstanceId(target.clientIndex)
        const nextOrder = simDocumentTabOrder.filter((t) => t !== tab)
        const remainingClients = nextOrder.filter(isSimClientInstanceId)
        setSimDocumentTabOrder(nextOrder)
        if (remainingClients.length === 0) {
          setSimClientTabOpen(false)
        }
        if (simViewportFocus === 'client' && simFocusedStripTab === tab) {
          const fallbackClient = remainingClients[0]
          if (fallbackClient == null) {
            if (simServerTabOpen) {
              setSimViewportFocus('server')
              setSimFocusedStripTab('server')
            }
          } else {
            setSimFocusedStripTab(fallbackClient)
          }
          setMainDocumentEditorTab('droneRacer')
          setEditWorkspaceDocumentFocus('main')
        }
        return
      }

      const anchor = simStripTabAnchor(mainDocumentEditorTab, simViewportFocus)

      if (target === 'server') {
        setSimServerTabOpen(true)
        setSimDocumentTabOrder((order) =>
          order.includes('server') ? order : insertStripTabAfterAnchor(order, 'server', anchor),
        )
        setSimViewportFocus('server')
        setSimFocusedStripTab('server')
      } else if (target === 'client') {
        setSimClientTabOpen(true)
        setSimDocumentTabOrder((order) =>
          order.includes('client') ? order : insertStripTabAfterAnchor(order, 'client', anchor),
        )
        setSimViewportFocus('client')
        setSimFocusedStripTab('client')
      } else {
        const tab = simClientInstanceId(target.clientIndex)
        setSimClientTabOpen(true)
        setSimViewportFocus('client')
        setSimFocusedStripTab(tab)
        setSimDocumentTabOrder((order) =>
          order.includes(tab)
            ? order
            : insertClientInstanceTabInOrder(order, tab, simClientInstanceCount),
        )
      }

      setMainDocumentEditorTab('droneRacer')
      setEditWorkspaceDocumentFocus('main')
    },
    [
      clientSimActive,
      mainDocumentEditorTab,
      simViewportFocus,
      simFocusedStripTab,
      simServerTabOpen,
      simClientTabOpen,
      simDocumentTabOrder,
      simMultiClientMode,
      simClientInstanceCount,
    ],
  )

  const openCameraZoomScript = useCallback(() => {
    setClientScriptDocument(CAMERA_ZOOM_SCRIPT_DOCUMENT)
    setClientScriptTabOpen(true)
    if (clientSimActive) {
      const anchor = simStripTabAnchor(mainDocumentEditorTab, simViewportFocus)
      setSimDocumentTabOrder((order) =>
        insertStripTabAfterAnchor(order, 'clientScript', anchor),
      )
    }
    if (clientSimActive && playModeSplitView) {
      setSplitClientDocumentTab('clientScript')
      setSimViewportFocus('client')
    } else {
      setMainDocumentEditorTab('clientScript')
    }
    setEditWorkspaceDocumentFocus('main')
  }, [clientSimActive, playModeSplitView, mainDocumentEditorTab, simViewportFocus])

  const openClientScriptTab = useCallback(() => {
    setClientScriptDocument(DEFAULT_CLIENT_SCRIPT_DOCUMENT)
    setClientScriptTabOpen(true)
    if (clientSimActive) {
      const anchor = simStripTabAnchor(mainDocumentEditorTab, simViewportFocus)
      setSimDocumentTabOrder((order) =>
        insertStripTabAfterAnchor(order, 'clientScript', anchor),
      )
    }
    if (clientSimActive && playModeSplitView) {
      setSplitClientDocumentTab('clientScript')
      setSimViewportFocus('client')
    } else {
      setMainDocumentEditorTab('clientScript')
    }
    setEditWorkspaceDocumentFocus('main')
  }, [clientSimActive, playModeSplitView, mainDocumentEditorTab, simViewportFocus])

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
    if (clientSimActive) {
      const anchor = simStripTabAnchor(mainDocumentEditorTab, simViewportFocus)
      setSimDocumentTabOrder((order) =>
        insertStripTabAfterAnchor(order, 'serverScript', anchor),
      )
    }
    if (clientSimActive && playModeSplitView) {
      setSplitServerDocumentTab('serverScript')
      setSimViewportFocus('server')
    } else {
      setMainDocumentEditorTab('serverScript')
    }
    setEditWorkspaceDocumentFocus('main')
  }, [clientSimActive, playModeSplitView, mainDocumentEditorTab, simViewportFocus])

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

    if (isDroneRacerMainScriptTab(explorerChromeDocumentTab)) {
      return clientSimActive ? 'edit-drone' : null
    }

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

  const simActiveClientInstanceIndex = useMemo(() => {
    if (!simMultiClientMode || explorerSimFocusForTree !== 'client') return null
    return clientInstanceIndexFromStripTab(simFocusedStripTab) ?? 1
  }, [simMultiClientMode, explorerSimFocusForTree, simFocusedStripTab])

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
      if (
        simMultiClientMode &&
        explorerHeaderSimFocus === 'client' &&
        simActiveClientInstanceIndex != null
      ) {
        return `Drone Racer / ${simClientInstanceLabel(simActiveClientInstanceIndex)}`
      }
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
    simMultiClientMode,
    simActiveClientInstanceIndex,
  ])

  const explorerBreadcrumbDisplaySegment = useMemo(
    () =>
      breadcrumbSegmentForDisplay(
        explorerBreadcrumbSegment,
        !showFullBreadcrumbWhenDetached,
      ),
    [explorerBreadcrumbSegment, showFullBreadcrumbWhenDetached],
  )

  const explorerBreadcrumbSegmentFloating = useMemo(
    () => breadcrumbSegmentForDisplay(explorerBreadcrumbSegment, true),
    [explorerBreadcrumbSegment],
  )

  const explorerPanelTitleBase = useCallback(
    (displaySegment: string | null) =>
      explorerNoBadge
        ? 'Explorer'
        : explorerShowBreadcrumb
          ? formatExplorerPanelTitle(displaySegment)
          : clientSimActive && explorerFocusBadge
            ? 'Explorer'
            : explorerShowsClientServerFocusBadge
              ? explorerHeaderSimFocus === 'server'
                ? 'Explorer (Server)'
                : simMultiClientMode && simActiveClientInstanceIndex != null
                  ? `Explorer (${simClientInstanceLabel(simActiveClientInstanceIndex)})`
                  : 'Explorer (Client)'
              : 'Explorer',
    [
      explorerNoBadge,
      explorerShowBreadcrumb,
      clientSimActive,
      explorerFocusBadge,
      explorerShowsClientServerFocusBadge,
      explorerHeaderSimFocus,
      simMultiClientMode,
      simActiveClientInstanceIndex,
    ],
  )

  const explorerPanelTitleDocked = explorerPanelTitleBase(explorerBreadcrumbDisplaySegment)
  const explorerPanelTitleFloating = explorerPanelTitleBase(
    showFullBreadcrumbWhenDetached
      ? explorerBreadcrumbSegmentFloating
      : explorerBreadcrumbDisplaySegment,
  )

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

  const propertiesDatamodelTintFocus = useMemo(
    () =>
      resolveDatamodelTintFocus(
        playModeSelectionTint,
        clientSimActive,
        explorerHeaderSimFocus,
        explorerWhileScriptFocus,
        explorerShowsDroneIsolationTree,
        hideAssetTinting,
      ),
    [
      playModeSelectionTint,
      clientSimActive,
      explorerHeaderSimFocus,
      explorerWhileScriptFocus,
      explorerShowsDroneIsolationTree,
      hideAssetTinting,
    ],
  )

  /** Right rail: Explorer / Properties / Interaction panel — title alignment (Interaction settings). */
  const [panelTitlesLeftAligned, setPanelTitlesLeftAligned] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.panelTitlesLeftAligned,
  )
  const buildInitialFloatingWindows = useCallback((): FloatingPanelWindowState[] => {
    const windows: FloatingPanelWindowState[] = []
    let slot = 0
    if (PROTOTYPE_SETTINGS_DEFAULTS.floatingExplorerOpen) {
      windows.push(createFloatingWindow('explorer', slot++))
    }
    if (PROTOTYPE_SETTINGS_DEFAULTS.floatingPropertiesOpen) {
      windows.push(createFloatingWindow('properties', slot++))
    }
    return windows
  }, [])

  const [floatingWindows, setFloatingWindows] =
    useState<FloatingPanelWindowState[]>(buildInitialFloatingWindows)
  const [floatingMergeHoverId, setFloatingMergeHoverId] = useState<string | null>(null)

  const floatingExplorerOpen = floatingWindows.some((w) => w.tabs.includes('explorer'))
  const floatingPropertiesOpen = floatingWindows.some((w) => w.tabs.includes('properties'))
  const [documentUndocked, setDocumentUndocked] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.floatingDocumentOpen,
  )
  const [floatingDocumentPosition, setFloatingDocumentPosition] =
    useState<FloatingDocumentPosition | null>(() => createFloatingDocumentWindow().position)
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
        setSimExplorerSelectedRowServer(serverRow)
        if (simMultiClientMode) {
          const byClient: Record<number, string | null> = {}
          for (let i = 1; i <= simClientInstanceCount; i++) {
            const rows = explorerTreeForClientInstance(i).map((r) => r.id)
            byClient[i] = pickRandomExplorerRow(rows)
          }
          setSimExplorerSelectionByClient(byClient)
          const activeIndex = clientInstanceIndexFromStripTab(simFocusedStripTab) ?? 1
          setSimExplorerSelectedRowClient(byClient[activeIndex] ?? clientRow)
        } else {
          setSimExplorerSelectedRowClient(clientRow)
          setSimExplorerSelectionByClient({})
        }
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
  }, [clientSimActive, simMultiClientMode, simClientInstanceCount, simFocusedStripTab])

  useEffect(() => {
    seedExplorerSelectionForTreeKind(explorerTreeKind)
  }, [
    explorerTreeKind,
    explorerSelectionSeedEpoch,
    clientSimActive,
    simMultiClientMode,
    simClientInstanceCount,
    seedExplorerSelectionForTreeKind,
  ])

  const [outputPanelOpen, setOutputPanelOpen] = useState(false)
  const [outputLogEntries, setOutputLogEntries] = useState<OutputLogEntry[]>(INITIAL_OUTPUT_LOG)

  const [panelDockLayout, setPanelDockLayout] = useState<PanelDockLayoutState>(() =>
    createDefaultPanelDockLayout({
      outputPanelOpen: false,
      hideExplorer: false,
      hideProperties: false,
    }),
  )

  const frameRef = useRef<HTMLDivElement | null>(null)
  const openFloatingExplorer = useCallback(() => {
    setFloatingWindows((windows) => {
      const existing = findFloatingWindowWithTab(windows, 'explorer')
      if (existing != null) {
        return windows.map((w) =>
          w.windowId === existing.windowId ? { ...w, activeTab: 'explorer' } : w,
        )
      }
      return [...windows, createFloatingWindow('explorer', windows.length)]
    })
  }, [])

  const openFloatingProperties = useCallback(() => {
    setFloatingWindows((windows) => {
      const existing = findFloatingWindowWithTab(windows, 'properties')
      if (existing != null) {
        return windows.map((w) =>
          w.windowId === existing.windowId ? { ...w, activeTab: 'properties' } : w,
        )
      }
      return [...windows, createFloatingWindow('properties', windows.length)]
    })
  }, [])

  const undockDocument = useCallback(() => {
    setDocumentUndocked(true)
    setEditWorkspaceDocumentFocus((focus) =>
      focus === 'main' ? 'isolation' : focus,
    )
  }, [])

  const dockDocument = useCallback(() => {
    setDocumentUndocked(false)
  }, [])

  const closeFloatingTab = useCallback((tab: FloatingSidePanelId) => {
    setFloatingWindows((windows) => {
      const host = findFloatingWindowWithTab(windows, tab)
      if (host == null) return windows
      const nextTabs = removeFloatingSidePanelTab(host.tabs, tab)
      if (nextTabs.length === 0) {
        return windows.filter((w) => w.windowId !== host.windowId)
      }
      return windows.map((w) =>
        w.windowId === host.windowId
          ? {
              ...w,
              tabs: nextTabs,
              activeTab: w.activeTab === tab ? nextTabs[0]! : w.activeTab,
            }
          : w,
      )
    })
  }, [])

  const handleFloatingWindowMerge = useCallback(
    (sourceWindowId: string, targetWindowId: string, mergedActiveTab: FloatingSidePanelId) => {
      setFloatingWindows((windows) =>
        mergeFloatingWindows(windows, sourceWindowId, targetWindowId, mergedActiveTab),
      )
    },
    [],
  )

  useEffect(() => {
    setPanelDockLayout((layout) => syncOutputPanelInLayout(layout, outputPanelOpen))
  }, [outputPanelOpen])

  const hiddenDockPanels = useMemo((): DockPanelId[] => {
    const hidden: DockPanelId[] = []
    if (floatingExplorerOpen) hidden.push('explorer')
    if (floatingPropertiesOpen) hidden.push('properties')
    return hidden
  }, [floatingExplorerOpen, floatingPropertiesOpen])

  const visibleBottomDockStacks = useMemo(
    () =>
      layoutWithoutPanels(
        { right: [], bottom: panelDockLayout.bottom },
        hiddenDockPanels,
      ).bottom,
    [panelDockLayout.bottom, hiddenDockPanels],
  )

  const panelDockDrag = usePanelDockDrag(panelDockLayout, setPanelDockLayout, frameRef)

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
  /**
   * Last test-mode strip + focus — written on Stop (`hasStoredSession: true`), read on next Play.
   * Not persisted across page refresh; Prototype Reset clears it.
   */
  const playModeSessionRef = useRef<{
    simViewportFocus: SimViewportFocus
    simFocusedStripTab: SimDocumentStripTab
    simMultiClientMode: boolean
    simClientInstanceCount: number
    simClientTabOpen: boolean
    simServerTabOpen: boolean
    simDocumentTabOrder: SimDocumentStripTab[]
    mainDocumentEditorTab: MainDocumentEditorTab
    splitClientDocumentTab: MainDocumentEditorTab
    splitServerDocumentTab: MainDocumentEditorTab
    hasStoredSession: boolean
  }>({
    simViewportFocus: 'client',
    simFocusedStripTab: 'client',
    simMultiClientMode: false,
    simClientInstanceCount: 1,
    simClientTabOpen: true,
    simServerTabOpen: true,
    simDocumentTabOrder: buildDefaultSimDocumentTabOrder({
      client: true,
      server: true,
      scriptA: true,
      scriptB: true,
      clientScript: false,
      serverScript: false,
    }),
    mainDocumentEditorTab: 'droneRacer',
    splitClientDocumentTab: 'droneRacer',
    splitServerDocumentTab: 'droneRacer',
    hasStoredSession: false,
  })
  const prevClientSimActiveRef = useRef(clientSimActive)
  /** Play button configured test state this tick — skip stale session restore in the sim-toggle effect. */
  const playConfiguredRef = useRef(false)
  const [tintClipPath, setTintClipPath] = useState<string | undefined>()

  const handlePrototypeReset = useCallback(() => {
    const d = PROTOTYPE_SETTINGS_DEFAULTS
    setClientSimActive(d.clientSimActive)
    setSimViewportFocus(d.simViewportFocus)
    setPlayModeHasStroke(d.playModeHasStroke)
    setPlayModeHasFocusStroke(d.playModeHasFocusStroke)
    setPlayModeTabStroke(d.playModeTabStroke)
    setExplorerNoBadge(d.explorerNoBadge)
    setExplorerFocusBadge(d.explorerFocusBadge)
    setExplorerBadgeShowIndicator(d.explorerBadgeShowIndicator)
    setExplorerOriginalDmBadge(d.explorerOriginalDmBadge)
    setExplorerShowBreadcrumb(d.explorerShowBreadcrumb)
    setShowFullBreadcrumbWhenDetached(d.showFullBreadcrumbWhenDetached)
    setPlayModeFullTint(d.playModeFullTint)
    setPlayModeSelectionTint(d.playModeSelectionTint)
    setPlayModeFooterTint(d.playModeFooterTint)
    setPlayModeSplitView(d.playModeSplitView)
    setShowAssetInIsolation(d.showAssetInIsolation)
    setEditDatamodelShowStroke(d.editDatamodelShowStroke)
    setHideAssetTinting(d.hideAssetTinting)
    setEditWorkspaceDocumentFocus(d.editWorkspaceDocumentFocus)
    setPanelTitlesLeftAligned(d.panelTitlesLeftAligned)
    setFloatingWindows(() => {
      const windows: FloatingPanelWindowState[] = []
      let slot = 0
      if (d.floatingExplorerOpen) windows.push(createFloatingWindow('explorer', slot++))
      if (d.floatingPropertiesOpen) windows.push(createFloatingWindow('properties', slot++))
      return windows
    })
    setDocumentUndocked(d.floatingDocumentOpen)
    setFloatingDocumentPosition(null)
    setEditExplorerSelectedRowId(null)
    setMainDocumentEditorTab(d.mainDocumentEditorTab)
    setSplitClientDocumentTab(d.splitClientDocumentTab)
    setSplitServerDocumentTab(d.splitServerDocumentTab)
    setScriptATabOpen(d.scriptATabOpen)
    setScriptBTabOpen(d.scriptBTabOpen)
    setClientScriptTabOpen(d.clientScriptTabOpen)
    setServerScriptTabOpen(d.serverScriptTabOpen)
    setSimClientTabOpen(d.simClientTabOpen)
    setSimServerTabOpen(d.simServerTabOpen)
    setSimDocumentTabOrder(
      buildDefaultSimDocumentTabOrder({
        client: d.simClientTabOpen,
        server: d.simServerTabOpen,
        scriptA: d.scriptATabOpen,
        scriptB: d.scriptBTabOpen,
        clientScript: d.clientScriptTabOpen,
        serverScript: d.serverScriptTabOpen,
      }),
    )
    setScriptTabOrder([...MAIN_SCRIPT_TAB_ORDER])
    setEditIsolationTabOrder([...EDIT_ISOLATION_TAB_ORDER])
    setCombinedMainZoneKeys(null)
    setCombinedIsoZoneKeys(null)
    setPanelDockLayout(
      createDefaultPanelDockLayout({
        outputPanelOpen: false,
        hideExplorer: d.floatingExplorerOpen,
        hideProperties: d.floatingPropertiesOpen,
      }),
    )
    setToggleOpensDmIfClosed(d.toggleOpensDmIfClosed)
    setIsolationTabOpen(d.isolationTabOpen)
    setHoverScriptTabOpen(d.hoverScriptTabOpen)
    setClientScriptDocument(DEFAULT_CLIENT_SCRIPT_DOCUMENT)
    setOutputPanelOpen(false)
    setOutputLogEntries(INITIAL_OUTPUT_LOG)
    setSimExplorerSelectedRowClient(null)
    setSimExplorerSelectedRowServer(null)
    setSimExplorerSelectionByClient({})
    setSimMultiClientMode(false)
    setSimClientInstanceCount(1)
    setSimFocusedStripTab('client')
    setExplorerSelectionSeedEpoch((epoch) => epoch + 1)
    editDocumentBeforePlayRef.current = {
      mainDocumentEditorTab: d.mainDocumentEditorTab,
      splitClientDocumentTab: d.splitClientDocumentTab,
      splitServerDocumentTab: d.splitServerDocumentTab,
      editWorkspaceDocumentFocus: d.editWorkspaceDocumentFocus,
    }
    playModeSessionRef.current = {
      simViewportFocus: d.simViewportFocus,
      simFocusedStripTab: 'client',
      simMultiClientMode: false,
      simClientInstanceCount: 1,
      simClientTabOpen: d.simClientTabOpen,
      simServerTabOpen: d.simServerTabOpen,
      simDocumentTabOrder: buildDefaultSimDocumentTabOrder({
        client: d.simClientTabOpen,
        server: d.simServerTabOpen,
        scriptA: d.scriptATabOpen,
        scriptB: d.scriptBTabOpen,
        clientScript: d.clientScriptTabOpen,
        serverScript: d.serverScriptTabOpen,
      }),
      mainDocumentEditorTab: d.mainDocumentEditorTab,
      splitClientDocumentTab: d.splitClientDocumentTab,
      splitServerDocumentTab: d.splitServerDocumentTab,
      hasStoredSession: false,
    }
  }, [])

  const tintActive = clientSimActive && playModeFullTint

  const simExplorerSelectedRowId = useMemo(() => {
    if (!clientSimActive) return null
    if (explorerSimFocusForTree === 'server') return simExplorerSelectedRowServer
    if (simMultiClientMode && simActiveClientInstanceIndex != null) {
      return (
        simExplorerSelectionByClient[simActiveClientInstanceIndex] ??
        simExplorerSelectedRowClient
      )
    }
    return simExplorerSelectedRowClient
  }, [
    clientSimActive,
    explorerSimFocusForTree,
    simMultiClientMode,
    simActiveClientInstanceIndex,
    simExplorerSelectionByClient,
    simExplorerSelectedRowClient,
    simExplorerSelectedRowServer,
  ])

  const onSimExplorerSelectRow = useCallback(
    (rowId: string) => {
      if (explorerSimFocusForTree === 'server') {
        setSimExplorerSelectedRowServer(rowId)
        return
      }
      if (simMultiClientMode && simActiveClientInstanceIndex != null) {
        setSimExplorerSelectionByClient((prev) => ({
          ...prev,
          [simActiveClientInstanceIndex]: rowId,
        }))
        return
      }
      setSimExplorerSelectedRowClient(rowId)
    },
    [explorerSimFocusForTree, simMultiClientMode, simActiveClientInstanceIndex],
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

  const propertiesBreadcrumbSegmentDocked = useMemo(
    () =>
      breadcrumbSegmentForDisplay(
        explorerBreadcrumbSegment,
        !showFullBreadcrumbWhenDetached,
      ),
    [explorerBreadcrumbSegment, showFullBreadcrumbWhenDetached],
  )

  const propertiesBreadcrumbSegmentFloating = useMemo(
    () => breadcrumbSegmentForDisplay(explorerBreadcrumbSegment, true),
    [explorerBreadcrumbSegment],
  )

  const propertiesPanelTitleDocked =
    explorerShowBreadcrumb && activeExplorerRowForProperties
      ? formatPropertiesPanelTitle(
          activeExplorerRowForProperties,
          propertiesBreadcrumbSegmentDocked,
        )
      : 'Properties'

  const propertiesPanelTitleFloating =
    explorerShowBreadcrumb && activeExplorerRowForProperties
      ? formatPropertiesPanelTitle(
          activeExplorerRowForProperties,
          propertiesBreadcrumbSegmentFloating,
        )
      : 'Properties'

  const propertiesPanelEmpty = activeExplorerRowForProperties === null

  const propertiesObjectLabel = activeExplorerRowForProperties
    ? explorerRowMeta(activeExplorerRowForProperties).label
    : null

  const panelChromeTitleAlign = panelTitlesLeftAligned ? ('left' as const) : ('center' as const)

  const bottomDockSinglePanel =
    visibleBottomDockStacks.length === 1 &&
    visibleBottomDockStacks[0]?.tabs.length === 1

  const renderDockedPanel = useCallback(
    (panelId: DockPanelId, ctx: { tabbed: boolean }) => {
      const onPanelDockDrag =
        panelId === 'output' || panelId === 'assetManager'
          ? panelDockDrag.onPanelDragHandlePointerDown(panelId)
          : undefined

      switch (panelId) {
        case 'explorer':
          return (
            <>
              <PanelChrome
                title={explorerPanelTitleDocked}
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
                  selectionTintActive={playModeSelectionTint}
                  simViewportFocus={explorerHeaderSimFocus}
                  simMultiClientMode={simMultiClientMode}
                  simActiveClientInstanceIndex={simActiveClientInstanceIndex ?? undefined}
                  simSelectedRowId={simExplorerSelectedRowId}
                  onSimExplorerSelectRow={onSimExplorerSelectRow}
                  editSelectedRowId={editExplorerSelectedRowId}
                  onEditSelectedRowIdChange={setEditExplorerSelectedRowId}
                />
              </div>
            </>
          )
        case 'properties':
          return (
            <>
              <PanelChrome
                title={propertiesPanelTitleDocked}
                assetVariant="properties"
                titleAlign={panelChromeTitleAlign}
              />
              <div className={styles.panelBody} data-node-id="3841:115198">
                <PropertiesPanel
                  empty={propertiesPanelEmpty}
                  objectLabel={propertiesObjectLabel ?? undefined}
                  selectionTintActive={playModeSelectionTint}
                  datamodelTintFocus={propertiesDatamodelTintFocus}
                />
              </div>
            </>
          )
        case 'prototypeSettings':
          return (
            <>
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
                tabStroke={playModeTabStroke}
                onTabStrokeChange={setPlayModeTabStroke}
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
                showFullBreadcrumbWhenDetached={showFullBreadcrumbWhenDetached}
                onShowFullBreadcrumbWhenDetachedChange={setShowFullBreadcrumbWhenDetached}
                fullTint={playModeFullTint}
                onFullTintChange={setPlayModeFullTint}
                selectionTint={playModeSelectionTint}
                onSelectionTintChange={setPlayModeSelectionTint}
                footerTint={playModeFooterTint}
                onFooterTintChange={setPlayModeFooterTint}
                splitView={playModeSplitView}
                onSplitViewChange={setPlayModeSplitView}
                toggleOpensDmIfClosed={toggleOpensDmIfClosed}
                onToggleOpensDmIfClosedChange={setToggleOpensDmIfClosed}
                showAssetInIsolation={showAssetInIsolation}
                onShowAssetInIsolationChange={setShowAssetInIsolation}
                editDatamodelShowStroke={editDatamodelShowStroke}
                onEditDatamodelShowStrokeChange={setEditDatamodelShowStroke}
                hideAssetTinting={hideAssetTinting}
                onHideAssetTintingChange={setHideAssetTinting}
                panelTitlesLeftAligned={panelTitlesLeftAligned}
                onPanelTitlesLeftAlignedChange={setPanelTitlesLeftAligned}
                bunnyAssetWindow={bunnyAssetWindow}
                onOpenAssetWindow={bunnyAssetWindow ? undefined : onOpenAssetWindow}
                onOpenFloatingProperties={
                  bunnyAssetWindow ? undefined : openFloatingProperties
                }
                onOpenFloatingExplorer={bunnyAssetWindow ? undefined : openFloatingExplorer}
                onUndockDocument={
                  bunnyAssetWindow || !showAssetInIsolation ? undefined : undockDocument
                }
                onOpenClientScript={bunnyAssetWindow ? undefined : openClientScriptTab}
                onOpenServerScript={bunnyAssetWindow ? undefined : openServerScriptTab}
                onThrowError={bunnyAssetWindow ? undefined : handleThrowError}
                testingMode={clientSimActive}
                onReset={bunnyAssetWindow ? undefined : handlePrototypeReset}
              />
              </div>
            </>
          )
        case 'output':
          return (
            <OutputPanel
              entries={outputLogEntries}
              onClose={() => setOutputPanelOpen(false)}
              titleAlign={panelChromeTitleAlign}
              onErrorRowClick={() => openCameraZoomScript()}
              hideHeader={ctx.tabbed}
              onHeaderPointerDown={ctx.tabbed ? undefined : onPanelDockDrag}
            />
          )
        case 'assetManager':
          return (
            <AssetManagerPanel
              fillDock={!ctx.tabbed && bottomDockSinglePanel}
              titleAlign={panelChromeTitleAlign}
              hideHeader={ctx.tabbed}
              onHeaderPointerDown={ctx.tabbed ? undefined : onPanelDockDrag}
            />
          )
        default:
          return null
      }
    },
    [
      panelDockDrag,
      explorerPanelTitleDocked,
      panelChromeTitleAlign,
      explorerNoBadge,
      explorerFocusBadge,
      explorerShowsClientServerFocusBadge,
      explorerHeaderSimFocus,
      explorerOriginalDmBadge,
      showAssetInIsolation,
      editWorkspaceDocumentFocus,
      explorerOriginalDmBadgeLabel,
      explorerBadgeShowIndicator,
      clientSimActive,
      bunnyAssetWindow,
      explorerWhileScriptFocus,
      explorerShowsDroneIsolationTree,
      playModeSelectionTint,
      simMultiClientMode,
      simActiveClientInstanceIndex,
      simExplorerSelectedRowId,
      onSimExplorerSelectRow,
      editExplorerSelectedRowId,
      propertiesPanelTitleDocked,
      propertiesPanelEmpty,
      propertiesObjectLabel,
      propertiesDatamodelTintFocus,
      playModeHasStroke,
      playModeHasFocusStroke,
      explorerShowBreadcrumb,
      showFullBreadcrumbWhenDetached,
      playModeFullTint,
      playModeFooterTint,
      playModeSplitView,
      toggleOpensDmIfClosed,
      editDatamodelShowStroke,
      hideAssetTinting,
      panelTitlesLeftAligned,
      onOpenAssetWindow,
      openClientScriptTab,
      openServerScriptTab,
      handleThrowError,
      handlePrototypeReset,
      outputLogEntries,
      openCameraZoomScript,
      bottomDockSinglePanel,
    ],
  )

  const centerBottomDock = !bunnyAssetWindow ? (
    <>
      <div className={styles.centerDockGutter} aria-hidden />
      <PanelDockZone
        zone="bottom"
        stacks={visibleBottomDockStacks}
        onStacksChange={(bottom) => setPanelDockLayout((layout) => ({ ...layout, bottom }))}
        isDropTarget={panelDockDrag.isDropTarget}
        isMergeDropTarget={panelDockDrag.isMergeDropTarget}
        renderPanel={renderDockedPanel}
        className={styles.centerDock}
      />
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
      if (!playConfiguredRef.current) {
        const session = playModeSessionRef.current
        setSimViewportFocus(session.simViewportFocus)
        setSimFocusedStripTab(session.simFocusedStripTab)
        setSimMultiClientMode(session.simMultiClientMode)
        setSimClientInstanceCount(session.simClientInstanceCount)
        setSimClientTabOpen(session.simClientTabOpen)
        setSimServerTabOpen(session.simServerTabOpen)
        setSimDocumentTabOrder([...session.simDocumentTabOrder])
        setMainDocumentEditorTab(session.mainDocumentEditorTab)
        setSplitClientDocumentTab(session.splitClientDocumentTab)
        setSplitServerDocumentTab(session.splitServerDocumentTab)
        setEditWorkspaceDocumentFocus('main')
      } else {
        playConfiguredRef.current = false
      }
    }
    if (wasSim && !clientSimActive) {
      playModeSessionRef.current = {
        simViewportFocus,
        simFocusedStripTab,
        simMultiClientMode,
        simClientInstanceCount,
        simClientTabOpen,
        simServerTabOpen,
        simDocumentTabOrder: [...simDocumentTabOrder],
        mainDocumentEditorTab,
        splitClientDocumentTab,
        splitServerDocumentTab,
        hasStoredSession: true,
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

  /** Keep script/sim strip orders aligned with combined-zone placement (drag / iso column). */
  useEffect(() => {
    if (!showAssetInIsolation || playModeSplitView) return
    if (combinedMainZoneKeys == null && combinedIsoZoneKeys == null) return
    if (simMultiClientMode) return

    const synced = syncAllDocumentOrdersFromPersistentZones(
      combinedMainZoneKeys ?? [],
      combinedIsoZoneKeys ?? [],
      simDocumentTabOrder,
      scriptTabOrder,
      editIsolationTabOrder,
    )
    setSimDocumentTabOrder(synced.simOrder)
    setScriptTabOrder(synced.scriptOrder)
    setEditIsolationTabOrder(synced.isoTabOrder)
  }, [
    combinedMainZoneKeys,
    combinedIsoZoneKeys,
    showAssetInIsolation,
    playModeSplitView,
    simMultiClientMode,
  ])

  useEffect(() => {
    if (!showAssetInIsolation) setDocumentUndocked(false)
  }, [showAssetInIsolation])

  useEffect(() => {
    if (!showAssetInIsolation) setEditWorkspaceDocumentFocus('main')
  }, [showAssetInIsolation])

  return (
    <div
      ref={frameRef}
      className={styles.frame}
      data-node-id="3841:114990"
      data-name="Studio - Windows OS"
      {...(floatingWindows.length > 0 ? { 'data-floating-panels': '' as const } : {})}
    >
      <header className={styles.appBar} data-node-id="3842:134467">
        <div className={styles.appBarLeft}>
          <button type="button" className={styles.logoBtn} aria-label="App menu">
            <img src={publicAssetUrl('assets/appbar-logo.svg')} alt="" />
          </button>
          <nav className={styles.menu} aria-label="Application menu">
            {MENUS.map((label) =>
              label === 'Test' ? (
                <TestAppMenu
                  key={label}
                  triggerClassName={styles.menuItem}
                  disabled={bunnyAssetWindow}
                  simulating={clientSimActive}
                  simMultiClientMode={simMultiClientMode}
                  simClientInstanceCount={simClientInstanceCount}
                  simClientTabOpen={simClientTabOpen}
                  simServerTabOpen={simServerTabOpen}
                  simDocumentTabOrder={simDocumentTabOrder}
                  onToggleView={toggleTestMenuView}
                />
              ) : (
                <span key={label} className={styles.menuItem}>
                  {label}
                </span>
              ),
            )}
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
        simViewportFocus={simViewportFocus}
        onSimViewportFocusToggle={() => {
          const nextFocus = simViewportFocus === 'client' ? 'server' : 'client'
          const anchor = simStripTabAnchor(mainDocumentEditorTab, simViewportFocus)
          if (toggleOpensDmIfClosed) {
            if (nextFocus === 'server' && !simServerTabOpen) {
              setSimServerTabOpen(true)
              setSimDocumentTabOrder((order) =>
                insertStripTabAfterAnchor(order, 'server', anchor),
              )
            }
            if (nextFocus === 'client' && !simClientTabOpen) {
              setSimClientTabOpen(true)
              const clientTab: SimDocumentStripTab = simMultiClientMode
                ? simClientInstanceId(1)
                : 'client'
              setSimDocumentTabOrder((order) =>
                insertStripTabAfterAnchor(order, clientTab, anchor),
              )
            }
          }
          setSimViewportFocus(nextFocus)
          setSimFocusedStripTab(
            nextFocus === 'server'
              ? 'server'
              : simMultiClientMode
                ? isSimClientInstanceId(simFocusedStripTab)
                  ? simFocusedStripTab
                  : simClientInstanceId(1)
                : 'client',
          )
          setMainDocumentEditorTab('droneRacer')
          setEditWorkspaceDocumentFocus('main')
        }}
        testPlaybackDisabled={bunnyAssetWindow}
        onPlay={({ testRunMode, clientSpawnCount }) => {
          playConfiguredRef.current = true
          const session = playModeSessionRef.current
          const restore = session.hasStoredSession
          const isFirstServerAndClientsPlay =
            testRunMode === 'serverAndClients' && (!restore || !session.simMultiClientMode)
          const clientOpen = isFirstServerAndClientsPlay
            ? true
            : restore
              ? session.simClientTabOpen
              : true
          const serverOpen = restore ? session.simServerTabOpen : true

          setClientSimActive(true)
          setSimClientTabOpen(clientOpen)
          setSimServerTabOpen(serverOpen)
          setMainDocumentEditorTab('droneRacer')
          setEditWorkspaceDocumentFocus('main')

          const scriptOpen = {
            scriptA: scriptATabOpen,
            scriptB: scriptBTabOpen,
            clientScript: clientScriptTabOpen,
            serverScript: serverScriptTabOpen,
          }

          const isScriptOpen = (tab: MainScriptTabId) => scriptOpen[tab]

          if (testRunMode === 'serverAndClients') {
            setSimMultiClientMode(true)
            setSimClientInstanceCount(clientSpawnCount)
            const clientIndices = isFirstServerAndClientsPlay
              ? Array.from({ length: clientSpawnCount }, (_, i) => i + 1)
              : openClientIndicesFromSessionOrder(
                  restore,
                  session.simDocumentTabOrder,
                  session.simClientInstanceCount,
                  clientSpawnCount,
                  clientOpen,
                )
            const desiredOrder = buildMultiClientSimDocumentTabOrder(
              clientSpawnCount,
              {
                server: serverOpen,
                clientsOpen: clientOpen,
                clientIndices,
                ...scriptOpen,
              },
              scriptTabOrder,
            )
            const multiClientSimOrder = restore && !isFirstServerAndClientsPlay
              ? mergeOpenTabOrder(session.simDocumentTabOrder, desiredOrder)
              : desiredOrder
            const defaultClientStripTab = simClientInstanceId(1)
            const { focus, stripTab } = resolvePlaySessionFocus(
              multiClientSimOrder,
              isFirstServerAndClientsPlay ? 'client' : session.simViewportFocus,
              isFirstServerAndClientsPlay
                ? defaultClientStripTab
                : session.simFocusedStripTab,
            )
            setSimViewportFocus(focus)
            setSimFocusedStripTab(stripTab)
            const byClient = buildInitialExplorerSelectionByClient(clientSpawnCount)
            setSimExplorerSelectionByClient(byClient)
            setSimExplorerSelectedRowClient(
              byClient[parseSimClientInstanceIndex(
                isSimClientInstanceId(stripTab) ? stripTab : simClientInstanceId(1),
              )] ?? byClient[1] ?? null,
            )
            setSimDocumentTabOrder(multiClientSimOrder)
            if (showAssetInIsolation && !playModeSplitView) {
              setCombinedMainZoneKeys(
                persistentMainZoneKeysForSimOrder(
                  multiClientSimOrder,
                  scriptTabOrder,
                  isScriptOpen,
                ),
              )
            }
          } else {
            setSimMultiClientMode(false)
            setSimClientInstanceCount(1)
            setSimExplorerSelectionByClient({})
            const desiredOrder = buildDefaultSimDocumentTabOrder({
              client: clientOpen,
              server: serverOpen,
              ...scriptOpen,
            })
            const singleTestSimOrder = restore
              ? mergeOpenTabOrder(session.simDocumentTabOrder, desiredOrder)
              : desiredOrder
            const { focus, stripTab } = resolvePlaySessionFocus(
              singleTestSimOrder,
              restore ? session.simViewportFocus : 'client',
              restore ? session.simFocusedStripTab : 'client',
            )
            setSimViewportFocus(focus)
            setSimFocusedStripTab(stripTab)
            setSimDocumentTabOrder(singleTestSimOrder)
            if (showAssetInIsolation && !playModeSplitView) {
              setCombinedMainZoneKeys(
                persistentMainZoneKeysForSimOrder(
                  singleTestSimOrder,
                  scriptTabOrder,
                  isScriptOpen,
                ),
              )
            }
          }
        }}
        onStop={() => {
          setClientSimActive(false)
          setSimMultiClientMode(false)
          setSimClientInstanceCount(1)
          setSimFocusedStripTab('client')
          setSimExplorerSelectionByClient({})
          setCombinedMainZoneKeys(null)
        }}
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
                  playModeTabStroke={playModeTabStroke}
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
                  simMultiClientMode={simMultiClientMode}
                  simClientInstanceCount={simClientInstanceCount}
                  simFocusedStripTab={simFocusedStripTab}
                  onSimFocusedStripTabChange={setSimFocusedStripTab}
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
                  simClientTabOpen={simClientTabOpen}
                  simServerTabOpen={simServerTabOpen}
                  simDocumentTabOrder={simDocumentTabOrder}
                  onSimDocumentTabOrderChange={setSimDocumentTabOrder}
                  scriptTabOrder={scriptTabOrder}
                  onScriptTabOrderChange={setScriptTabOrder}
                  editIsolationTabOrder={editIsolationTabOrder}
                  onEditIsolationTabOrderChange={setEditIsolationTabOrder}
                  combinedMainZoneKeys={combinedMainZoneKeys}
                  combinedIsoZoneKeys={combinedIsoZoneKeys}
                  onCombinedMainZoneKeysChange={setCombinedMainZoneKeys}
                  onCombinedIsoZoneKeysChange={setCombinedIsoZoneKeys}
                  onSimClientTabOpenChange={setSimClientTabOpen}
                  onSimServerTabOpenChange={setSimServerTabOpen}
                  onIsolationTabOpenChange={setIsolationTabOpen}
                  onHoverScriptTabOpenChange={setHoverScriptTabOpen}
                  playModeHasStroke={playModeHasStroke}
                  playModeHasFocusStroke={playModeHasFocusStroke}
                  playModeTabStroke={playModeTabStroke}
                  tintActive={tintActive}
                  focusHoleRef={focusHoleRef}
                  playModeSplitView={playModeSplitView}
                  editDatamodelShowStroke={editDatamodelShowStroke}
                  editDocumentFocus={editWorkspaceDocumentFocus}
                  onEditDocumentFocusChange={setEditWorkspaceDocumentFocus}
                  documentUndocked={documentUndocked}
                  floatingDocumentPosition={floatingDocumentPosition}
                  onFloatingDocumentPositionChange={setFloatingDocumentPosition}
                  onDockDocument={dockDocument}
                  frameRef={frameRef}
                  panelChromeTitleAlign={panelChromeTitleAlign}
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
                  playModeHasStroke={playModeHasStroke}
                  playModeHasFocusStroke={playModeHasFocusStroke}
                  playModeTabStroke={playModeTabStroke}
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
                  playModeHasStroke={playModeHasStroke}
                  playModeHasFocusStroke={playModeHasFocusStroke}
                  playModeTabStroke={playModeTabStroke}
                  scriptATabOpen={scriptATabOpen}
                  scriptBTabOpen={scriptBTabOpen}
                  clientScriptTabOpen={clientScriptTabOpen}
                  serverScriptTabOpen={serverScriptTabOpen}
                  scriptTabOrder={scriptTabOrder}
                  onScriptTabOrderChange={setScriptTabOrder}
                  editIsolationTabOrder={editIsolationTabOrder}
                  onEditIsolationTabOrderChange={setEditIsolationTabOrder}
                  combinedMainZoneKeys={combinedMainZoneKeys}
                  combinedIsoZoneKeys={combinedIsoZoneKeys}
                  onCombinedMainZoneKeysChange={setCombinedMainZoneKeys}
                  onCombinedIsoZoneKeysChange={setCombinedIsoZoneKeys}
                  isolationTabOpen={isolationTabOpen}
                  hoverScriptTabOpen={hoverScriptTabOpen}
                  onScriptATabOpenChange={setScriptATabOpen}
                  onScriptBTabOpenChange={setScriptBTabOpen}
                  onClientScriptTabOpenChange={setClientScriptTabOpen}
                  onServerScriptTabOpenChange={setServerScriptTabOpen}
                  onIsolationTabOpenChange={setIsolationTabOpen}
                  onHoverScriptTabOpenChange={setHoverScriptTabOpen}
                  documentUndocked={documentUndocked}
                  floatingDocumentPosition={floatingDocumentPosition}
                  onFloatingDocumentPositionChange={setFloatingDocumentPosition}
                  onDockDocument={dockDocument}
                  frameRef={frameRef}
                  panelChromeTitleAlign={panelChromeTitleAlign}
                  clientScriptDocument={clientScriptDocument}
                />
              )}
            </div>
            {centerBottomDock}
          </section>
        )}

        <aside className={styles.right} data-node-id="3841:115190">
          {!floatingExplorerOpen ? (
            <div className={styles.rightDockedPanelWrap} data-node-id="3841:115191">
              {renderDockedPanel('explorer', { tabbed: false })}
            </div>
          ) : null}
          {!floatingPropertiesOpen ? (
            <div className={styles.rightDockedPanelWrap} data-node-id="3841:115196">
              {renderDockedPanel('properties', { tabbed: false })}
            </div>
          ) : null}
          <div className={`${styles.panel} ${styles.panelInteraction}`}>
            {renderDockedPanel('prototypeSettings', { tabbed: false })}
          </div>
        </aside>
      </div>

      <div className={styles.workspaceGutter} aria-hidden />

      <StudioFooter
        questions={FOOTER_QUESTIONS}
        datamodelTintFocus={footerDatamodelTintFocus}
      />

      {floatingWindows.map((win) => (
        <FloatingPanelWindow
          key={win.windowId}
          frameRef={frameRef}
          window={win}
          mergeDropActive={floatingMergeHoverId === win.windowId}
          onWindowChange={(next) =>
            setFloatingWindows((windows) =>
              windows.map((w) => (w.windowId === next.windowId ? next : w)),
            )
          }
          onMerge={handleFloatingWindowMerge}
          onMergeHoverChange={setFloatingMergeHoverId}
          renderHeader={(activeTab) => (
            <PanelChrome
              title={
                activeTab === 'explorer'
                  ? explorerPanelTitleFloating
                  : propertiesPanelTitleFloating
              }
              assetVariant={activeTab === 'explorer' ? 'explorer' : 'properties'}
              titleAlign={panelChromeTitleAlign}
              onClose={() => closeFloatingTab(activeTab)}
              explorerFocusBadgeTarget={
                activeTab === 'explorer' && !explorerNoBadge
                  ? explorerFocusBadge && explorerShowsClientServerFocusBadge
                    ? explorerHeaderSimFocus
                    : null
                  : null
              }
              explorerDocumentBadgeLabel={
                activeTab === 'explorer' && !explorerNoBadge
                  ? (explorerFocusBadge || explorerOriginalDmBadge) &&
                      showAssetInIsolation &&
                      editWorkspaceDocumentFocus !== 'main'
                    ? DRONE_WORKSPACE_TAB_LABEL
                    : null
                  : null
              }
              explorerOriginalDmBadgeLabel={
                activeTab === 'explorer' && !explorerNoBadge
                  ? explorerOriginalDmBadgeLabel
                  : null
              }
              explorerOriginalDmBadgeShowDot={explorerBadgeShowIndicator}
              explorerBadgeShowDot={
                activeTab === 'explorer' &&
                (!explorerFocusBadge || explorerBadgeShowIndicator)
              }
            />
          )}
          renderBody={(activeTab) =>
            activeTab === 'explorer' ? (
              <div className={styles.panelBody}>
                <ExplorerTree
                  clientSim={clientSimActive}
                  bunnyFlatExplorer={bunnyAssetWindow}
                  explorerWhileScriptFocus={explorerWhileScriptFocus}
                  droneDocumentFocused={explorerShowsDroneIsolationTree}
                  selectionTintActive={playModeSelectionTint}
                  simViewportFocus={explorerHeaderSimFocus}
                  simMultiClientMode={simMultiClientMode}
                  simActiveClientInstanceIndex={simActiveClientInstanceIndex ?? undefined}
                  simSelectedRowId={simExplorerSelectedRowId}
                  onSimExplorerSelectRow={onSimExplorerSelectRow}
                  editSelectedRowId={editExplorerSelectedRowId}
                  onEditSelectedRowIdChange={setEditExplorerSelectedRowId}
                />
              </div>
            ) : (
              <div className={styles.panelBody}>
                <PropertiesPanel
                  empty={propertiesPanelEmpty}
                  objectLabel={propertiesObjectLabel ?? undefined}
                  selectionTintActive={playModeSelectionTint}
                  datamodelTintFocus={propertiesDatamodelTintFocus}
                />
              </div>
            )
          }
        />
      ))}

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
