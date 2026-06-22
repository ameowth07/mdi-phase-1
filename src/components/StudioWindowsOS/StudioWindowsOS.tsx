import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  Dispatch,
  MouseEvent,
  PointerEvent,
  Ref,
  RefObject,
  SetStateAction,
} from 'react'
import { Monitor, Music, Server, SquareArrowOutUpRight } from 'lucide-react'
import ClientSim from './ClientSim'
import LegacyRibbon, { type RibbonPanelToggleId, type RibbonPanelToggles } from './LegacyRibbon'
import TestAppMenu, { type TestAppMenuFocusTarget } from './TestAppMenu'
import WindowAppMenu, { type WindowPanelToggleId } from './WindowAppMenu'
import FloatingStudioSettingsWindow from './FloatingStudioSettingsWindow'
import {
  STUDIO_SETTINGS_DEFAULT_SIZE,
  type FloatingWindowSize,
} from './useFloatingWindowResize'
import type { StudioThemePresetId } from './studioThemePresets'
import ServerSim from './ServerSim'
import AssetManagerPanel from './AssetManagerPanel'
import ToolboxPanel from './ToolboxPanel'
import Level1ExplorerTreeView from './Level1ExplorerTreeView'
import ExplorerTreeIcon from './ExplorerTreeIcon'
import type { StudioColorTheme } from './themeColorOperators'
import { buildPlaceTabClassName } from './buildPlaceTabClassName'
import DocumentPlaceTab from './DocumentPlaceTab'
import PlaceDocumentPanel from './PlaceDocumentPanel'
import { placeDocumentDockTabDragProps } from './PlaceDocumentDockTabStrip'
import { generateLevel1ExplorerTree, type Level1ExplorerTreeData } from './level1ExplorerData'
import {
  DRONE_RACER_EXPLORER_ROWS,
  DRONE_RACER_EXPLORER_TREE,
} from './droneRacerExplorerData'
import TabWithPathTooltip, { PathTooltipBubble, usePathTooltip } from './TabWithPathTooltip'
import { TabPlaceWorkspaceIcon, TabScriptEditIcon, TabLocalScriptEditIcon, TabModelIcon, TabCloseButton, TabCloseIcon } from './documentTabIcons'
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
import {
  DOCKED_TEST_SERVER_PLACE_ID,
  editPlaceIdAfterTestStop,
  insertPlaceServerTabAfterClient,
  insertPlaceServerTabsAfterClient,
  isSimPlaceServerTab,
  joinedPlaceIdsFromSimOrder,
  placeIdFromPlaceServerTab,
  canAdvanceClientToNextPlace,
  level1ServerShowsJoinedClient,
  nextServerPlaceAfterClientView,
  placeServerUsesMainStripTab,
  serverPlacesForGame,
  simPlaceServerTabId,
} from './placeServerTabs'
import {
  isPlaceDockPanelId,
  mergeOpenPlaceDockPlaceIds,
  openMainStripPlaceIdsFromJoined,
  placeIdFromDockPanel,
  placeIdsInServerOrder,
} from './placeDockPanels'
import {
  assetIdFromDockPanel,
  isAssetDockPanelId,
} from './assetDockPanels'
import { isDocumentDockPanelId, type DocumentDockPanelId } from './documentDockPanels'
import { mergeVisibleTabReorder } from './documentTabReorder'
import {
  buildDefaultPersistentZoneKeys,
  dockPersistentKey,
  isoTabKey,
  mainScriptTabKey,
  moveTabBetweenThreeZones,
  placeIdFromDockPersistentKey,
  persistentToCombined,
  ensureMultiClientMainZoneKeys,
  injectMultiClientMainZoneDefaults,
  insertPlaceServerPersistentKeyAfterClient,
  isoPersistentKey,
  mergeOpenTabOrder,
  persistentMainZoneKeysForSimOrder,
  reconcileCombinedZoneKeys,
  reconcileDocumentStripZoneKeys,
  reorderZoneTabKeys,
  simTabKey,
  syncAllDocumentOrdersFromPersistentZones,
  syncScriptOrderFromSimOrder,
  syncSimOrderFromScriptOrder,
  tabKeyInZone,
  type CombinedTabKey,
  type CombinedTabStripZone,
  type DocumentTabStripZone,
  type PersistentTabKey,
} from './documentTabStripZone'
import { tabDragClassesForDual, type DualZoneTabDragBindings } from './useDualZoneTabDrag'
import {
  useTriZoneTabDrag,
  tabDragClassesForTri,
  isTriZoneTabDrag,
  type TriZoneTabDragBindings,
} from './useTriZoneTabDrag'
import { useTabRowDragReorder, type TabRowDragBindings } from './useTabRowDragReorder'
import PanelDockZone from './PanelDockZone'
import FloatingPanelWindow from './FloatingPanelWindow'
import FloatingDocumentWindow from './FloatingDocumentWindow'
import FloatingPlaceDocumentWindow from './FloatingPlaceDocumentWindow'
import FloatingAssetDocumentWindow from './FloatingAssetDocumentWindow'
import AssetDocumentPanel from './AssetDocumentPanel'
import ScriptEditor from './ScriptEditor'
import type { FloatingDocumentPosition } from './floatingDocument'
import { createFloatingDocumentWindow } from './floatingDocument'
import {
  createFloatingPlaceWindow,
  findFloatingPlaceWindow,
  type FloatingPlaceDocumentWindowState,
} from './floatingPlaceDocument'
import {
  createFloatingAssetWindow,
  findFloatingAssetWindow,
  type FloatingAssetDocumentWindowState,
} from './floatingAssetDocument'
import { assetById } from './assetManagerCatalog'
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
  focusBottomDockAssetTab,
  focusBottomDockPlaceTab,
  layoutWithoutPanels,
  openAssetInFocusedBottomStack,
  syncBottomPanelsInLayout,
  type DockPanelId,
  type PanelDockLayoutState,
} from './panelDock'
import { usePanelDockDrag } from './usePanelDockDrag'
import { useConnectedTabGutterMetrics } from './useConnectedTabGutterMetrics'
import {
  PROTOTYPE_SETTINGS_DEFAULTS,
  type EditDocumentFocus,
  type MainDocumentEditorTab,
  type SimViewportFocus,
} from './prototypeDefaults'
import { uiScaleFactor } from './uiScale'
import type { ToolSelectionColor } from './toolSelectionColor'
import {
  placeById,
  placeRootPathTooltip,
  placeScriptPathTooltip,
  simClientTabLabel,
  simClientTabPathTooltip,
  simServerTabLabel,
  simServerTabPathTooltip,
  resolveWorkspace,
  type Place,
  type StudioFrameVariant,
} from './workspaceModel'
import styles from './StudioWindowsOS.module.css'
import type { StudioPhase } from '../../studioPhase'
import {
  initialOpenPlaceDockPlaceIds,
  isColorPlayground,
  isPhase2,
  PHASE_1_APP_BAR_TITLE,
  PHASE_1_MAIN_PLACE_TAB_LABEL,
  prototypeDefaultsForPhase,
} from '../../studioPhase'

export type { EditDocumentFocus, MainDocumentEditorTab, SimViewportFocus, StudioFrameVariant }
export type { StudioPhase } from '../../studioPhase'

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

const FLAT_SIM_EXPLORER_ROWS = ['workspace', 'players', 'lighting', 'materialservice'] as const

const DRONE_ISOLATION_EXPLORER_ROWS = [
  DRONE_ISOLATION_EXPLORER_ROW_ID,
  ...DRONE_ISOLATION_EXPLORER_CHILDREN.map((child) => child.id),
] as const

type ExplorerTreeKind =
  | 'bunny'
  | 'droneIsolation'
  | 'flatSim'
  | 'droneRacerHierarchy'
  | 'level1Hierarchy'

export type ActiveEditPlaceId = string

/** Per Explorer context — restored when returning from Test or another tree. */
type PersistedExplorerSelection = {
  droneRacerEdit: string | null
  levelEditByPlace: Record<string, string | null>
  droneIsolation: string | null
  bunny: string | null
  flatSimClient: string | null
  flatSimServer: string | null
  flatSimByClient: Record<number, string | null>
  simHierarchyClientByPlace: Record<string, string | null>
  simHierarchyServerByPlace: Record<string, string | null>
}

function createEmptyPersistedExplorerSelection(): PersistedExplorerSelection {
  return {
    droneRacerEdit: null,
    levelEditByPlace: {},
    droneIsolation: null,
    bunny: null,
    flatSimClient: null,
    flatSimServer: null,
    flatSimByClient: {},
    simHierarchyClientByPlace: {},
    simHierarchyServerByPlace: {},
  }
}

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
const TAB_PATH_BUNNY_DOCUMENT = 'Bunny/Bunny'
const TAB_PATH_DRONE_ASSET = 'Drone/Drone'
const TAB_PATH_DRONE_HOVERSCRIPT = 'Drone/HoverScript'

/** Main Drone Racer Script tabs — short Lua samples for the prototype editor. */
const DRONE_RACER_SCRIPT_A_SOURCE = `-- Boost drone on Space
local drone = workspace.Drone

local function onJump(input)
	if input.KeyCode == Enum.KeyCode.Space and input.UserInputState == Enum.UserInputState.Begin then
		drone.PrimaryPart.AssemblyLinearVelocity += Vector3.new(0, 50, 0)
	end
end

UserInputService.InputBegan:Connect(onJump)`

const DRONE_RACER_SCRIPT_B_SOURCE = `-- Cap altitude and dampen bounce
local drone = workspace.Drone
local MAX_Y = 320

RunService.Heartbeat:Connect(function()
	local root = drone.PrimaryPart
	if root.Position.Y > MAX_Y then
		root.AssemblyLinearVelocity = Vector3.new(root.AssemblyLinearVelocity.X, -10, root.AssemblyLinearVelocity.Z)
	end
end)`

const HOVER_SCRIPT_SOURCE = `-- HoverScript: hold drone over the pad
local drone = workspace.Drone
local HOVER_Y = 14

RunService.Heartbeat:Connect(function()
	local root = drone.PrimaryPart
	local delta = HOVER_Y - root.Position.Y
	root.AssemblyLinearVelocity = Vector3.new(0, delta * 0.2, 0)
end)`

/** Asset isolation preview — selected art includes the white ring around the drone. */
const ASSET_ISOLATION_IMAGE = publicAssetUrl('assets/asset-isolation.jpg')
const ASSET_ISOLATION_IMAGE_FOCUSED = publicAssetUrl('assets/asset-isolation-selected.jpg')

/** Explorer edit tree — direct parent id per row (for “child of selected” tint). */
const EXPLORER_EDIT_PARENT: Record<string, string | null> = {
  ...DRONE_RACER_EXPLORER_TREE.parentMap,
  bunnyExplorerRow: null,
  [DRONE_ISOLATION_EXPLORER_ROW_ID]: null,
  'drone-isolation-hover-script': DRONE_ISOLATION_EXPLORER_ROW_ID,
  'drone-isolation-frame': DRONE_ISOLATION_EXPLORER_ROW_ID,
  'drone-isolation-rotor-a': DRONE_ISOLATION_EXPLORER_ROW_ID,
  'drone-isolation-rotor-b': DRONE_ISOLATION_EXPLORER_ROW_ID,
  'drone-isolation-sensor': DRONE_ISOLATION_EXPLORER_ROW_ID,
}

/** Explorer row → Properties breadcrumb label and Roblox class name. */
const EXPLORER_ROW_META: Record<string, { label: string; className: string }> = {
  ...DRONE_RACER_EXPLORER_TREE.rowMeta,
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

function explorerRowMeta(
  rowId: string,
  level1Meta?: Record<string, { label: string; className: string }>,
): { label: string; className: string } {
  return (
    level1Meta?.[rowId] ??
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

/** Shorten in-window breadcrumbs: keep place name; drop place prefix from deeper paths. */
function breadcrumbSegmentForDisplay(
  fullSegment: string | null,
  includeWorkspace: boolean,
): string | null {
  if (!fullSegment) return null
  if (includeWorkspace) return fullSegment
  const slash = fullSegment.indexOf(' / ')
  if (slash === -1) return fullSegment
  return fullSegment.slice(slash + 3)
}

function formatExplorerPanelTitle(displaySegment: string | null): string {
  return displaySegment ? `Explorer / ${displaySegment}` : 'Explorer'
}

function simStripTabAnchor(
  mainTab: MainDocumentEditorTab,
  simFocus: SimViewportFocus,
): SimDocumentStripTab {
  if (isPlaceRootTab(mainTab)) return simFocus
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

function isPlaceRootTab(tab: MainDocumentEditorTab): tab is 'droneRacer' {
  return tab === 'droneRacer'
}

/** Main-strip documents that belong to the Lobby place (not Level 1). */
function isLobbyMainDocumentTab(tab: MainDocumentEditorTab): boolean {
  return tab === 'droneRacer' || tab === 'scriptA' || tab === 'scriptB'
}

function isScriptDocumentTab(
  tab: MainDocumentEditorTab,
): tab is Exclude<MainDocumentEditorTab, 'droneRacer'> {
  return !isPlaceRootTab(tab)
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

/** Edit-mode script tabs use neutral system-contrast stroke, not semantic drone. */
function scriptTabStrokeDatamodel(
  tab: MainDocumentEditorTab,
  clientSim: boolean | undefined,
): ScriptDatamodelFocus | null {
  return clientSim ? scriptTabDatamodelFocus(tab) : null
}

/** Edit-mode iso tabs use neutral system-contrast stroke, not semantic drone. */
function isoTabStrokeDatamodel(
  selected: boolean,
  clientSim: boolean | undefined,
): ScriptDatamodelFocus | null {
  return selected && clientSim ? 'drone' : null
}

function simStripTabDatamodel(tabId: SimDocumentStripTab): ScriptDatamodelFocus {
  if (tabId === 'server' || isSimPlaceServerTab(tabId)) return 'server'
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
      className={className ?? `${styles.tabDiamond} ${styles.tabNeutralIcon}`}
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

/** Client sim — Drone Racer tab: brand hue matches semantic Client stroke. */
function TabClientSimDocumentIcon() {
  return (
    <Monitor
      size={12}
      strokeWidth={1.5}
      className={`${styles.tabDiamond} ${styles.tabDiamondBrand} ${styles.iconSemanticClient}`}
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
      className={`${styles.tabDiamond} ${styles.tabDiamondBrand} ${styles.iconSemanticServer}`}
      aria-hidden
    />
  )
}

/** Edit-mode ModuleScript tab — document icon (4× asset, shown at 16×16). */
const TabDroneRacerWorkspaceIcon = TabPlaceWorkspaceIcon

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
  drag: TabRowDragBindings | DualZoneTabDragBindings | TriZoneTabDragBindings,
): drag is DualZoneTabDragBindings | TriZoneTabDragBindings {
  return 'mainRowRef' in drag
}

const TAB_DRAG_STYLE_CLASSES = {
  tabDraggable: styles.tabDraggable,
  tabDragging: styles.tabDragging,
  tabDropTarget: styles.tabDropTarget,
} as const

function tabDragClassesAny(
  drag: TabRowDragBindings | DualZoneTabDragBindings | TriZoneTabDragBindings,
  index: number,
  zone?: DocumentTabStripZone,
): string {
  if (isTriZoneTabDrag(drag as object)) {
    return tabDragClassesForTri(
      drag as TriZoneTabDragBindings,
      zone!,
      index,
      TAB_DRAG_STYLE_CLASSES,
    )
  }
  if (isDualZoneTabDrag(drag)) {
    return tabDragClassesForDual(drag, zone as CombinedTabStripZone, index, TAB_DRAG_STYLE_CLASSES)
  }
  return tabDragClasses(drag, index)
}

function tabPropsAny(
  drag: TabRowDragBindings | DualZoneTabDragBindings | TriZoneTabDragBindings,
  index: number,
  zone?: DocumentTabStripZone,
) {
  if (isDualZoneTabDrag(drag)) return drag.getTabProps(zone as CombinedTabStripZone, index)
  return drag.getTabProps(index)
}

function tabActivateHandlersAny(
  drag: TabRowDragBindings | DualZoneTabDragBindings | TriZoneTabDragBindings,
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
  /** Show the popout action button in panel chrome. */
  showPopoutAction?: boolean
  /** Show the close action button in panel chrome. */
  showCloseAction?: boolean
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
  showPopoutAction = true,
  showCloseAction = true,
}: PanelChromeProps) {
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
      {showPopoutAction || showCloseAction ? (
        <div className={styles.panelActions}>
          {showPopoutAction ? (
            <button type="button" className={styles.panelAction} aria-label="Pop out panel">
              <SquareArrowOutUpRight
                size={12}
                strokeWidth={1.35}
                className={styles.panelPopoutIcon}
                aria-hidden
              />
            </button>
          ) : null}
          {showCloseAction ? (
            <button
              type="button"
              className={styles.panelAction}
              aria-label="Close panel"
              onClick={onClose}
            >
              <TabCloseIcon />
            </button>
          ) : null}
        </div>
      ) : null}
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
  level1ExplorerTree = null,
  colorTheme = 'dark',
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
  /** Level 1 place — generated hierarchy (Workspace, Camera, Terrain, …). */
  level1ExplorerTree?: Level1ExplorerTreeData | null
  /** Figma explorer icons — light vs dark theme variant. */
  colorTheme?: StudioColorTheme
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

  if (level1ExplorerTree != null && !clientSim && !showDroneIsolationExplorer) {
    return (
      <Level1ExplorerTreeView
        tree={level1ExplorerTree}
        selectedRowId={editSelectedRowId}
        onSelectRow={onEditSelectedRowIdChange}
        selectionTintActive={selectionTintActive}
        colorTheme={colorTheme}
      />
    )
  }

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
          <ExplorerTreeIcon
            rowId="bunnyExplorerRow"
            label="Bunny"
            className="Model"
            theme={colorTheme}
          />
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
          <ExplorerTreeIcon
            rowId={DRONE_ISOLATION_EXPLORER_ROW_ID}
            label={DRONE_WORKSPACE_TAB_LABEL}
            className="Model"
            theme={colorTheme}
          />
          <span className={styles.treeLabel}>{DRONE_WORKSPACE_TAB_LABEL}</span>
        </div>
        <div className={`${styles.treeNested} ${styles.guide}`}>
          {DRONE_ISOLATION_EXPLORER_CHILDREN.map(({ id, label }) => (
            <div key={id} {...bindDroneIsolationRow(id)} style={{ paddingLeft: 20 }}>
              <TreeChevron mode="spacer" />
              <ExplorerTreeIcon
                rowId={id}
                label={label}
                className={explorerRowMeta(id).className}
                theme={colorTheme}
              />
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
            { id: 'workspace', label: 'Workspace', className: 'Model' },
            { id: 'players', label: 'Players', className: 'Players' },
            { id: 'lighting', label: 'Lighting', className: 'Model' },
            { id: 'materialservice', label: 'MaterialService', className: 'Model' },
          ]

    return (
      <div className={styles.tree} {...explorerTreeProps}>
        {clientTreeRows.map((row, rowIndex) => (
          <div key={row.id} {...bindFlatSimRow(row.id)}>
            <TreeChevron mode={rowIndex === 0 ? 'closed' : rowIndex === 1 ? 'spacer' : 'closed'} />
            <ExplorerTreeIcon
              rowId={row.id}
              label={row.label}
              className={row.className ?? explorerRowMeta(row.id).className}
              theme={colorTheme}
            />
            <span className={styles.treeLabel}>{row.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.tree} {...explorerTreeProps}>
      {DRONE_RACER_EXPLORER_TREE.display.map((node) => (
        <div
          key={node.id}
          {...bindMainExplorerRow(node.id)}
          style={node.depth > 0 ? { paddingLeft: 22 * node.depth } : undefined}
        >
          <TreeChevron mode={node.chevron} />
          <ExplorerTreeIcon
            rowId={node.id}
            label={node.label}
            className={node.className}
            theme={colorTheme}
          />
          <span className={styles.treeLabel}>{node.label}</span>
        </div>
      ))}
    </div>
  )
}

export type DroneRacerWorkspaceProps = {
  clientSim?: boolean
  /** Asset window opened from Interaction settings — Bunny viewport, no isolation column or Script tabs. */
  bunnyAssetWindow?: boolean
  /** Edit mode: second column with isolated-asset preview (Interaction settings). */
  showAssetInIsolation?: boolean
  /** Edit mode: hide main strip + viewport; only the Drone isolation column is visible. */
  experienceAssetOnlyMode?: boolean
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
  /** Test mode: active tab stroke on top, left, and right (Testing UI: Tab stroke all edges). */
  playModeTabStrokeAllEdges?: boolean
  /** Test mode: Chrome-style tab — stroke on top/left/right; content connects below (Tab stroke connected). */
  playModeTabStrokeConnected?: boolean
  /** Test mode: filled background on focused Client / Server tabs (Testing UI: Tab tint). */
  playModeTabTint?: boolean
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
  /** Phase 2: primary place tab in the main document strip (dock-only places excluded). */
  mainStripPlace?: Place
  gameDisplayName?: string
  activeEditPlaceId?: ActiveEditPlaceId
  onFocusLobbyPlace?: () => void
  /** Places the client has joined (server tabs spawned). */
  joinedPlaceIds?: string[]
  clientViewPlaceId?: string
  clientJoiningPlace?: boolean
  joiningPlaceDisplayName?: string | null
  canJoinAnotherPlace?: boolean
  onClientSimJoinNextPlace?: () => void
  onClosePlaceServerTab?: (placeId: string) => void
  onFocusPlaceDocument?: (placeId: string) => void
  /** Dock-only places that can get a main-strip Server tab when joined. */
  serverPlaces?: Place[]
  /** Edit: Level 2–4 place documents in the main tab row (persisted from test). */
  openMainStripPlaceIds?: string[]
  onCloseMainStripPlaceTab?: (placeId: string) => void
  /** Select a persisted main-strip place tab (3D root — not Lobby). */
  onActivateMainStripPlaceTab?: (placeId: string) => void
  /** Edit: asset documents in the main document tab row. */
  openMainStripAssetIds?: string[]
  activeMainStripAssetId?: string | null
  onCloseMainStripAssetTab?: (assetId: string) => void
  onActivateMainStripAssetTab?: (assetId: string) => void
  /** Edit: asset documents in the isolation (Drone) column tab row. */
  openIsoStripAssetIds?: string[]
  activeIsoStripAssetId?: string | null
  onCloseIsoStripAssetTab?: (assetId: string) => void
  onActivateIsoStripAssetTab?: (assetId: string) => void
  onMainDocumentHostFocus?: () => void
  onIsoDocumentHostFocus?: () => void
  /** Return to Drone / HoverScript document (clears active iso asset tab). */
  onClearIsoStripAssetSelection?: () => void
  /** Which document region last received focus (main / iso / bottom dock). */
  documentHostFocus?: 'main' | 'bottom' | 'iso'
  /** Test Server tab label uses place display name. */
  serverTabUsesPlaceName?: boolean
  /** Test Client tab label uses `Client / {place}`. */
  clientTabUsesPlaceName?: boolean
  /** Interaction baseline — Phase 1 frozen spec vs Phase 2 workspace. */
  studioPhase?: StudioPhase
  /** Bottom place-document tab row participates in main/iso/dock drag. */
  dockTabStripEnabled?: boolean
  openPlaceDockPlaceIds?: readonly string[]
  onOpenPlaceDockPlaceIdsChange?: (placeIds: string[]) => void
  onRegisterDocumentTabStripDrag?: (drag: TriZoneTabDragBindings | null) => void
}

function DroneRacerWorkspace({
  clientSim,
  bunnyAssetWindow,
  showAssetInIsolation,
  experienceAssetOnlyMode = false,
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
  playModeTabStrokeAllEdges,
  playModeTabStrokeConnected,
  playModeTabTint,
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
  mainStripPlace,
  gameDisplayName = 'Skyline Drift',
  activeEditPlaceId = 'drone-racer',
  onFocusLobbyPlace,
  joinedPlaceIds = [],
  clientViewPlaceId = 'drone-racer',
  clientJoiningPlace = false,
  joiningPlaceDisplayName = null,
  canJoinAnotherPlace = true,
  onClientSimJoinNextPlace,
  onClosePlaceServerTab,
  onFocusPlaceDocument,
  serverPlaces = [],
  openMainStripPlaceIds = [],
  onCloseMainStripPlaceTab,
  onActivateMainStripPlaceTab,
  openMainStripAssetIds = [],
  activeMainStripAssetId = null,
  onCloseMainStripAssetTab,
  onActivateMainStripAssetTab,
  openIsoStripAssetIds = [],
  activeIsoStripAssetId = null,
  onCloseIsoStripAssetTab,
  onActivateIsoStripAssetTab,
  onMainDocumentHostFocus,
  onIsoDocumentHostFocus,
  onClearIsoStripAssetSelection,
  documentHostFocus = 'main',
  serverTabUsesPlaceName = true,
  clientTabUsesPlaceName = false,
  studioPhase = 2,
  dockTabStripEnabled = false,
  openPlaceDockPlaceIds = [],
  onOpenPlaceDockPlaceIdsChange,
  onRegisterDocumentTabStripDrag,
}: DroneRacerWorkspaceProps) {
  const phase2 = isPhase2(studioPhase)
  const [bunnyEditViewportFocused, setBunnyEditViewportFocused] = useState(false)
  const [framePortalTarget, setFramePortalTarget] = useState<HTMLElement | null>(null)
  const documentPanelRef = useRef<HTMLDivElement | null>(null)
  const floatingDocumentStackRef = useRef<HTMLDivElement | null>(null)

  const showIsolationDocked = !!showAssetInIsolation && !documentUndocked

  const mainStripPlaceResolved =
    mainStripPlace ??
    ({
      id: 'drone-racer',
      displayName: 'Lobby',
      rootTabId: 'droneRacer',
    } satisfies Place)
  const lobbyPlaceName = mainStripPlaceResolved.displayName
  const mainRootTabLabel = phase2 ? mainStripPlaceResolved.displayName : PHASE_1_MAIN_PLACE_TAB_LABEL
  const mainRootScriptPath = phase2
    ? placeScriptPathTooltip(lobbyPlaceName)
    : `${PHASE_1_MAIN_PLACE_TAB_LABEL}/Script`

  const orderedMainStripPlaceTabs = useMemo(
    () =>
      openMainStripPlaceIds
        .map((id) => serverPlaces.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p != null),
    [openMainStripPlaceIds, serverPlaces],
  )
  const orderedMainStripAssetTabs = useMemo(
    () =>
      openMainStripAssetIds
        .map((id) => assetById(id))
        .filter((asset): asset is NonNullable<typeof asset> => asset != null),
    [openMainStripAssetIds],
  )
  const orderedIsoStripAssetTabs = useMemo(
    () =>
      openIsoStripAssetIds
        .map((id) => assetById(id))
        .filter((asset): asset is NonNullable<typeof asset> => asset != null),
    [openIsoStripAssetIds],
  )
  const scriptTabPath = mainRootScriptPath
  const clientViewPlaceName =
    serverPlaces.find((p) => p.id === clientViewPlaceId)?.displayName ??
    (clientViewPlaceId === mainStripPlaceResolved.id
      ? mainStripPlaceResolved.displayName
      : clientViewPlaceId)
  const clientSimTabLabelText = simClientTabLabel(
    clientViewPlaceName,
    clientTabUsesPlaceName,
  )
  const clientSimTabPath = simClientTabPathTooltip(clientViewPlaceName)
  const clientSimVariant =
    phase2 && clientViewPlaceId !== mainStripPlaceResolved.id ? 'level-1' : 'lobby'
  const lobbyServerTabLabel = simServerTabLabel(
    lobbyPlaceName,
    serverTabUsesPlaceName,
  )
  const lobbyServerTabPath = simServerTabPathTooltip(mainStripPlaceResolved)

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
      if (isSimPlaceServerTab(tab)) {
        const placeId = placeIdFromPlaceServerTab(tab)
        return (
          placeServerUsesMainStripTab(placeId) && joinedPlaceIds.includes(placeId)
        )
      }
      return isMainScriptTabOpen(tab, scriptTabsOpen)
    },
    [
      simClientTabOpen,
      simServerTabOpen,
      simMultiClientMode,
      simClientInstanceCount,
      joinedPlaceIds,
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
        if (key.startsWith('dm:place-server:')) {
          const placeId = key.slice('dm:place-server:'.length)
          return (
            placeServerUsesMainStripTab(placeId) && joinedPlaceIds.includes(placeId)
          )
        }
        return false
      }
      if (key.startsWith('iso:')) {
        const id = key.slice(4) as EditIsolationTabId
        return id === 'isolation' ? isolationTabOpen : hoverScriptTabOpen
      }
      if (key.startsWith('dock:')) {
        return openPlaceDockPlaceIds.includes(key.slice(5))
      }
      return isMainScriptTabOpen(key.slice(7) as MainScriptTabId, scriptTabsOpen)
    },
    [
      simClientTabOpen,
      simServerTabOpen,
      simMultiClientMode,
      simClientInstanceCount,
      joinedPlaceIds,
      isolationTabOpen,
      hoverScriptTabOpen,
      scriptTabsOpen,
      openPlaceDockPlaceIds,
    ],
  )

  const combinedStripLayoutMode = clientSim ? 'sim' : 'edit'

  const defaultCombinedMainZoneKeys = useMemo(() => {
    const base = injectMultiClientMainZoneDefaults(
      buildDefaultPersistentZoneKeys(
        'main',
        simDocumentTabOrder,
        scriptTabOrder,
        editIsolationTabOrder,
        isPersistentTabKeyOpen,
      ),
      simClientInstanceCount,
      !!clientSim && simMultiClientMode,
    )
    let keys = base
    for (const placeId of joinedPlaceIds) {
      if (!placeServerUsesMainStripTab(placeId)) continue
      keys = insertPlaceServerPersistentKeyAfterClient(keys, placeId)
    }
    return keys
  }, [
    simDocumentTabOrder,
    editIsolationTabOrder,
    scriptTabOrder,
    isPersistentTabKeyOpen,
    simClientInstanceCount,
    clientSim,
    simMultiClientMode,
    joinedPlaceIds,
  ])

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

  const defaultCombinedDockZoneKeys = useMemo(
    () =>
      placeIdsInServerOrder(openPlaceDockPlaceIds, serverPlaces).map((id) =>
        dockPersistentKey(id),
      ),
    [openPlaceDockPlaceIds, serverPlaces],
  )

  const {
    main: combinedMainZonePersistentKeys,
    iso: combinedIsoZonePersistentKeys,
    dock: combinedDockZonePersistentKeys,
  } = useMemo(() => {
    const reconciled = dockTabStripEnabled
      ? reconcileDocumentStripZoneKeys(
          combinedMainZoneKeys,
          combinedIsoZoneKeys,
          null,
          defaultCombinedMainZoneKeys,
          defaultCombinedIsoZoneKeys,
          defaultCombinedDockZoneKeys,
        )
      : {
          ...reconcileCombinedZoneKeys(
            combinedMainZoneKeys,
            combinedIsoZoneKeys,
            defaultCombinedMainZoneKeys,
            defaultCombinedIsoZoneKeys,
          ),
          dock: [] as PersistentTabKey[],
        }
    const assignedElsewhere = new Set([...reconciled.main, ...reconciled.iso])
    const dock = reconciled.dock.filter((k) => !assignedElsewhere.has(k))
    return {
      main: ensureMultiClientMainZoneKeys(
        reconciled.main,
        simClientInstanceCount,
        !!clientSim && simMultiClientMode,
      ),
      iso: reconciled.iso,
      dock,
    }
  }, [
    combinedMainZoneKeys,
    combinedIsoZoneKeys,
    defaultCombinedMainZoneKeys,
    defaultCombinedIsoZoneKeys,
    defaultCombinedDockZoneKeys,
    simClientInstanceCount,
    clientSim,
    simMultiClientMode,
    dockTabStripEnabled,
  ])

  const persistentKeysForCombinedRow = useCallback(
    (keys: readonly PersistentTabKey[]) => {
      const row: (CombinedTabKey | PersistentTabKey)[] = []
      for (const pk of keys) {
        const ck = persistentToCombined(pk, combinedStripLayoutMode)
        if (ck != null) row.push(ck)
        else if (pk.startsWith('dock:')) row.push(pk)
      }
      return row
    },
    [combinedStripLayoutMode],
  )

  const combinedMainZoneTabKeys = useMemo(
    () => persistentKeysForCombinedRow(combinedMainZonePersistentKeys),
    [combinedMainZonePersistentKeys, persistentKeysForCombinedRow],
  )

  const combinedIsoZoneTabKeys = useMemo(
    () => persistentKeysForCombinedRow(combinedIsoZonePersistentKeys),
    [combinedIsoZonePersistentKeys, persistentKeysForCombinedRow],
  )

  const mainCombinedZoneHasOpenTabs = useMemo(
    () => combinedMainZonePersistentKeys.some((key) => isPersistentTabKeyOpen(key)),
    [combinedMainZonePersistentKeys, isPersistentTabKeyOpen],
  )

  /** Edit main strip: place + script tabs (lobby root tab omitted when nothing else is open). */
  const editHasVisibleMainStripDocuments = useMemo(() => {
    if (clientSim || bunnyAssetWindow) return false
    if (orderedMainStripPlaceTabs.length > 0) return true
    if (!combinedStripMode) {
      return (
        scriptATabOpen ||
        scriptBTabOpen ||
        clientScriptTabOpen ||
        serverScriptTabOpen
      )
    }
    return mainCombinedZoneHasOpenTabs
  }, [
    clientSim,
    bunnyAssetWindow,
    orderedMainStripPlaceTabs.length,
    combinedStripMode,
    scriptATabOpen,
    scriptBTabOpen,
    clientScriptTabOpen,
    serverScriptTabOpen,
    mainCombinedZoneHasOpenTabs,
  ])

  /** Isolation column fills the document panel — Experience asset view or all other tabs closed. */
  const showDroneOnlyDocumentLayout =
    showIsolationDocked &&
    isolationTabOpen &&
    ((!!experienceAssetOnlyMode && !clientSim) ||
      (clientSim && combinedStripMode && !mainCombinedZoneHasOpenTabs) ||
      (!clientSim && !editHasVisibleMainStripDocuments))

  useEffect(() => {
    if (!showDroneOnlyDocumentLayout) return
    if (editDocumentFocus === 'isolation' || editDocumentFocus === 'hoverScript') return
    onEditDocumentFocusChange('isolation')
  }, [showDroneOnlyDocumentLayout, editDocumentFocus, onEditDocumentFocusChange])

  const simDocumentTabOrderRef = useRef(simDocumentTabOrder)
  simDocumentTabOrderRef.current = simDocumentTabOrder
  const scriptTabOrderRef = useRef(scriptTabOrder)
  scriptTabOrderRef.current = scriptTabOrder
  const editIsolationTabOrderRef = useRef(editIsolationTabOrder)
  editIsolationTabOrderRef.current = editIsolationTabOrder

  const syncOpenPlaceDockFromZoneKeys = useCallback(
    (
      mainPersistent: readonly PersistentTabKey[],
      isoPersistent: readonly PersistentTabKey[],
      dockPersistent: readonly PersistentTabKey[],
    ) => {
      if (!onOpenPlaceDockPlaceIdsChange) return
      const dockIds = dockPersistent
        .map((k) => placeIdFromDockPersistentKey(k))
        .filter((id): id is string => id != null)
      const alsoOpen = [...mainPersistent, ...isoPersistent]
        .filter((k) => k.startsWith('dock:'))
        .map((k) => k.slice(5))
      onOpenPlaceDockPlaceIdsChange(
        placeIdsInServerOrder(
          mergeOpenPlaceDockPlaceIds([...dockIds, ...alsoOpen]),
          serverPlaces,
        ),
      )
    },
    [onOpenPlaceDockPlaceIdsChange, serverPlaces],
  )

  const applyDocumentStripZoneUpdate = useCallback(
    (
      mainPersistent: PersistentTabKey[],
      isoPersistent: PersistentTabKey[],
      dockPersistent: PersistentTabKey[],
    ) => {
      onCombinedMainZoneKeysChange?.(mainPersistent)
      onCombinedIsoZoneKeysChange?.(isoPersistent)
      syncOpenPlaceDockFromZoneKeys(mainPersistent, isoPersistent, dockPersistent)

      const synced = syncAllDocumentOrdersFromPersistentZones(
        mainPersistent,
        isoPersistent,
        simDocumentTabOrderRef.current,
        scriptTabOrderRef.current,
        editIsolationTabOrderRef.current,
        dockPersistent,
      )
      onSimDocumentTabOrderChange?.(synced.simOrder)
      onScriptTabOrderChange?.(synced.scriptOrder)
      onEditIsolationTabOrderChange?.(synced.isoTabOrder)
    },
    [
      onCombinedMainZoneKeysChange,
      onCombinedIsoZoneKeysChange,
      syncOpenPlaceDockFromZoneKeys,
      onSimDocumentTabOrderChange,
      onScriptTabOrderChange,
      onEditIsolationTabOrderChange,
    ],
  )

  const combinedTabDrag = useTriZoneTabDrag({
    onReorderWithin: (zone, from, to) => {
      if (zone === 'main') {
        applyDocumentStripZoneUpdate(
          reorderZoneTabKeys(combinedMainZonePersistentKeys, from, to),
          combinedIsoZonePersistentKeys,
          combinedDockZonePersistentKeys,
        )
      } else if (zone === 'iso') {
        applyDocumentStripZoneUpdate(
          combinedMainZonePersistentKeys,
          reorderZoneTabKeys(combinedIsoZonePersistentKeys, from, to),
          combinedDockZonePersistentKeys,
        )
      } else {
        const dockIds = combinedDockZonePersistentKeys
          .map((k) => placeIdFromDockPersistentKey(k))
          .filter((id): id is string => id != null)
        const reordered = reorderZoneTabKeys(
          dockIds.map((id) => dockPersistentKey(id)),
          from,
          to,
        )
          .map((k) => placeIdFromDockPersistentKey(k))
          .filter((id): id is string => id != null)
        onOpenPlaceDockPlaceIdsChange?.(
          placeIdsInServerOrder(reordered, serverPlaces),
        )
      }
    },
    onMoveBetween: (fromZone, fromIndex, toZone, toIndex) => {
      const moved = moveTabBetweenThreeZones(
        combinedMainZonePersistentKeys,
        combinedIsoZonePersistentKeys,
        combinedDockZonePersistentKeys,
        fromZone,
        fromIndex,
        toZone,
        toIndex,
      )
      if (moved) {
        applyDocumentStripZoneUpdate(moved.mainKeys, moved.isoKeys, moved.dockKeys)
      }
    },
  })

  const combinedTabDragRef = useRef(combinedTabDrag)
  combinedTabDragRef.current = combinedTabDrag

  useLayoutEffect(() => {
    if (!dockTabStripEnabled || !combinedStripMode) {
      onRegisterDocumentTabStripDrag?.(null)
      return
    }
    onRegisterDocumentTabStripDrag?.(combinedTabDragRef.current)
    return () => onRegisterDocumentTabStripDrag?.(null)
  }, [dockTabStripEnabled, combinedStripMode, onRegisterDocumentTabStripDrag])

  const isCombinedTabKey = (k: CombinedTabKey | PersistentTabKey): k is CombinedTabKey =>
    k.startsWith('sim:') || k.startsWith('iso:') || k.startsWith('main:')

  const combinedMainZoneTabKeysForZoneCheck = useMemo(
    () => combinedMainZoneTabKeys.filter(isCombinedTabKey),
    [combinedMainZoneTabKeys],
  )

  const combinedIsoZoneTabKeysForZoneCheck = useMemo(
    () => combinedIsoZoneTabKeys.filter(isCombinedTabKey),
    [combinedIsoZoneTabKeys],
  )

  const hoverScriptInMainZone =
    combinedStripMode &&
    tabKeyInZone(
      isoTabKey('hoverScript'),
      'main',
      combinedMainZoneTabKeysForZoneCheck,
      combinedIsoZoneTabKeysForZoneCheck,
    )
  const hoverScriptInIsoZone =
    !combinedStripMode ||
    tabKeyInZone(
      isoTabKey('hoverScript'),
      'iso',
      combinedMainZoneTabKeysForZoneCheck,
      combinedIsoZoneTabKeysForZoneCheck,
    )
  const isolationInMainZone =
    combinedStripMode &&
    tabKeyInZone(
      isoTabKey('isolation'),
      'main',
      combinedMainZoneTabKeysForZoneCheck,
      combinedIsoZoneTabKeysForZoneCheck,
    )
  const isolationInIsoZone =
    !combinedStripMode ||
    tabKeyInZone(
      isoTabKey('isolation'),
      'iso',
      combinedMainZoneTabKeysForZoneCheck,
      combinedIsoZoneTabKeysForZoneCheck,
    )

  const droneIsolationPreviewInIso =
    !!showAssetInIsolation &&
    documentHostFocus === 'iso' &&
    editDocumentFocus === 'isolation' &&
    isolationInIsoZone &&
    activeIsoStripAssetId == null
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
      tabKeyInZone(
        simTabKey(tab),
        'iso',
        combinedMainZoneTabKeysForZoneCheck,
        combinedIsoZoneTabKeysForZoneCheck,
      ),
    [
      combinedStripMode,
      combinedMainZoneTabKeysForZoneCheck,
      combinedIsoZoneTabKeysForZoneCheck,
    ],
  )

  const simScriptTabInMainZone = useCallback(
    (tab: MainScriptTabId) =>
      !combinedStripMode ||
      tabKeyInZone(
        simTabKey(tab),
        'main',
        combinedMainZoneTabKeysForZoneCheck,
        combinedIsoZoneTabKeysForZoneCheck,
      ),
    [
      combinedStripMode,
      combinedMainZoneTabKeysForZoneCheck,
      combinedIsoZoneTabKeysForZoneCheck,
    ],
  )

  const editScriptTabInIsoZone = useCallback(
    (tab: MainScriptTabId) =>
      combinedStripMode &&
      tabKeyInZone(
        mainScriptTabKey(tab),
        'iso',
        combinedMainZoneTabKeysForZoneCheck,
        combinedIsoZoneTabKeysForZoneCheck,
      ),
    [
      combinedStripMode,
      combinedMainZoneTabKeysForZoneCheck,
      combinedIsoZoneTabKeysForZoneCheck,
    ],
  )

  const editScriptTabInMainZone = useCallback(
    (tab: MainScriptTabId) =>
      !combinedStripMode ||
      tabKeyInZone(
        mainScriptTabKey(tab),
        'main',
        combinedMainZoneTabKeysForZoneCheck,
        combinedIsoZoneTabKeysForZoneCheck,
      ),
    [
      combinedStripMode,
      combinedMainZoneTabKeysForZoneCheck,
      combinedIsoZoneTabKeysForZoneCheck,
    ],
  )

  const isoColumnScriptTabOpen =
    combinedStripMode &&
    mainDocumentScriptOpen &&
    (clientSim
      ? simScriptTabInIsoZone(mainDocumentEditorTab as MainScriptTabId)
      : editScriptTabInIsoZone(mainDocumentEditorTab as MainScriptTabId))

  /** Drone isolation is the visible iso-column document even when focus is elsewhere (e.g. Asset Manager). */
  const isoColumnShowsDronePreview =
    showIsolationDocked &&
    isolationTabOpen &&
    !isoColumnScriptTabOpen &&
    !hoverScriptDocumentInIso &&
    activeIsoStripAssetId == null

  /** Isolation strip tab chrome follows the visible document, not keyboard/focus alone. */
  const isolationTabDocumentActive =
    isolationTabOpen &&
    documentHostFocus === 'iso' &&
    activeIsoStripAssetId == null &&
    (isolationInIsoZone
      ? isoColumnShowsDronePreview
      : editDocumentFocus === 'isolation' && isolationInMainZone)

  const hoverScriptTabDocumentActive =
    hoverScriptTabOpen &&
    documentHostFocus === 'iso' &&
    (hoverScriptInIsoZone
      ? hoverScriptDocumentInIso
      : editDocumentFocus === 'hoverScript' && hoverScriptInMainZone)

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
      onFocusLobbyPlace?.()
      onSimViewportFocusChange?.('client')
      onSimFocusedStripTabChange?.(tab)
      onMainDocumentEditorTabChange('droneRacer')
      onEditDocumentFocusChange('main')
    },
    [
      onFocusLobbyPlace,
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

  /** Lobby main-strip Server tab — not place-server:level-N tabs or the bottom-dock Level 1 doc. */
  const simServerTabChromeActive =
    simFocus === 'server' &&
    mainDocumentEditorTab === 'droneRacer' &&
    simFocusedStripTab === 'server'
  const splitClientPrimaryTabActive = clientDocumentTab === 'droneRacer'
  const splitServerPrimaryTabActive = serverDocumentTab === 'droneRacer'

  const strokeOn = !!playModeHasStroke
  const focusStrokeOn = !!playModeHasFocusStroke
  const tabStrokeOn = !!playModeTabStroke
  const tabStrokeAllEdgesOn = !!playModeTabStrokeAllEdges
  const tabStrokeConnectedOn = !!playModeTabStrokeConnected && tabStrokeOn
  const tabStrokeConnectedAttrs = tabStrokeConnectedOn
    ? ({ 'data-tab-stroke-connected': '' as const })
    : {}

  const connectedTabMaskDeps = [
    mainDocumentEditorTab,
    editDocumentFocus,
    documentHostFocus,
    clientSim,
    playModeSplitView,
    simFocusedStripTab,
    simDocumentTabOrder,
    combinedMainZoneKeys,
    combinedIsoZoneKeys,
    scriptTabOrder,
    showIsolationDocked,
  ]

  const connectedTabGutterClassNames = {
    tabRow: styles.tabRow,
    tabActiveTopStrokeClient: styles.tabActiveTopStrokeClient,
    tabActiveTopStrokeServer: styles.tabActiveTopStrokeServer,
    assetIsolationTabRow: styles.assetIsolationTabRow,
    assetIsolationPanel: styles.assetIsolationPanel,
  }

  useConnectedTabGutterMetrics(
    tabStrokeConnectedOn,
    documentPanelRef,
    connectedTabGutterClassNames,
    connectedTabMaskDeps,
  )

  useConnectedTabGutterMetrics(
    tabStrokeConnectedOn && documentUndocked,
    floatingDocumentStackRef,
    connectedTabGutterClassNames,
    [editDocumentFocus, ...connectedTabMaskDeps],
  )

  const tabTintOn = !!playModeTabTint
  /** Lobby place document (main strip) — not dock-only places like Level 1 Server. */
  const lobbyPlaceDocumentFocused = activeEditPlaceId === mainStripPlaceResolved.id
  const mainStripPlaceDocumentFocused =
    activeEditPlaceId !== mainStripPlaceResolved.id &&
    (openMainStripPlaceIds.includes(activeEditPlaceId) ||
      (clientSim && joinedPlaceIds.includes(activeEditPlaceId)))
  const mainStripPlaceDocumentActive =
    lobbyPlaceDocumentFocused || mainStripPlaceDocumentFocused
  const mainStripAssetDocumentActive = activeMainStripAssetId != null
  const mainStripServerPlaceDocumentFocused = (placeId: string) =>
    activeEditPlaceId === placeId && mainStripPlaceDocumentFocused
  /** Main document strip: tab stroke while the main column owns document focus. */
  const editMainStripTabStrokeActive = !clientSim && editDocumentFocus === 'main'
  const mainStripTabStrokeActive =
    editMainStripTabStrokeActive ||
    (clientSim &&
      editDocumentFocus === 'main' &&
      (mainStripPlaceDocumentActive || mainStripAssetDocumentActive))
  const editMainStripPlaceTabStrokeOn =
    tabStrokeOn || (!clientSim && !!editDatamodelShowStroke)
  const editMainStripPlaceSemanticStrokeOn =
    strokeOn || (!clientSim && !!editDatamodelShowStroke)
  const mainStripPlaceEditViewportActive =
    !clientSim &&
    mainStripPlaceDocumentFocused &&
    mainDocumentEditorTab === 'droneRacer' &&
    activeMainStripAssetId == null
  /** Asset isolation strip: tab stroke while an isolation document has focus. */
  const editIsoStripTabStrokeActive =
    !clientSim &&
    (editDocumentFocus === 'isolation' || editDocumentFocus === 'hoverScript')
  const isoStripTabStrokeActive =
    editIsoStripTabStrokeActive ||
    (clientSim &&
      documentHostFocus === 'iso' &&
      (editDocumentFocus === 'isolation' || editDocumentFocus === 'hoverScript'))

  /** Active = this tab is the visible document (only one active tab per strip). */
  const buildTabClass = (
    active: boolean,
    datamodel: ScriptDatamodelFocus | null,
    dragClass = '',
    tabStrokeActive?: boolean,
  ) => {
    const parts = [styles.tab, active ? styles.tabActive : styles.tabInactive]
    const showTabStroke = tabStrokeActive ?? active
    const editFocusStroke = !clientSim && active && showTabStroke

    if (showTabStroke && (tabStrokeOn || editFocusStroke)) {
      parts.push(styles.tabActiveTopStroke)
      if (tabStrokeOn) {
        if (tabStrokeConnectedOn) {
          parts.push(styles.tabActiveStrokeConnected)
          if (active) parts.push(styles.tabActiveTabConnected)
        } else if (tabStrokeAllEdgesOn) {
          parts.push(styles.tabActiveAllEdgesStroke)
        }
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
      if (editFocusStroke) {
        parts.push(styles.tabActiveTopStrokeEdit)
      }
    }
    if (showTabStroke && tabTintOn && datamodel === 'client') {
      parts.push(styles.tabActiveTintClient)
    } else if (showTabStroke && tabTintOn && datamodel === 'server') {
      parts.push(styles.tabActiveTintServer)
    }
    if (dragClass) parts.push(dragClass)
    return parts.join(' ')
  }

  const selectMainPlaceTab = useCallback(() => {
    onFocusLobbyPlace?.()
    onMainDocumentEditorTabChange('droneRacer')
    onEditDocumentFocusChange('main')
  }, [onEditDocumentFocusChange, onFocusLobbyPlace, onMainDocumentEditorTabChange])

  /** Edit: inset ring on main Drone Racer viewport (split = focused column; single = main doc focused). */
  const mainEditInsetRing =
    !clientSim &&
    (mainStripPlaceDocumentActive || mainStripAssetDocumentActive) &&
    (showAssetInIsolation
      ? mainColumnDocumentFocused
      : editDocumentFocus === 'main' &&
        (mainDocumentEditorTab === 'droneRacer' ||
          mainStripAssetDocumentActive ||
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
    lobbyPlaceDocumentFocused &&
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
    lobbyPlaceDocumentFocused &&
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
    lobbyPlaceDocumentFocused &&
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
    lobbyPlaceDocumentFocused &&
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
    !!clientSim &&
    lobbyPlaceDocumentFocused &&
    simDocumentChromeActive &&
    simTintHoleActive &&
    simFocus === 'client'
  const serverElevateForSimTint =
    !!clientSim &&
    lobbyPlaceDocumentFocused &&
    simDocumentChromeActive &&
    simTintHoleActive &&
    simFocus === 'server'

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

  /** Test: Client sim art (Lobby until triple-click joins Level 1). */
  const clientTestViewportBody = clientSim ? (
    <ClientSim
      variant={clientSimVariant}
      loading={clientJoiningPlace}
      loadingLabel={
        joiningPlaceDisplayName ? `Joining ${joiningPlaceDisplayName}…` : 'Joining…'
      }
      canJoinNextPlace={canJoinAnotherPlace}
      onJoinNextPlace={onClientSimJoinNextPlace}
    />
  ) : (
    droneViewportImage
  )

  const renderPlaceServerTestViewport = (
    placeId: string,
    showServerSimChrome: boolean,
  ) => {
    const placeServerFocused =
      isSimPlaceServerTab(simFocusedStripTab) &&
      placeIdFromPlaceServerTab(simFocusedStripTab) === placeId
    const placeServerDocumentFocused = mainStripServerPlaceDocumentFocused(placeId)
    const hasJoinedClient = level1ServerShowsJoinedClient(
      placeId,
      !!clientSim,
      clientViewPlaceId,
      joinedPlaceIds,
    )
    return (
      <div
        className={[
          styles.serverViewport,
          showServerSimChrome &&
          placeServerDocumentFocused &&
          placeServerFocused &&
          strokeOn &&
          !focusStrokeOn
            ? styles.serverViewportFocused
            : null,
        ]
          .filter(Boolean)
          .join(' ')}
        onPointerDown={() => {
          onFocusPlaceDocument?.(placeId)
          onSimViewportFocusChange?.('server')
          onSimFocusedStripTabChange?.(simPlaceServerTabId(placeId))
          onEditDocumentFocusChange('main')
        }}
      >
        <ServerSim variant="level-1" hasJoinedClient={hasJoinedClient} />
        {showServerSimChrome &&
        placeServerDocumentFocused &&
        placeServerFocused &&
        (focusStrokeOn || !clientSim) ? (
          <div className={styles.editWorkspaceInsetRing} aria-hidden />
        ) : null}
      </div>
    )
  }

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
    if (tab === 'scriptA') return DRONE_RACER_SCRIPT_A_SOURCE
    if (tab === 'scriptB') return DRONE_RACER_SCRIPT_B_SOURCE
    return DRONE_RACER_SCRIPT_A_SOURCE
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
        onFocusLobbyPlace?.()
        onEditDocumentFocusChange('main')
      }}
    >
      <ScriptEditor source={scriptPlaceholderForTab(activeScriptTab)} />
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
      showClientSimChrome && lobbyPlaceDocumentFocused && strokeOn && !focusStrokeOn
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
      lobbyPlaceDocumentFocused &&
      focusStrokeOn &&
      !useSplitColumnFocusChrome &&
      (datamodelFocus === 'client' ||
        datamodelFocus === 'server' ||
        datamodelFocus === 'drone')

    const viewportClass = [
      styles.viewport,
      mainStripPlaceEditViewportActive ? styles.serverViewport : null,
      mainStripPlaceEditViewportActive &&
      editMainStripPlaceSemanticStrokeOn &&
      !focusStrokeOn
        ? styles.serverViewportFocused
        : null,
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
          if (mainStripPlaceDocumentFocused) {
            onFocusPlaceDocument?.(activeEditPlaceId)
          } else {
            onFocusLobbyPlace?.()
          }
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
        lobbyPlaceDocumentFocused &&
        showEditDatamodelStrokeOnMainViewport &&
        datamodelFocus === 'client' ? (
          <div className={styles.simDatamodelStrokeOverlay} aria-hidden />
        ) : null}
        {showClientSimChrome &&
        lobbyPlaceDocumentFocused &&
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
        showServerSimChrome &&
        lobbyPlaceDocumentFocused &&
        strokeOn &&
        !focusStrokeOn &&
        simFocus === 'server'
          ? styles.serverViewportFocused
          : null,
        showServerSimChrome && serverElevateForSimTint ? styles.viewportAboveSimTint : null,
      ]
        .filter(Boolean)
        .join(' ')}
      data-node-id="3841:113029-viewport"
      onPointerDown={() => {
        onFocusLobbyPlace?.()
        onSimViewportFocusChange?.('server')
        onEditDocumentFocusChange('main')
      }}
    >
      <ServerSim />
      {showServerSimChrome &&
      lobbyPlaceDocumentFocused &&
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

  const renderSimServerColumnViewport = (showServerSimChrome: boolean) => {
    if (serverDocumentScriptOpen) {
      return renderMainViewport(showServerSimChrome, serverDocumentTab, 'server')
    }
    if (isSimPlaceServerTab(simFocusedStripTab)) {
      return renderPlaceServerTestViewport(
        placeIdFromPlaceServerTab(simFocusedStripTab),
        showServerSimChrome,
      )
    }
    return renderServerTestViewport(showServerSimChrome)
  }

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
  const joinedPlaceServerStripTabs = simDocumentTabOrder.filter(isSimPlaceServerTab)
  const showSimServerColumn = simServerTabOpen || joinedPlaceServerStripTabs.length > 0
  const serverColumnStripTabs: SimDocumentStripTab[] = [
    'server',
    ...joinedPlaceServerStripTabs,
    'serverScript',
  ]

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
      onMainDocumentHostFocus?.()
      onFocusLobbyPlace?.()
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
              selected ? scriptTabStrokeDatamodel(tabId as MainDocumentEditorTab, clientSim) : null,
              tabDragClasses(drag, tabIndex),
              selected && mainStripTabStrokeActive,
            )

          switch (tabId) {
            case 'scriptA':
              return (
                <TabWithPathTooltip
                  key="scriptA"
                  path={scriptTabPath}
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
                  path={scriptTabPath}
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
    drag: TabRowDragBindings | DualZoneTabDragBindings | TriZoneTabDragBindings,
    strip: {
      activeTab: MainDocumentEditorTab
      onTabChange: (tab: MainDocumentEditorTab) => void
      onCloseScriptTab: (tab: MainScriptTabId) => void
      isClientTabActive: (tab: SimDocumentStripTab) => boolean
      serverDmActive: boolean
    },
    dragZone?: DocumentTabStripZone,
  ) => {
    const selectDroneRacerScriptTab = (tab: 'scriptA' | 'scriptB') => {
      onMainDocumentHostFocus?.()
      onFocusLobbyPlace?.()
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
          path={`${clientSimTabPath} (${simClientInstanceLabel(clientIndex)})`}
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

    if (isSimPlaceServerTab(tabId)) {
      const placeId = placeIdFromPlaceServerTab(tabId)
      const place = serverPlaces.find((p) => p.id === placeId)
      const placeName = place?.displayName ?? 'Server'
      const label = simServerTabLabel(placeName, serverTabUsesPlaceName)
      const path = place ? simServerTabPathTooltip(place) : `Server/${placeName}`
      const tabActive = simFocusedStripTab === tabId
      return (
        <TabWithPathTooltip
          key={tabId}
          path={path}
          role="tab"
          tabIndex={0}
          aria-selected={tabActive}
          className={simTabClass(tabActive, tabId)}
          {...tabPropsAny(drag, tabIndex, dragZone)}
          {...tabActivateHandlersAny(drag, () => {
            onFocusPlaceDocument?.(placeId)
            strip.onTabChange('droneRacer')
            onSimViewportFocusChange?.('server')
            onSimFocusedStripTabChange?.(tabId)
            onEditDocumentFocusChange('main')
          })}
        >
          <TabServerSimDocumentIcon />
          <span>{label}</span>
          <TabCloseButton
            onClose={() => onClosePlaceServerTab?.(placeId)}
          />
        </TabWithPathTooltip>
      )
    }

    switch (tabId) {
      case 'client':
        return (
          <TabWithPathTooltip
            key="client"
            path={clientSimTabPath}
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
            <span>{clientSimTabLabelText}</span>
            <TabCloseButton onClose={closeSimClientTab} />
          </TabWithPathTooltip>
        )
      case 'server':
        return (
          <TabWithPathTooltip
            key="server"
            path={lobbyServerTabPath}
            role="tab"
            tabIndex={0}
            aria-selected={strip.serverDmActive}
            className={simTabClass(strip.serverDmActive, 'server')}
            {...tabPropsAny(drag, tabIndex, dragZone)}
            {...tabActivateHandlersAny(drag, () => {
              onFocusLobbyPlace?.()
              strip.onTabChange('droneRacer')
              onSimViewportFocusChange?.('server')
              onSimFocusedStripTabChange?.('server')
              onEditDocumentFocusChange('main')
            })}
          >
            <TabServerSimDocumentIcon />
            <span>{lobbyServerTabLabel}</span>
            <TabCloseButton onClose={closeSimServerTab} />
          </TabWithPathTooltip>
        )
      case 'scriptA':
        return (
          <TabWithPathTooltip
            key="scriptA"
            path={scriptTabPath}
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
            path={scriptTabPath}
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
      <div className={styles.tabRowUnderline} aria-hidden />
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
    zone: DocumentTabStripZone,
  ) => {
    const tabClass = (selected: boolean) =>
      buildTabClass(
        selected,
        selected ? isoTabStrokeDatamodel(selected, clientSim) : null,
        tabDragClassesAny(combinedTabDrag, tabIndex, zone),
        zone === 'iso' ? selected && isoStripTabStrokeActive : undefined,
      )

    if (tabId === 'isolation') {
      return (
        <TabWithPathTooltip
          key="isolation"
          path={TAB_PATH_DRONE_ASSET}
          role="tab"
          tabIndex={0}
          aria-selected={isolationTabDocumentActive}
          className={tabClass(isolationTabDocumentActive)}
          {...tabPropsAny(combinedTabDrag, tabIndex, zone)}
          {...tabActivateHandlersAny(combinedTabDrag, () => {
            onIsoDocumentHostFocus?.()
            onClearIsoStripAssetSelection?.()
            onEditDocumentFocusChange('isolation')
          })}
        >
          <TabModelIcon />
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
        aria-selected={hoverScriptTabDocumentActive}
        className={tabClass(hoverScriptTabDocumentActive)}
        {...tabPropsAny(combinedTabDrag, tabIndex, zone)}
        {...tabActivateHandlersAny(combinedTabDrag, () => {
          onIsoDocumentHostFocus?.()
          onClearIsoStripAssetSelection?.()
          onEditDocumentFocusChange('hoverScript')
        })}
      >
        <TabScriptEditIcon />
        <span>{HOVER_SCRIPT_TAB_LABEL}</span>
        <TabCloseButton onClose={() => closeEditIsolationTab('hoverScript')} />
      </TabWithPathTooltip>
    )
  }

  const renderCombinedEditScriptTab = (
    tabId: MainScriptTabId,
    tabIndex: number,
    zone: DocumentTabStripZone,
  ) => {
    const tabClass = (selected: boolean) =>
      buildTabClass(
        selected,
        selected ? scriptTabStrokeDatamodel(tabId as MainDocumentEditorTab, clientSim) : null,
        tabDragClassesAny(combinedTabDrag, tabIndex, zone),
        zone === 'main' ? selected && mainStripTabStrokeActive : undefined,
      )

    const selectDroneRacerScriptTab = (tab: 'scriptA' | 'scriptB') => {
      onMainDocumentHostFocus?.()
      onFocusLobbyPlace?.()
      onEditDocumentFocusChange('main')
      onMainDocumentEditorTabChange(tab)
    }

    switch (tabId) {
      case 'scriptA':
        return (
          <TabWithPathTooltip
            key="scriptA"
            path={scriptTabPath}
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
            path={scriptTabPath}
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

  const closeDockPlaceTabInStrip = useCallback(
    (placeId: string) => {
      const key = dockPersistentKey(placeId)
      const nextMain = combinedMainZonePersistentKeys.filter((k) => k !== key)
      const nextIso = combinedIsoZonePersistentKeys.filter((k) => k !== key)
      const nextDock = combinedDockZonePersistentKeys.filter((k) => k !== key)
      applyDocumentStripZoneUpdate(nextMain, nextIso, nextDock)
      onOpenPlaceDockPlaceIdsChange?.(
        openPlaceDockPlaceIds.filter((id) => id !== placeId),
      )
    },
    [
      combinedMainZonePersistentKeys,
      combinedIsoZonePersistentKeys,
      combinedDockZonePersistentKeys,
      applyDocumentStripZoneUpdate,
      onOpenPlaceDockPlaceIdsChange,
      openPlaceDockPlaceIds,
    ],
  )

  const renderCombinedDockPlaceTab = (
    key: PersistentTabKey,
    tabIndex: number,
    zone: DocumentTabStripZone,
  ) => {
    const placeId = placeIdFromDockPersistentKey(key)
    if (placeId == null) return null
    const place = serverPlaces.find((p) => p.id === placeId)
    const placeName = place?.displayName ?? placeId
    const simTabId = simPlaceServerTabId(placeId)
    const selected = clientSim
      ? simFocusedStripTab === simTabId
      : mainDocumentEditorTab === 'droneRacer' && activeEditPlaceId === placeId
    const tabClass = buildTabClass(
      selected,
      selected ? 'server' : null,
      tabDragClassesAny(combinedTabDrag, tabIndex, zone),
      zone === 'main' ? selected && mainStripTabStrokeActive : undefined,
    )
    return (
      <DocumentPlaceTab
        key={key}
        label={
          clientSim ? simServerTabLabel(placeName, serverTabUsesPlaceName) : placeName
        }
        path={
          place
            ? clientSim
              ? simServerTabPathTooltip(place)
              : placeRootPathTooltip(place)
            : placeName
        }
        tabClassName={tabClass}
        leadingIcon={clientSim ? 'server' : 'place'}
        selected={selected}
        onActivate={() => {
          if (clientSim) {
            onFocusPlaceDocument?.(placeId)
            onSimFocusedStripTabChange?.(simTabId)
            onSimViewportFocusChange?.('server')
            onEditDocumentFocusChange('main')
            onMainDocumentEditorTabChange('droneRacer')
          } else {
            onActivateMainStripPlaceTab?.(placeId)
          }
        }}
        onClose={() => {
          if (clientSim) onClosePlaceServerTab?.(placeId)
          else closeDockPlaceTabInStrip(placeId)
        }}
        dragTabIndex={tabIndex}
        dragClassName={tabDragClassesAny(combinedTabDrag, tabIndex, zone)}
        dragTabProps={{
          ...tabPropsAny(combinedTabDrag, tabIndex, zone),
          onClick: (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation()
            if (combinedTabDrag.consumeClickAfterDrag()) {
              e.preventDefault()
              return
            }
          },
        }}
      />
    )
  }

  const renderCombinedZoneTab = (
    key: CombinedTabKey | PersistentTabKey,
    tabIndex: number,
    zone: DocumentTabStripZone,
  ) => {
    if (key.startsWith('dock:')) {
      return renderCombinedDockPlaceTab(key as PersistentTabKey, tabIndex, zone)
    }
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
    zone: DocumentTabStripZone,
    keys: readonly (CombinedTabKey | PersistentTabKey)[],
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
      <div className={styles.tabRowUnderline} aria-hidden />
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
    <div
      ref={combinedTabDrag.isoRowRef}
      className={`${styles.tabRow} ${styles.assetIsolationTabRow}`}
      data-node-id="3841:115139-iso-tabs"
      onPointerDown={() => onIsoDocumentHostFocus?.()}
    >
      {combinedIsoZoneTabKeys
        .filter((key) => {
          if (!clientSim || !key.startsWith('sim:')) return true
          const tab = key.slice(4) as SimDocumentStripTab
          return isSimStripTabOpen(tab)
        })
        .map((key, tabIndex) => renderCombinedZoneTab(key, tabIndex, 'iso'))}
      {phase2 && !clientSim
        ? orderedIsoStripAssetTabs.map((asset) => {
            const assetTabSelected = activeIsoStripAssetId === asset.id
            return (
              <TabWithPathTooltip
                key={asset.id}
                path={`${gameDisplayName}/${asset.name}`}
                role="tab"
                tabIndex={0}
                aria-selected={assetTabSelected}
                className={buildTabClass(
                  assetTabSelected,
                  assetTabSelected ? isoTabStrokeDatamodel(assetTabSelected, clientSim) : null,
                  '',
                  assetTabSelected && isoStripTabStrokeActive,
                )}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  onIsoDocumentHostFocus?.()
                  onActivateIsoStripAssetTab?.(asset.id)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onIsoDocumentHostFocus?.()
                  onActivateIsoStripAssetTab?.(asset.id)
                }}
              >
                {asset.thumb === 'audio' ? (
                  <Music size={12} strokeWidth={1.5} className={`${styles.tabDiamond} ${styles.tabNeutralIcon}`} aria-hidden />
                ) : (
                  <TabModelIcon />
                )}
                <span>{asset.name}</span>
                <TabCloseButton onClose={() => onCloseIsoStripAssetTab?.(asset.id)} />
              </TabWithPathTooltip>
            )
          })
        : null}
      <div className={styles.tabRowUnderline} aria-hidden />
    </div>
  ) : (
    <div
      ref={editIsolationTabDrag.rowRef}
      className={`${styles.tabRow} ${styles.assetIsolationTabRow}`}
      data-node-id="3841:115139-iso-tabs"
      onPointerDown={() => onIsoDocumentHostFocus?.()}
    >
        {openEditIsolationTabs.map((tabId, tabIndex) => {
        const tabClass = (selected: boolean) =>
          buildTabClass(
            selected,
            selected ? isoTabStrokeDatamodel(selected, clientSim) : null,
            tabDragClasses(editIsolationTabDrag, tabIndex),
            selected && isoStripTabStrokeActive,
          )

        if (tabId === 'isolation') {
          return (
            <TabWithPathTooltip
              key="isolation"
              path={TAB_PATH_DRONE_ASSET}
              role="tab"
              tabIndex={0}
              aria-selected={isolationTabDocumentActive}
              className={tabClass(isolationTabDocumentActive)}
              {...editIsolationTabDrag.getTabProps(tabIndex)}
              {...tabActivateHandlers(editIsolationTabDrag, () => {
                onIsoDocumentHostFocus?.()
                onClearIsoStripAssetSelection?.()
                onEditDocumentFocusChange('isolation')
              })}
            >
              <TabModelIcon />
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
            aria-selected={hoverScriptTabDocumentActive}
            className={tabClass(hoverScriptTabDocumentActive)}
            {...editIsolationTabDrag.getTabProps(tabIndex)}
            {...tabActivateHandlers(editIsolationTabDrag, () => {
              onIsoDocumentHostFocus?.()
              onClearIsoStripAssetSelection?.()
              onEditDocumentFocusChange('hoverScript')
            })}
          >
            <TabScriptEditIcon />
            <span>{HOVER_SCRIPT_TAB_LABEL}</span>
            <TabCloseButton onClose={() => closeEditIsolationTab('hoverScript')} />
          </TabWithPathTooltip>
        )
      })}
      {phase2 && !clientSim
        ? orderedIsoStripAssetTabs.map((asset) => {
            const assetTabSelected = activeIsoStripAssetId === asset.id
            return (
              <TabWithPathTooltip
                key={asset.id}
                path={`${gameDisplayName}/${asset.name}`}
                role="tab"
                tabIndex={0}
                aria-selected={assetTabSelected}
                className={buildTabClass(
                  assetTabSelected,
                  assetTabSelected ? isoTabStrokeDatamodel(assetTabSelected, clientSim) : null,
                  '',
                  assetTabSelected && isoStripTabStrokeActive,
                )}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  onIsoDocumentHostFocus?.()
                  onActivateIsoStripAssetTab?.(asset.id)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onIsoDocumentHostFocus?.()
                  onActivateIsoStripAssetTab?.(asset.id)
                }}
              >
                {asset.thumb === 'audio' ? (
                  <Music size={12} strokeWidth={1.5} className={`${styles.tabDiamond} ${styles.tabNeutralIcon}`} aria-hidden />
                ) : (
                  <TabModelIcon />
                )}
                <span>{asset.name}</span>
                <TabCloseButton onClose={() => onCloseIsoStripAssetTab?.(asset.id)} />
              </TabWithPathTooltip>
            )
          })
        : null}
      <div className={styles.tabRowUnderline} aria-hidden />
    </div>
  )

  const assetIsolationColumnAside = (
    <aside
      className={styles.assetIsolationPanel}
      aria-label={DRONE_WORKSPACE_TAB_LABEL}
      {...(isolationColumnEditInsetRing ? { 'data-isolation-column-focused': '' as const } : {})}
    >
      <div
        className={styles.assetIsolationWorkspace}
        onPointerDown={() => {
          onIsoDocumentHostFocus?.()
          onEditDocumentFocusChange(
            editDocumentFocus === 'hoverScript' ? 'hoverScript' : 'isolation',
          )
        }}
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

          if (activeIsoStripAssetId != null) {
            const asset = assetById(activeIsoStripAssetId)
            if (asset != null) {
              return (
                <AssetDocumentPanel
                  asset={asset}
                  pathTooltip={`${gameDisplayName}/${asset.name}`}
                  hideTabStrip
                  documentFocused
                  showFocusRing={
                    documentHostFocus === 'iso' &&
                    (editDocumentFocus === 'isolation' || editDocumentFocus === 'hoverScript')
                  }
                />
              )
            }
          }
          if (isoColumnScriptTab != null) {
            return renderDocumentScriptBody(isoColumnScriptTab)
          }
          if (hoverScriptDocumentInIso) {
            return <ScriptEditor source={HOVER_SCRIPT_SOURCE} />
          }
          return (
            <div className={styles.assetIsolationImageLayer}>
              <img
                src={
                  droneIsolationPreviewInIso
                    ? ASSET_ISOLATION_IMAGE_FOCUSED
                    : ASSET_ISOLATION_IMAGE
                }
                alt=""
              />
            </div>
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
            title={lobbyPlaceName}
            position={floatingDocumentPosition}
            onPositionChange={onFloatingDocumentPositionChange}
            onClose={onDockDocument}
            titleAlign={panelChromeTitleAlign}
          >
            <div
              ref={floatingDocumentStackRef}
              {...tabStrokeConnectedAttrs}
              className={styles.floatingDocumentStack}
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
            </div>
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
    if (activeMainStripAssetId != null) {
      const asset = assetById(activeMainStripAssetId)
      if (asset != null) {
        return (
          <AssetDocumentPanel
            asset={asset}
            pathTooltip={`${gameDisplayName}/${asset.name}`}
            hideTabStrip
            documentFocused
            showFocusRing={editDocumentFocus === 'main'}
          />
        )
      }
    }
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
      return <ScriptEditor source={HOVER_SCRIPT_SOURCE} />
    }
    if (mainViewportScriptTab != null) {
      return renderDocumentScriptBody(mainViewportScriptTab)
    }
    if (mainStripPlaceEditViewportActive) {
      return droneViewportImage
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
    if (isSimPlaceServerTab(simFocusedStripTab)) {
      return renderPlaceServerTestViewport(
        placeIdFromPlaceServerTab(simFocusedStripTab),
        simDocumentChromeActive,
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
            <div
              ref={documentPanelRef}
              className={styles.documentPanel}
              data-node-id="3841:115139"
              {...tabStrokeConnectedAttrs}
            >
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
              {showSimServerColumn ? (
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
              {showSimServerColumn ? (
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
                    {renderSimServerColumnViewport(simDocumentChromeActive)}
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
          <div
            ref={documentPanelRef}
            className={styles.documentPanel}
            data-node-id="3841:115139"
            {...tabStrokeConnectedAttrs}
          >
          <div
            className={[
              styles.editCombinedTabStrip,
              showDroneOnlyDocumentLayout ? styles.experienceAssetOnlyLayout : null,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {!showDroneOnlyDocumentLayout ? (
              <div
                className={styles.editTabStripMain}
                onPointerDown={() => onEditDocumentFocusChange('main')}
              >
                {simClientServerTabRow}
              </div>
            ) : null}
            {showIsolationDocked ? (
              <div className={styles.editTabStripIso}>{assetIsolationTabRow}</div>
            ) : null}
          </div>
          <div
            className={[
              styles.editWorkspaceSplit,
              showDroneOnlyDocumentLayout ? styles.experienceAssetOnlyLayout : null,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {!showDroneOnlyDocumentLayout ? (
              <div className={styles.testSimClientServerHost}>
                <div className={styles.simTabbedBody}>{simTabbedBodyViewport}</div>
              </div>
            ) : null}
            {showIsolationDocked ? assetIsolationColumnAside : null}
          </div>
        </div>
          {floatingDocumentPortal}
        </>
      )
    }

    if (playModeSplitView) {
      return (
        <>
          <div
            ref={documentPanelRef}
            className={styles.documentPanel}
            data-node-id="3841:115139"
            {...tabStrokeConnectedAttrs}
          >
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
            {showSimServerColumn ? (
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
                  {renderSimServerColumnViewport(simDocumentChromeActive)}
                </div>
              </section>
            ) : null}
          </div>
        </div>
        </>
      )
    }
    return (
      <>
        <div
          ref={documentPanelRef}
          className={styles.documentPanel}
          data-node-id="3841:115139"
          {...tabStrokeConnectedAttrs}
        >
          {simTabbedClientServerStack}
        </div>
      </>
    )
  }

  const mainDocumentTabRow = (
    <div
      ref={combinedStripMode ? combinedTabDrag.mainRowRef : editScriptTabDrag.rowRef}
      className={styles.tabRow}
      data-node-id="3841:115140"
    >
      <TabWithPathTooltip
        path={
          bunnyAssetWindow
            ? TAB_PATH_BUNNY_DOCUMENT
            : placeRootPathTooltip(mainStripPlaceResolved)
        }
        role="tab"
        tabIndex={0}
        aria-selected={
          mainDocumentEditorTab === 'droneRacer' &&
          lobbyPlaceDocumentFocused &&
          activeMainStripAssetId == null
        }
        className={buildTabClass(
          mainDocumentEditorTab === 'droneRacer' &&
            lobbyPlaceDocumentFocused &&
            activeMainStripAssetId == null,
          mainDocumentEditorTab === 'droneRacer' &&
            lobbyPlaceDocumentFocused &&
            activeMainStripAssetId == null
            ? droneRacerDocumentTabDatamodel(simFocus, !!clientSim)
            : null,
          '',
          mainDocumentEditorTab === 'droneRacer' &&
            lobbyPlaceDocumentFocused &&
            activeMainStripAssetId == null &&
            mainStripTabStrokeActive,
        )}
        onPointerDown={(e) => {
          e.stopPropagation()
          selectMainPlaceTab()
        }}
        onClick={(e) => {
          e.stopPropagation()
          selectMainPlaceTab()
        }}
      >
        {bunnyAssetWindow ? <TabDiamond /> : <TabDroneRacerWorkspaceIcon />}
        <span>{mainRootTabLabel}</span>
        <button type="button" className={styles.tabClose} aria-label="Close tab">
          <TabCloseIcon />
        </button>
      </TabWithPathTooltip>
      {phase2 && !clientSim
        ? orderedMainStripPlaceTabs.map((place) => {
            const placeTabSelected =
              activeMainStripAssetId == null &&
              mainDocumentEditorTab === 'droneRacer' &&
              activeEditPlaceId === place.id
            return (
              <DocumentPlaceTab
                key={place.id}
                label={place.displayName}
                path={placeRootPathTooltip(place)}
                tabClassName={buildPlaceTabClassName({
                  active: placeTabSelected,
                  tabStroke: mainStripTabStrokeActive && placeTabSelected,
                  tabStrokeOn: editMainStripPlaceTabStrokeOn,
                  tabStrokeAllEdges: tabStrokeAllEdgesOn,
                  tabStrokeConnected: tabStrokeConnectedOn,
                  strokeOn:
                    editMainStripPlaceTabStrokeOn &&
                    placeTabSelected &&
                    editMainStripPlaceSemanticStrokeOn,
                  datamodel: 'drone',
                  editMode: true,
                })}
                leadingIcon="place"
                selected={placeTabSelected}
                onActivate={() => {
                  onActivateMainStripPlaceTab?.(place.id)
                }}
                onClose={() => onCloseMainStripPlaceTab?.(place.id)}
              />
            )
          })
        : null}
      {phase2 && !clientSim
        ? orderedMainStripAssetTabs.map((asset) => {
            const assetTabSelected = activeMainStripAssetId === asset.id
            return (
              <TabWithPathTooltip
                key={asset.id}
                path={`${gameDisplayName}/${asset.name}`}
                role="tab"
                tabIndex={0}
                aria-selected={assetTabSelected}
                className={buildPlaceTabClassName({
                  active: assetTabSelected,
                  tabStroke: mainStripTabStrokeActive && assetTabSelected,
                  tabStrokeOn: editMainStripPlaceTabStrokeOn,
                  tabStrokeAllEdges: tabStrokeAllEdgesOn,
                  tabStrokeConnected: tabStrokeConnectedOn,
                  strokeOn: false,
                  datamodel: 'drone',
                  editMode: true,
                })}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  onMainDocumentHostFocus?.()
                  onActivateMainStripAssetTab?.(asset.id)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onMainDocumentHostFocus?.()
                  onActivateMainStripAssetTab?.(asset.id)
                }}
              >
                {asset.thumb === 'audio' ? (
                  <Music size={12} strokeWidth={1.5} className={`${styles.tabDiamond} ${styles.tabNeutralIcon}`} aria-hidden />
                ) : (
                  <TabDiamond />
                )}
                <span>{asset.name}</span>
                <TabCloseButton onClose={() => onCloseMainStripAssetTab?.(asset.id)} />
              </TabWithPathTooltip>
            )
          })
        : null}
      {combinedStripMode
        ? combinedMainZoneTabKeys.map((key, tabIndex) =>
            renderCombinedZoneTab(key, tabIndex, 'main'),
          )
        : optionalScriptTabs}
      <div className={styles.tabRowUnderline} aria-hidden />
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
        ref={documentPanelRef}
        className={styles.documentPanel}
        data-node-id="3841:115139"
        onPointerDownCapture={() => onMainDocumentHostFocus?.()}
        {...documentPanelBunnyFocusProps}
        {...tabStrokeConnectedAttrs}
      >
        {showIsolationDocked && !clientSim ? (
          <div
            className={[
              styles.editCombinedTabStrip,
              showDroneOnlyDocumentLayout ? styles.experienceAssetOnlyLayout : null,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {!showDroneOnlyDocumentLayout ? (
              <div
                className={styles.editTabStripMain}
                onPointerDown={(e) => {
                  onEditDocumentFocusChange('main')
                  if ((e.target as HTMLElement).closest('[role="tab"]')) return
                  onFocusLobbyPlace?.()
                }}
              >
                {mainDocumentTabRow}
              </div>
            ) : null}
            <div className={styles.editTabStripIso}>{assetIsolationTabRow}</div>
          </div>
        ) : (
          mainDocumentTabRow
        )}
        {showIsolationDocked && !clientSim ? (
          <div
            className={[
              styles.editWorkspaceSplit,
              showDroneOnlyDocumentLayout ? styles.experienceAssetOnlyLayout : null,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {!showDroneOnlyDocumentLayout
              ? (() => {
                  const mainColumnOverride = renderMainColumnBody()
                  if (mainColumnOverride != null) {
                    return (
                      <div
                        className={styles.viewport}
                        onPointerDown={() => {
                          const focus = hoverScriptInMainViewport
                            ? 'hoverScript'
                            : droneIsolationInMainViewport
                              ? 'isolation'
                              : 'main'
                          if (focus === 'main') {
                            if (mainStripPlaceDocumentFocused) {
                              onFocusPlaceDocument?.(activeEditPlaceId)
                            } else {
                              onFocusLobbyPlace?.()
                            }
                          }
                          onEditDocumentFocusChange(focus)
                        }}
                      >
                        {mainColumnOverride}
                        {mainEditInsetRing ? (
                          <div className={styles.editWorkspaceInsetRing} aria-hidden />
                        ) : null}
                      </div>
                    )
                  }
                  return renderMainViewport(false, mainViewportScriptTab)
                })()
              : null}
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
export type StudioWindowsOSProps = {
  /** Spawns another full Studio frame stacked above (wired from `App`). */
  onOpenAssetWindow?: () => void
  /** `bunny`: asset window — title, viewport art, no isolation column or Script tabs. */
  frameVariant?: StudioFrameVariant
  /** Bunny stacked frame: title-bar close removes this window (main studio omits this). */
  onCloseFrame?: () => void
  /** Drag handler for moving the outer Desktop window by title bar chrome. */
  onWindowChromePointerDown?: (e: PointerEvent<HTMLElement>) => void
  /** Outer desktop window offset from center anchor (used to keep floating windows screen-anchored). */
  windowDragOffset?: { x: number; y: number }
  /** Interaction baseline selected on the desktop phase entry screen. */
  studioPhase?: StudioPhase
}

export default function StudioWindowsOS({
  onOpenAssetWindow,
  frameVariant = 'studio',
  onCloseFrame,
  onWindowChromePointerDown,
  windowDragOffset = { x: 0, y: 0 },
  studioPhase = 2,
}: StudioWindowsOSProps) {
  const bunnyAssetWindow = frameVariant === 'bunny'
  const phase2 = isPhase2(studioPhase)
  const phaseDefaults = prototypeDefaultsForPhase(studioPhase)
  const { game, defaultPlace } = useMemo(
    () => resolveWorkspace(frameVariant),
    [frameVariant],
  )
  const mainStripPlace = useMemo(
    () => game.places.find((p) => !p.dockOnly) ?? defaultPlace,
    [game.places, defaultPlace],
  )
  const [clientSimActive, setClientSimActive] = useState(false)
  /** Server places joined via triple-click Client (each gets a main-strip Server tab). */
  const [joinedPlaceIds, setJoinedPlaceIds] = useState<string[]>([])
  /** Client viewport art: Lobby until first join, then latest joined place. */
  const [clientViewPlaceId, setClientViewPlaceId] = useState<string>('drone-racer')
  const [clientJoiningPlace, setClientJoiningPlace] = useState(false)
  const [joiningPlaceId, setJoiningPlaceId] = useState<string | null>(null)
  const clientJoinPlaceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const serverPlaces = useMemo(() => serverPlacesForGame(game), [game])
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
  const [playModeTabStrokeAllEdges, setPlayModeTabStrokeAllEdges] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.playModeTabStrokeAllEdges,
  )
  const [playModeTabStrokeConnected, setPlayModeTabStrokeConnected] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.playModeTabStrokeConnected,
  )
  const [playModeTabTint, setPlayModeTabTint] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.playModeTabTint,
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
  /** Which place document has edit focus — Lobby (center) vs Level 1 (bottom dock). */
  const [activeEditPlaceId, setActiveEditPlaceId] = useState<ActiveEditPlaceId>('drone-racer')

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
  const [experienceAssetOnlyMode, setExperienceAssetOnlyMode] = useState(false)
  /** Play entered from Experience asset view — restore that layout on Stop. */
  const restoreExperienceAssetViewOnStopRef = useRef(false)
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
      (clientScriptDocument.tabPath === 'Drone Racer (Client)/Script' ||
        clientScriptDocument.tabPath === 'Lobby (Client)/Script')
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

  /** Test: dock-only place server doc — main strip Client/Server use `simViewportFocus`. */
  const placeDocumentSimFocus = useMemo((): SimViewportFocus | null => {
    if (!clientSimActive) return null
    if (activeEditPlaceId !== game.defaultPlaceId) return 'server'
    return null
  }, [clientSimActive, activeEditPlaceId, game.defaultPlaceId])

  const explorerSimFocusForTree: SimViewportFocus = useMemo(() => {
    if (explorerChromeDocumentTab === 'clientScript') return 'client'
    if (explorerChromeDocumentTab === 'serverScript') return 'server'
    if (placeDocumentSimFocus != null) return placeDocumentSimFocus
    return simViewportFocus
  }, [explorerChromeDocumentTab, placeDocumentSimFocus, simViewportFocus])

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
      (!explorerChromeScriptOpen &&
        (explorerChromeDocumentTab === 'droneRacer' ||
          activeEditPlaceId !== game.defaultPlaceId)))

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

  const activePlaceDisplayName = useMemo(() => {
    if (bunnyAssetWindow) return 'Bunny'
    const place = placeById(game, activeEditPlaceId)
    return place?.displayName ?? mainStripPlace.displayName
  }, [bunnyAssetWindow, activeEditPlaceId, game, mainStripPlace.displayName])

  const joiningPlaceDisplayName = useMemo(() => {
    if (!joiningPlaceId) return null
    return placeById(game, joiningPlaceId)?.displayName ?? null
  }, [game, joiningPlaceId])

  const canJoinAnotherPlace =
    phase2 &&
    canAdvanceClientToNextPlace(serverPlaces, clientViewPlaceId, game.defaultPlaceId)

  const explorerOriginalDmBadgeLabel =
    explorerOriginalDmBadge && explorerShowsOriginalDmTree
      ? activePlaceDisplayName
      : null

  const explorerHeaderSimFocus: SimViewportFocus =
    explorerWhileScriptFocus === 'sim-server'
      ? 'server'
      : explorerWhileScriptFocus === 'sim-client'
        ? 'client'
        : (placeDocumentSimFocus ?? simViewportFocus)

  const explorerBreadcrumbSegment = useMemo(() => {
    if (bunnyAssetWindow) return 'Bunny'

    const placeName = activePlaceDisplayName

    if (showAssetInIsolation && editWorkspaceDocumentFocus !== 'main') {
      return DRONE_WORKSPACE_TAB_LABEL
    }

    if (clientSimActive) {
      if (explorerChromeDocumentTab === 'clientScript') return `${placeName} / Client`
      if (explorerChromeDocumentTab === 'serverScript') return `${placeName} / Server`
      if (isDroneRacerMainScriptTab(explorerChromeDocumentTab)) return placeName
      if (
        simMultiClientMode &&
        explorerHeaderSimFocus === 'client' &&
        simActiveClientInstanceIndex != null
      ) {
        return `${placeName} / ${simClientInstanceLabel(simActiveClientInstanceIndex)}`
      }
      return explorerHeaderSimFocus === 'server'
        ? `${placeName} / Server`
        : `${placeName} / Client`
    }

    return placeName
  }, [
    bunnyAssetWindow,
    activePlaceDisplayName,
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
  const [openAssetAsDockedDocument, setOpenAssetAsDockedDocument] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.openAssetAsDockedDocument,
  )
  const [linkSemanticColors, setLinkSemanticColors] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.linkSemanticColors,
  )
  const [linkSemanticHueOnly, setLinkSemanticHueOnly] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.linkSemanticHueOnly,
  )
  const [linkIconAccents, setLinkIconAccents] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.linkIconAccents,
  )
  const [panelTogglesUseFills, setPanelTogglesUseFills] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.panelTogglesUseFills,
  )
  const [ribbonIconSize, setRibbonIconSize] = useState(
    PROTOTYPE_SETTINGS_DEFAULTS.ribbonIconSize,
  )
  const [studioColorTheme, setStudioColorTheme] = useState<'dark' | 'light'>(
    PROTOTYPE_SETTINGS_DEFAULTS.studioColorTheme,
  )
  const [uiScale, setUiScale] = useState(
    PROTOTYPE_SETTINGS_DEFAULTS.uiScale,
  )
  const [toolSelectionColor, setToolSelectionColor] = useState<ToolSelectionColor>(
    PROTOTYPE_SETTINGS_DEFAULTS.toolSelectionColor,
  )
  const [toolSelectionIncludeNeutrals, setToolSelectionIncludeNeutrals] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.toolSelectionIncludeNeutrals,
  )
  const [openAssetDockAssetIds, setOpenAssetDockAssetIds] = useState<string[]>([])
  const [openMainStripAssetIds, setOpenMainStripAssetIds] = useState<string[]>([])
  const [openIsoStripAssetIds, setOpenIsoStripAssetIds] = useState<string[]>([])
  const [activeDockAssetId, setActiveDockAssetId] = useState<string | null>(null)
  const [activeMainStripAssetId, setActiveMainStripAssetId] = useState<string | null>(null)
  const [activeIsoStripAssetId, setActiveIsoStripAssetId] = useState<string | null>(null)
  const [focusedDocumentHost, setFocusedDocumentHost] = useState<'main' | 'bottom' | 'iso'>('main')
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
  const [explorerPanelOpen, setExplorerPanelOpen] = useState(true)
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true)
  const [prototypeSettingsPanelOpen, setPrototypeSettingsPanelOpen] = useState(false)
  const [studioSettingsOpen, setStudioSettingsOpen] = useState(() =>
    isColorPlayground(studioPhase),
  )
  const [studioSettingsPosition, setStudioSettingsPosition] =
    useState<FloatingDocumentPosition | null>(null)
  const [studioSettingsSize, setStudioSettingsSize] =
    useState<FloatingWindowSize>(STUDIO_SETTINGS_DEFAULT_SIZE)
  const [studioThemePreset, setStudioThemePreset] =
    useState<StudioThemePresetId>('contrast-dark')
  const [documentUndocked, setDocumentUndocked] = useState<boolean>(
    PROTOTYPE_SETTINGS_DEFAULTS.floatingDocumentOpen,
  )
  const [floatingDocumentPosition, setFloatingDocumentPosition] =
    useState<FloatingDocumentPosition | null>(() => createFloatingDocumentWindow().position)
  const [floatingPlaceWindows, setFloatingPlaceWindows] = useState<
    FloatingPlaceDocumentWindowState[]
  >([])
  const [floatingAssetWindows, setFloatingAssetWindows] = useState<
    FloatingAssetDocumentWindowState[]
  >([])
  const [focusedFloatingAssetId, setFocusedFloatingAssetId] = useState<string | null>(null)
  const [editExplorerSelectedRowId, setEditExplorerSelectedRowId] = useState<string | null>(
    null,
  )
  const persistedExplorerSelectionRef = useRef<PersistedExplorerSelection>(
    createEmptyPersistedExplorerSelection(),
  )
  const [explorerSelectionSeedEpoch, setExplorerSelectionSeedEpoch] = useState(0)

  const level1ExplorerTree = useMemo(
    () => generateLevel1ExplorerTree(),
    [explorerSelectionSeedEpoch],
  )
  const placeExplorerTreesByPlaceId = useMemo(
    () =>
      Object.fromEntries(
        serverPlaces.map((place) => [
          place.id,
          {
            edit: generateLevel1ExplorerTree(),
            client: generateLevel1ExplorerTree(),
            server: generateLevel1ExplorerTree(),
          },
        ]),
      ) as Record<
        string,
        {
          edit: Level1ExplorerTreeData
          client: Level1ExplorerTreeData
          server: Level1ExplorerTreeData
        }
      >,
    [serverPlaces, explorerSelectionSeedEpoch],
  )

  const focusPlaceDocument = useCallback((placeId: string) => {
    setActiveEditPlaceId(placeId)
    setEditWorkspaceDocumentFocus('main')
    setActiveDockAssetId(null)
    setActiveMainStripAssetId(null)
    setActiveIsoStripAssetId(null)
  }, [])

  const focusMainStripAssetDocument = useCallback((assetId: string) => {
    setActiveMainStripAssetId(assetId)
    setActiveDockAssetId(null)
    setActiveIsoStripAssetId(null)
    setMainDocumentEditorTab('droneRacer')
    setEditWorkspaceDocumentFocus('main')
    setFocusedDocumentHost('main')
    setFocusedFloatingAssetId(null)
  }, [])

  const focusDockAssetDocument = useCallback((assetId: string) => {
    setActiveDockAssetId(assetId)
    setActiveMainStripAssetId(null)
    setActiveIsoStripAssetId(null)
    setEditWorkspaceDocumentFocus('main')
    setFocusedDocumentHost('bottom')
    setFocusedFloatingAssetId(null)
  }, [])

  const focusIsoStripAssetDocument = useCallback((assetId: string) => {
    setActiveIsoStripAssetId(assetId)
    setActiveMainStripAssetId(null)
    setActiveDockAssetId(null)
    setEditWorkspaceDocumentFocus('isolation')
    setFocusedDocumentHost('iso')
    setFocusedFloatingAssetId(null)
  }, [])

  const closeFloatingPlaceWindow = useCallback(
    (placeId: string) => {
      setFloatingPlaceWindows((windows) => windows.filter((window) => window.placeId !== placeId))
      if (activeEditPlaceId === placeId) {
        setActiveEditPlaceId(game.defaultPlaceId)
        setEditWorkspaceDocumentFocus('main')
      }
    },
    [activeEditPlaceId, game.defaultPlaceId],
  )

  const activateMainStripPlaceTab = useCallback((placeId: string) => {
    setActiveEditPlaceId(placeId)
    setMainDocumentEditorTab('droneRacer')
    setEditWorkspaceDocumentFocus('main')
    setActiveMainStripAssetId(null)
    setActiveIsoStripAssetId(null)
    setFocusedDocumentHost('main')
  }, [])

  const closeMainStripPlaceTab = useCallback(
    (placeId: string) => {
      setOpenMainStripPlaceIds((ids) => ids.filter((id) => id !== placeId))
      if (activeEditPlaceId === placeId) {
        setActiveEditPlaceId(game.defaultPlaceId)
      }
    },
    [activeEditPlaceId, game.defaultPlaceId],
  )

  const focusLobbyPlace = useCallback(() => {
    setActiveEditPlaceId('drone-racer')
    setEditWorkspaceDocumentFocus('main')
    setActiveMainStripAssetId(null)
    setActiveIsoStripAssetId(null)
    setFocusedDocumentHost('main')
    if (clientSimActive) {
      setSimViewportFocus('client')
      setSimFocusedStripTab(
        simMultiClientMode ? simClientInstanceId(1) : 'client',
      )
    }
  }, [clientSimActive, simMultiClientMode])

  const experienceAssetOnly = useCallback(() => {
    setShowAssetInIsolation(true)
    setExperienceAssetOnlyMode(true)
    setIsolationTabOpen(true)
    setHoverScriptTabOpen(false)
    setEditWorkspaceDocumentFocus('isolation')
    setDocumentUndocked(false)
    setOpenPlaceDockPlaceIds([])
    setOpenMainStripPlaceIds([])
    setActiveEditPlaceId(game.defaultPlaceId)
    setMainDocumentEditorTab('droneRacer')
    setScriptATabOpen(false)
    setScriptBTabOpen(false)
    setClientScriptTabOpen(false)
    setServerScriptTabOpen(false)
    setCombinedMainZoneKeys(null)
    setCombinedIsoZoneKeys([isoPersistentKey('isolation')])
  }, [game.defaultPlaceId])

  const resetClientJoins = useCallback(() => {
    if (clientJoinPlaceTimeoutRef.current != null) {
      clearTimeout(clientJoinPlaceTimeoutRef.current)
      clientJoinPlaceTimeoutRef.current = null
    }
    setClientJoiningPlace(false)
    setJoiningPlaceId(null)
    setJoinedPlaceIds([])
    setClientViewPlaceId(game.defaultPlaceId)
    setSimDocumentTabOrder((order) => order.filter((t) => !isSimPlaceServerTab(t)))
    setCombinedMainZoneKeys((keys) =>
      keys?.filter((k) => !k.startsWith('dm:place-server:')) ?? keys,
    )
    if (isSimPlaceServerTab(simFocusedStripTab)) {
      setSimFocusedStripTab('client')
      setSimViewportFocus('client')
    }
  }, [game.defaultPlaceId, simFocusedStripTab])

  const closePlaceServerTab = useCallback(
    (placeId: string) => {
      const tab = simPlaceServerTabId(placeId)
      setSimDocumentTabOrder((order) => order.filter((t) => t !== tab))
      setCombinedMainZoneKeys((keys) =>
        keys?.filter((k) => k !== `dm:place-server:${placeId}`) ?? keys,
      )
      setJoinedPlaceIds((ids) => ids.filter((id) => id !== placeId))
      setOpenMainStripPlaceIds((ids) => ids.filter((id) => id !== placeId))
      if (
        isSimPlaceServerTab(simFocusedStripTab) &&
        placeIdFromPlaceServerTab(simFocusedStripTab) === placeId
      ) {
        setSimFocusedStripTab('client')
        setSimViewportFocus('client')
      }
      if (clientViewPlaceId === placeId) {
        const remaining = joinedPlaceIds.filter((id) => id !== placeId)
        setClientViewPlaceId(
          remaining.length > 0
            ? remaining[remaining.length - 1]!
            : game.defaultPlaceId,
        )
      }
      if (activeEditPlaceId === placeId) {
        setActiveEditPlaceId(game.defaultPlaceId)
      }
    },
    [
      activeEditPlaceId,
      clientViewPlaceId,
      game.defaultPlaceId,
      joinedPlaceIds,
      simFocusedStripTab,
    ],
  )

  const handleClientSimJoinNextPlace = useCallback(() => {
    if (!clientSimActive || clientJoiningPlace || !canJoinAnotherPlace) return
    const nextPlace = nextServerPlaceAfterClientView(
      serverPlaces,
      clientViewPlaceId,
      game.defaultPlaceId,
    )
    if (!nextPlace) return
    const isNewJoin = !joinedPlaceIds.includes(nextPlace.id)
    setClientJoiningPlace(true)
    setJoiningPlaceId(nextPlace.id)
    clientJoinPlaceTimeoutRef.current = setTimeout(() => {
      setClientJoiningPlace(false)
      setJoiningPlaceId(null)
      if (isNewJoin) {
        setJoinedPlaceIds((ids) => [...ids, nextPlace.id])
      }
      setClientViewPlaceId(nextPlace.id)
      if (isNewJoin && !placeServerUsesMainStripTab(nextPlace.id)) {
        setOpenPlaceDockPlaceIds((ids) => mergeOpenPlaceDockPlaceIds([...ids, nextPlace.id]))
      }
      if (isNewJoin && placeServerUsesMainStripTab(nextPlace.id)) {
        setSimDocumentTabOrder((order) =>
          insertPlaceServerTabAfterClient(order, nextPlace.id),
        )
        if (showAssetInIsolation && !playModeSplitView) {
          setCombinedMainZoneKeys((keys) =>
            insertPlaceServerPersistentKeyAfterClient(keys ?? [], nextPlace.id),
          )
        }
      }
      // Open the place Server tab but keep Client focused (Lobby strip stays active).
      setSimViewportFocus('client')
      setSimFocusedStripTab(
        simMultiClientMode ? simClientInstanceId(1) : 'client',
      )
      clientJoinPlaceTimeoutRef.current = null
    }, 1400)
  }, [
    canJoinAnotherPlace,
    clientJoiningPlace,
    clientSimActive,
    clientViewPlaceId,
    game.defaultPlaceId,
    joinedPlaceIds,
    serverPlaces,
    simMultiClientMode,
    showAssetInIsolation,
    playModeSplitView,
  ])

  useEffect(
    () => () => {
      if (clientJoinPlaceTimeoutRef.current != null) {
        clearTimeout(clientJoinPlaceTimeoutRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (!clientSimActive) resetClientJoins()
  }, [clientSimActive, resetClientJoins])

  const handleMainDocumentEditorTabChange = useCallback(
    (tab: MainDocumentEditorTab) => {
      setMainDocumentEditorTab(tab)
      setActiveMainStripAssetId(null)
      setActiveIsoStripAssetId(null)
      setFocusedDocumentHost('main')
      if (tab === 'scriptA' || tab === 'scriptB') {
        focusLobbyPlace()
      }
    },
    [focusLobbyPlace],
  )

  const handleEditWorkspaceDocumentFocusChange = useCallback((focus: EditDocumentFocus) => {
    setEditWorkspaceDocumentFocus(focus)
    if (focus === 'isolation' || focus === 'hoverScript') {
      setFocusedDocumentHost('iso')
    } else if (focus === 'main') {
      setFocusedDocumentHost('main')
    }
  }, [])

  const clearIsoStripAssetSelection = useCallback(() => {
    setActiveIsoStripAssetId(null)
  }, [])

  const handleMainDocumentHostFocus = useCallback(() => {
    setFocusedDocumentHost('main')
  }, [])

  const handleIsoDocumentHostFocus = useCallback(() => {
    setFocusedDocumentHost('iso')
  }, [])

  const handleBottomDocumentHostFocus = useCallback(() => {
    setFocusedDocumentHost('bottom')
  }, [])

  const explorerTreeKind = useMemo((): ExplorerTreeKind => {
    if (bunnyAssetWindow) return 'bunny'
    if (explorerShowsDroneIsolationTree) return 'droneIsolation'
    if (
      clientSimActive &&
      (explorerWhileScriptFocus === 'sim-client' ||
        explorerWhileScriptFocus === 'sim-server' ||
        activeEditPlaceId === game.defaultPlaceId)
    ) {
      return 'flatSim'
    }
    if (isLobbyMainDocumentTab(mainDocumentEditorTab)) {
      if (activeEditPlaceId === game.defaultPlaceId) return 'droneRacerHierarchy'
      if (placeServerUsesMainStripTab(activeEditPlaceId)) return 'level1Hierarchy'
      return 'droneRacerHierarchy'
    }
    if (activeEditPlaceId !== game.defaultPlaceId) return 'level1Hierarchy'
    return 'droneRacerHierarchy'
  }, [
    bunnyAssetWindow,
    explorerShowsDroneIsolationTree,
    clientSimActive,
    explorerWhileScriptFocus,
    activeEditPlaceId,
    mainDocumentEditorTab,
    game.defaultPlaceId,
    serverPlaces,
  ])
  const levelHierarchyPlaceId = useMemo(() => {
    if (activeEditPlaceId !== game.defaultPlaceId) return activeEditPlaceId
    if (clientViewPlaceId !== game.defaultPlaceId) return clientViewPlaceId
    return serverPlaces[0]?.id ?? 'level-1'
  }, [activeEditPlaceId, clientViewPlaceId, game.defaultPlaceId, serverPlaces])
  const levelHierarchyTreeRole: 'edit' | 'client' | 'server' = !clientSimActive
    ? 'edit'
    : simViewportFocus === 'server'
      ? 'server'
      : 'client'
  const currentLevelExplorerTree =
    placeExplorerTreesByPlaceId[levelHierarchyPlaceId]?.[levelHierarchyTreeRole] ??
    level1ExplorerTree

  const applyExplorerSelectionForTreeKind = useCallback(
    (kind: ExplorerTreeKind) => {
      const p = persistedExplorerSelectionRef.current

      switch (kind) {
        case 'bunny': {
          if (p.bunny == null) p.bunny = 'bunnyExplorerRow'
          setEditExplorerSelectedRowId(p.bunny)
          return
        }
        case 'droneIsolation': {
          if (p.droneIsolation == null) {
            p.droneIsolation = pickRandomExplorerRow(DRONE_ISOLATION_EXPLORER_ROWS)
          }
          setEditExplorerSelectedRowId(p.droneIsolation)
          return
        }
        case 'flatSim': {
          if (p.flatSimServer == null || p.flatSimClient == null) {
            const [clientRow, serverRow] = pickDistinctRandomExplorerRows(FLAT_SIM_EXPLORER_ROWS)
            if (p.flatSimClient == null) p.flatSimClient = clientRow
            if (p.flatSimServer == null) p.flatSimServer = serverRow
          }
          setSimExplorerSelectedRowServer(p.flatSimServer)

          if (simMultiClientMode) {
            for (let i = 1; i <= simClientInstanceCount; i++) {
              if (p.flatSimByClient[i] == null) {
                const rows = explorerTreeForClientInstance(i).map((r) => r.id)
                p.flatSimByClient[i] = pickRandomExplorerRow(rows)
              }
            }
            setSimExplorerSelectionByClient({ ...p.flatSimByClient })
            const activeIndex = clientInstanceIndexFromStripTab(simFocusedStripTab) ?? 1
            setSimExplorerSelectedRowClient(
              p.flatSimByClient[activeIndex] ?? p.flatSimClient,
            )
          } else {
            setSimExplorerSelectedRowClient(p.flatSimClient)
            setSimExplorerSelectionByClient({})
          }
          return
        }
        case 'level1Hierarchy': {
          if (!clientSimActive) {
            if (p.levelEditByPlace[levelHierarchyPlaceId] == null) {
              p.levelEditByPlace[levelHierarchyPlaceId] = pickRandomExplorerRow(
                currentLevelExplorerTree.rows,
              )
            }
            setEditExplorerSelectedRowId(
              p.levelEditByPlace[levelHierarchyPlaceId] ?? null,
            )
            return
          }
          const simMap =
            simViewportFocus === 'server'
              ? p.simHierarchyServerByPlace
              : p.simHierarchyClientByPlace
          if (simMap[levelHierarchyPlaceId] == null) {
            simMap[levelHierarchyPlaceId] = pickRandomExplorerRow(currentLevelExplorerTree.rows)
          }
          if (simViewportFocus === 'server') {
            setSimExplorerSelectedRowServer(simMap[levelHierarchyPlaceId] ?? null)
          } else {
            setSimExplorerSelectedRowClient(simMap[levelHierarchyPlaceId] ?? null)
          }
          return
        }
        case 'droneRacerHierarchy': {
          if (p.droneRacerEdit == null) {
            p.droneRacerEdit = pickRandomExplorerRow(DRONE_RACER_EXPLORER_ROWS)
          }
          setEditExplorerSelectedRowId(p.droneRacerEdit)

          if (clientSimActive) {
            if (p.simHierarchyClientByPlace[game.defaultPlaceId] == null) {
              p.simHierarchyClientByPlace[game.defaultPlaceId] = p.droneRacerEdit
            }
            if (p.simHierarchyServerByPlace[game.defaultPlaceId] == null) {
              const [, serverRow] = pickDistinctRandomExplorerRows(DRONE_RACER_EXPLORER_ROWS)
              p.simHierarchyServerByPlace[game.defaultPlaceId] = serverRow
            }
            setSimExplorerSelectedRowClient(
              p.simHierarchyClientByPlace[game.defaultPlaceId] ?? null,
            )
            setSimExplorerSelectedRowServer(
              p.simHierarchyServerByPlace[game.defaultPlaceId] ?? null,
            )
          }
        }
      }
    },
    [
      clientSimActive,
      simMultiClientMode,
      simClientInstanceCount,
      simFocusedStripTab,
      simViewportFocus,
      levelHierarchyPlaceId,
      currentLevelExplorerTree,
      game.defaultPlaceId,
    ],
  )

  useEffect(() => {
    applyExplorerSelectionForTreeKind(explorerTreeKind)
  }, [
    explorerTreeKind,
    explorerSelectionSeedEpoch,
    clientSimActive,
    simMultiClientMode,
    simClientInstanceCount,
    applyExplorerSelectionForTreeKind,
  ])

  const [outputPanelOpen, setOutputPanelOpen] = useState(false)
  const [assetManagerPanelOpen, setAssetManagerPanelOpen] = useState(false)
  const [toolboxPanelOpen, setToolboxPanelOpen] = useState(false)
  const [serversPersistIntoEdit, setServersPersistIntoEdit] = useState<boolean>(
    phaseDefaults.serversPersistIntoEdit,
  )
  const [serverTabUsesPlaceName, setServerTabUsesPlaceName] = useState<boolean>(
    phaseDefaults.serverTabUsesPlaceName,
  )
  const [clientTabUsesPlaceName, setClientTabUsesPlaceName] = useState<boolean>(
    phaseDefaults.clientTabUsesPlaceName,
  )
  const [openPlaceDockPlaceIds, setOpenPlaceDockPlaceIds] = useState<string[]>(() =>
    initialOpenPlaceDockPlaceIds(studioPhase),
  )
  const [documentTabStripDrag, setDocumentTabStripDrag] =
    useState<TriZoneTabDragBindings | null>(null)
  const registerDocumentTabStripDrag = useCallback(
    (drag: TriZoneTabDragBindings | null) => {
      setDocumentTabStripDrag(drag)
    },
    [],
  )
  /** Edit: Level 2–4 tabs in the center document strip (from test joins when persist is on). */
  const [openMainStripPlaceIds, setOpenMainStripPlaceIds] = useState<string[]>([])
  const [outputLogEntries, setOutputLogEntries] = useState<OutputLogEntry[]>(INITIAL_OUTPUT_LOG)

  const serverPlaceOrderIds = useMemo(
    () => serverPlaces.map((p) => p.id),
    [serverPlaces],
  )

  const isPlaceDockOpen = useCallback(
    (placeId: string) => openPlaceDockPlaceIds.includes(placeId),
    [openPlaceDockPlaceIds],
  )

  const setPlaceDockOpen = useCallback((placeId: string, open: boolean) => {
    setOpenPlaceDockPlaceIds((ids) => {
      if (open) {
        if (ids.includes(placeId)) return ids
        return [...ids, placeId]
      }
      return ids.filter((id) => id !== placeId)
    })
  }, [])

  const setAssetDockOpen = useCallback((assetId: string, open: boolean) => {
    setOpenAssetDockAssetIds((ids) => {
      if (open) {
        if (ids.includes(assetId)) return ids
        return [...ids, assetId]
      }
      return ids.filter((id) => id !== assetId)
    })
    if (!open) {
      setActiveDockAssetId((activeId) => (activeId === assetId ? null : activeId))
    }
  }, [])

  const closeMainStripAssetTab = useCallback((assetId: string) => {
    setOpenMainStripAssetIds((ids) => ids.filter((id) => id !== assetId))
    setActiveMainStripAssetId((activeId) => (activeId === assetId ? null : activeId))
  }, [])

  const closeIsoStripAssetTab = useCallback((assetId: string) => {
    setOpenIsoStripAssetIds((ids) => ids.filter((id) => id !== assetId))
    setActiveIsoStripAssetId((activeId) => (activeId === assetId ? null : activeId))
  }, [])

  const activateMainStripAssetTab = useCallback(
    (assetId: string) => {
      focusMainStripAssetDocument(assetId)
    },
    [focusMainStripAssetDocument],
  )

  const activateIsoStripAssetTab = useCallback(
    (assetId: string) => {
      focusIsoStripAssetDocument(assetId)
    },
    [focusIsoStripAssetDocument],
  )

  const openOrFocusPlaceFromAssetManager = useCallback(
    (placeId: string) => {
      setFloatingPlaceWindows((windows) => {
        const existing = findFloatingPlaceWindow(windows, placeId)
        if (existing) {
          const maxSlot = windows.reduce((max, window) => Math.max(max, window.defaultSlot), 0)
          return windows.map((window) =>
            window.placeId === placeId ? { ...window, defaultSlot: maxSlot + 1 } : window,
          )
        }
        if (
          placeId !== game.defaultPlaceId &&
          !openMainStripPlaceIds.includes(placeId) &&
          !openPlaceDockPlaceIds.includes(placeId)
        ) {
          return [...windows, createFloatingPlaceWindow(placeId, windows.length)]
        }
        return windows
      })

      if (placeId === game.defaultPlaceId) {
        focusLobbyPlace()
        setMainDocumentEditorTab('droneRacer')
        return
      }
      if (openMainStripPlaceIds.includes(placeId)) {
        activateMainStripPlaceTab(placeId)
        return
      }
      focusPlaceDocument(placeId)
    },
    [
      game.defaultPlaceId,
      openMainStripPlaceIds,
      openPlaceDockPlaceIds,
      focusLobbyPlace,
      activateMainStripPlaceTab,
      focusPlaceDocument,
    ],
  )

  const closeFloatingAssetWindow = useCallback((assetId: string) => {
    setFloatingAssetWindows((windows) => windows.filter((window) => window.assetId !== assetId))
    setFocusedFloatingAssetId((focusedId) => (focusedId === assetId ? null : focusedId))
  }, [])

  const openOrFocusAssetFromAssetManager = useCallback(
    (assetId: string) => {
      if (assetById(assetId) == null) return

      if (openAssetAsDockedDocument) {
        if (openMainStripAssetIds.includes(assetId)) {
          focusMainStripAssetDocument(assetId)
          return
        }
        if (openAssetDockAssetIds.includes(assetId)) {
          setPanelDockLayout((layout) =>
            focusBottomDockAssetTab(layout, assetId),
          )
          focusDockAssetDocument(assetId)
          return
        }
        if (openIsoStripAssetIds.includes(assetId)) {
          focusIsoStripAssetDocument(assetId)
          return
        }

        if (focusedDocumentHost === 'main') {
          setOpenMainStripAssetIds((ids) => (ids.includes(assetId) ? ids : [...ids, assetId]))
          focusMainStripAssetDocument(assetId)
          return
        }

        if (focusedDocumentHost === 'iso') {
          setOpenIsoStripAssetIds((ids) => (ids.includes(assetId) ? ids : [...ids, assetId]))
          focusIsoStripAssetDocument(assetId)
          return
        }

        setOpenAssetDockAssetIds((ids) => (ids.includes(assetId) ? ids : [...ids, assetId]))
        setPanelDockLayout((layout) =>
          focusBottomDockAssetTab(openAssetInFocusedBottomStack(layout, assetId), assetId),
        )
        focusDockAssetDocument(assetId)
        return
      }

      setFloatingAssetWindows((windows) => {
        const existing = findFloatingAssetWindow(windows, assetId)
        if (existing) {
          const maxSlot = windows.reduce((max, window) => Math.max(max, window.defaultSlot), 0)
          return windows.map((window) =>
            window.assetId === assetId ? { ...window, defaultSlot: maxSlot + 1 } : window,
          )
        }
        return [...windows, createFloatingAssetWindow(assetId, windows.length)]
      })
      setFocusedFloatingAssetId(assetId)
    },
    [openAssetAsDockedDocument, focusedDocumentHost, openMainStripAssetIds, openAssetDockAssetIds, openIsoStripAssetIds, focusMainStripAssetDocument, focusDockAssetDocument, focusIsoStripAssetDocument],
  )

  const renderFloatingPlaceDocumentPanel = useCallback(
    (
      placeId: string,
      options: {
        onTabStripPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
        onTabClose?: () => void
      } = {},
    ) => {
      const dockPlace = placeById(game, placeId)
      const dockPlaceName = dockPlace?.displayName ?? placeId
      const dockPlaceFocused = activeEditPlaceId === placeId
      return (
        <PlaceDocumentPanel
          title={dockPlaceName}
          tabLabel={
            clientSimActive
              ? simServerTabLabel(dockPlaceName, serverTabUsesPlaceName)
              : undefined
          }
          pathTooltip={
            dockPlace
              ? clientSimActive
                ? simServerTabPathTooltip(dockPlace)
                : placeRootPathTooltip(dockPlace)
              : dockPlaceName
          }
          fillDock
          tabStroke={playModeTabStroke}
          tabStrokeAllEdges={playModeTabStrokeAllEdges}
          tabStrokeConnected={playModeTabStrokeConnected}
          strokeOn={clientSimActive && playModeHasStroke}
          tabTintOn={clientSimActive && playModeTabTint}
          testServerView={clientSimActive}
          hasJoinedClient={level1ServerShowsJoinedClient(
            placeId,
            clientSimActive,
            clientViewPlaceId,
            joinedPlaceIds,
          )}
          showServerSemanticStroke={
            clientSimActive &&
            dockPlaceFocused &&
            playModeHasStroke &&
            !playModeHasFocusStroke
          }
          documentFocused={dockPlaceFocused}
          showFocusRing={
            clientSimActive
              ? dockPlaceFocused && playModeHasFocusStroke
              : dockPlaceFocused
          }
          onFocusDocument={() => focusPlaceDocument(placeId)}
          onTabClose={options.onTabClose}
          onTabStripPointerDown={options.onTabStripPointerDown}
        />
      )
    },
    [
      game,
      activeEditPlaceId,
      clientSimActive,
      serverTabUsesPlaceName,
      playModeTabStroke,
      playModeTabStrokeAllEdges,
      playModeTabStrokeConnected,
      playModeHasStroke,
      playModeTabTint,
      playModeHasFocusStroke,
      clientViewPlaceId,
      joinedPlaceIds,
      focusPlaceDocument,
    ],
  )

  const renderFloatingAssetDocumentPanel = useCallback(
    (
      assetId: string,
      options: {
        onTabStripPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
        onTabClose?: () => void
      } = {},
    ) => {
      const asset = assetById(assetId)
      if (asset == null) return null
      const assetFocused = focusedFloatingAssetId === assetId
      return (
        <AssetDocumentPanel
          asset={asset}
          pathTooltip={`${game.displayName}/${asset.name}`}
          documentFocused={assetFocused}
          showFocusRing={assetFocused}
          onFocusDocument={() => focusDockAssetDocument(assetId)}
          onTabClose={options.onTabClose}
          onTabStripPointerDown={options.onTabStripPointerDown}
        />
      )
    },
    [game.displayName, focusedFloatingAssetId],
  )

  const [panelDockLayout, setPanelDockLayout] = useState<PanelDockLayoutState>(() =>
    createDefaultPanelDockLayout({
      outputPanelOpen: false,
      openPlaceDockPlaceIds: initialOpenPlaceDockPlaceIds(studioPhase),
      serverPlaceOrder: ['level-1'],
      assetManagerPanelOpen: false,
      hideExplorer: false,
      hideProperties: false,
    }),
  )

  const frameRef = useRef<HTMLDivElement | null>(null)
  const prevWindowDragOffsetRef = useRef(windowDragOffset)

  useLayoutEffect(() => {
    const prev = prevWindowDragOffsetRef.current
    const dx = windowDragOffset.x - prev.x
    const dy = windowDragOffset.y - prev.y
    prevWindowDragOffsetRef.current = windowDragOffset
    if (dx === 0 && dy === 0) return

    const frameEl = frameRef.current
    const frameRect = frameEl?.getBoundingClientRect() ?? null

    setFloatingWindows((windows) =>
      windows.map((w) => {
        if (w.position != null) {
          return {
            ...w,
            position: { left: w.position.left - dx, top: w.position.top - dy },
          }
        }
        if (frameEl == null || frameRect == null) return w
        const host = frameEl.querySelector(
          `[data-floating-window-id="${w.windowId}"]`,
        ) as HTMLElement | null
        if (host == null) return w
        const hostRect = host.getBoundingClientRect()
        return {
          ...w,
          position: {
            left: hostRect.left - frameRect.left - dx,
            top: hostRect.top - frameRect.top - dy,
          },
        }
      }),
    )

    setFloatingDocumentPosition((pos) => {
      if (pos != null) return { left: pos.left - dx, top: pos.top - dy }
      if (!documentUndocked || frameEl == null || frameRect == null) return pos
      const host = frameEl.querySelector('[data-floating-document]') as HTMLElement | null
      if (host == null) return pos
      const hostRect = host.getBoundingClientRect()
      return {
        left: hostRect.left - frameRect.left - dx,
        top: hostRect.top - frameRect.top - dy,
      }
    })

    setStudioSettingsPosition((pos) => {
      if (pos != null) return { left: pos.left - dx, top: pos.top - dy }
      return pos
    })

    setFloatingPlaceWindows((windows) =>
      windows.map((w) => {
        if (w.position != null) {
          return {
            ...w,
            position: { left: w.position.left - dx, top: w.position.top - dy },
          }
        }
        if (frameEl == null || frameRect == null) return w
        const host = frameEl.querySelector(
          `[data-floating-place-id="${w.placeId}"]`,
        ) as HTMLElement | null
        if (host == null) return w
        const hostRect = host.getBoundingClientRect()
        return {
          ...w,
          position: {
            left: hostRect.left - frameRect.left - dx,
            top: hostRect.top - frameRect.top - dy,
          },
        }
      }),
    )

    setFloatingAssetWindows((windows) =>
      windows.map((w) => {
        if (w.position != null) {
          return {
            ...w,
            position: { left: w.position.left - dx, top: w.position.top - dy },
          }
        }
        if (frameEl == null || frameRect == null) return w
        const host = frameEl.querySelector(
          `[data-floating-asset-id="${w.assetId}"]`,
        ) as HTMLElement | null
        if (host == null) return w
        const hostRect = host.getBoundingClientRect()
        return {
          ...w,
          position: {
            left: hostRect.left - frameRect.left - dx,
            top: hostRect.top - frameRect.top - dy,
          },
        }
      }),
    )
  }, [windowDragOffset, documentUndocked])

  const openFloatingExplorer = useCallback(() => {
    setExplorerPanelOpen(true)
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
    setPropertiesPanelOpen(true)
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

  const handleRibbonPanelToggle = useCallback(
    (panelId: RibbonPanelToggleId, open: boolean) => {
      if (panelId === 'toolbox') {
        setToolboxPanelOpen(open)
        return
      }
      if (panelId === 'explorer') {
        setExplorerPanelOpen(open)
        if (!open) closeFloatingTab('explorer')
        return
      }
      if (panelId === 'properties') {
        setPropertiesPanelOpen(open)
        if (!open) closeFloatingTab('properties')
        return
      }
      if (panelId === 'assets') {
        setAssetManagerPanelOpen(open)
      }
    },
    [closeFloatingTab],
  )

  const ribbonPanelToggles = useMemo(
    (): RibbonPanelToggles => ({
      toolbox: toolboxPanelOpen,
      explorer: explorerPanelOpen,
      properties: propertiesPanelOpen,
      assets: assetManagerPanelOpen,
    }),
    [toolboxPanelOpen, explorerPanelOpen, propertiesPanelOpen, assetManagerPanelOpen],
  )

  const handleFloatingWindowMerge = useCallback(
    (sourceWindowId: string, targetWindowId: string, mergedActiveTab: FloatingSidePanelId) => {
      setFloatingWindows((windows) =>
        mergeFloatingWindows(windows, sourceWindowId, targetWindowId, mergedActiveTab),
      )
    },
    [],
  )

  useEffect(() => {
    setPanelDockLayout((layout) =>
      syncBottomPanelsInLayout(layout, {
        outputPanelOpen,
        assetManagerPanelOpen,
        openPlaceDockPlaceIds,
        openAssetDockAssetIds,
        serverPlaceOrder: serverPlaceOrderIds,
      }),
    )
  }, [
    outputPanelOpen,
    assetManagerPanelOpen,
    openPlaceDockPlaceIds,
    openAssetDockAssetIds,
    serverPlaceOrderIds,
  ])

  const toggleWindowPanel = useCallback(
    (panelId: WindowPanelToggleId) => {
      if (panelId === 'studioSettings') {
        setStudioSettingsOpen((open) => !open)
        return
      }
      if (panelId === 'assetManager') {
        setAssetManagerPanelOpen((open) => !open)
        return
      }
      if (isPlaceDockPanelId(panelId)) {
        const placeId = placeIdFromDockPanel(panelId)
        setPlaceDockOpen(placeId, !openPlaceDockPlaceIds.includes(placeId))
        return
      }
      if (panelId === 'output') {
        setOutputPanelOpen((open) => !open)
        return
      }
      if (panelId === 'prototypeSettings') {
        setPrototypeSettingsPanelOpen((open) => !open)
      }
    },
    [openPlaceDockPlaceIds, setPlaceDockOpen],
  )

  const hiddenDockPanels = useMemo((): DockPanelId[] => {
    const hidden: DockPanelId[] = []
    if (floatingExplorerOpen || !explorerPanelOpen) hidden.push('explorer')
    if (floatingPropertiesOpen || !propertiesPanelOpen) hidden.push('properties')
    return hidden
  }, [floatingExplorerOpen, floatingPropertiesOpen, explorerPanelOpen, propertiesPanelOpen])

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
    const d = prototypeDefaultsForPhase(studioPhase)
    setClientSimActive(d.clientSimActive)
    setSimViewportFocus(d.simViewportFocus)
    setPlayModeHasStroke(d.playModeHasStroke)
    setPlayModeHasFocusStroke(d.playModeHasFocusStroke)
    setPlayModeTabStroke(d.playModeTabStroke)
    setPlayModeTabStrokeAllEdges(d.playModeTabStrokeAllEdges)
    setPlayModeTabStrokeConnected(d.playModeTabStrokeConnected)
    setPlayModeTabTint(d.playModeTabTint)
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
    setOpenAssetAsDockedDocument(d.openAssetAsDockedDocument)
    setLinkSemanticColors(d.linkSemanticColors)
    setLinkSemanticHueOnly(d.linkSemanticHueOnly)
    setLinkIconAccents(d.linkIconAccents)
    setPanelTogglesUseFills(d.panelTogglesUseFills)
    setRibbonIconSize(d.ribbonIconSize)
    setStudioColorTheme(d.studioColorTheme)
    setUiScale(d.uiScale)
    setToolSelectionColor(d.toolSelectionColor)
    setToolSelectionIncludeNeutrals(d.toolSelectionIncludeNeutrals)
    setExplorerPanelOpen(true)
    setPropertiesPanelOpen(true)
    setOpenAssetDockAssetIds([])
    setOpenMainStripAssetIds([])
    setOpenIsoStripAssetIds([])
    setActiveDockAssetId(null)
    setActiveMainStripAssetId(null)
    setActiveIsoStripAssetId(null)
    setFocusedDocumentHost('main')
    setFloatingWindows(() => {
      const windows: FloatingPanelWindowState[] = []
      let slot = 0
      if (d.floatingExplorerOpen) windows.push(createFloatingWindow('explorer', slot++))
      if (d.floatingPropertiesOpen) windows.push(createFloatingWindow('properties', slot++))
      return windows
    })
    setFloatingPlaceWindows([])
    setFloatingAssetWindows([])
    setFocusedFloatingAssetId(null)
    setDocumentUndocked(d.floatingDocumentOpen)
    setFloatingDocumentPosition(null)
    persistedExplorerSelectionRef.current = createEmptyPersistedExplorerSelection()
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
        openPlaceDockPlaceIds: initialOpenPlaceDockPlaceIds(studioPhase),
        serverPlaceOrder: serverPlaceOrderIds,
        assetManagerPanelOpen: false,
        hideExplorer: d.floatingExplorerOpen,
        hideProperties: d.floatingPropertiesOpen,
      }),
    )
    setToggleOpensDmIfClosed(d.toggleOpensDmIfClosed)
    setServersPersistIntoEdit(d.serversPersistIntoEdit)
    setServerTabUsesPlaceName(d.serverTabUsesPlaceName)
    setClientTabUsesPlaceName(d.clientTabUsesPlaceName)
    setOpenPlaceDockPlaceIds(initialOpenPlaceDockPlaceIds(studioPhase))
    setOpenMainStripPlaceIds([])
    setIsolationTabOpen(d.isolationTabOpen)
    setHoverScriptTabOpen(d.hoverScriptTabOpen)
    setExperienceAssetOnlyMode(false)
    setClientScriptDocument(DEFAULT_CLIENT_SCRIPT_DOCUMENT)
    setOutputPanelOpen(false)
    setAssetManagerPanelOpen(false)
    setToolboxPanelOpen(false)
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
    resetClientJoins()
  }, [resetClientJoins, studioPhase, serverPlaceOrderIds])

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

  const onEditExplorerSelectRow = useCallback(
    (rowId: string) => {
      const p = persistedExplorerSelectionRef.current
      switch (explorerTreeKind) {
        case 'bunny':
          p.bunny = rowId
          break
        case 'droneIsolation':
          p.droneIsolation = rowId
          break
        case 'level1Hierarchy':
          p.levelEditByPlace[levelHierarchyPlaceId] = rowId
          break
        case 'droneRacerHierarchy':
          p.droneRacerEdit = rowId
          break
        default:
          break
      }
      setEditExplorerSelectedRowId(rowId)
    },
    [explorerTreeKind, levelHierarchyPlaceId],
  )

  const onSimExplorerSelectRow = useCallback(
    (rowId: string) => {
      const p = persistedExplorerSelectionRef.current
      if (explorerTreeKind === 'flatSim') {
        if (explorerSimFocusForTree === 'server') {
          p.flatSimServer = rowId
          setSimExplorerSelectedRowServer(rowId)
          return
        }
        if (simMultiClientMode && simActiveClientInstanceIndex != null) {
          p.flatSimByClient[simActiveClientInstanceIndex] = rowId
          setSimExplorerSelectionByClient((prev) => ({
            ...prev,
            [simActiveClientInstanceIndex]: rowId,
          }))
          return
        }
        p.flatSimClient = rowId
        setSimExplorerSelectedRowClient(rowId)
        return
      }

      if (explorerTreeKind === 'level1Hierarchy') {
        if (explorerSimFocusForTree === 'server') {
          p.simHierarchyServerByPlace[levelHierarchyPlaceId] = rowId
          setSimExplorerSelectedRowServer(rowId)
          return
        }
        p.simHierarchyClientByPlace[levelHierarchyPlaceId] = rowId
        setSimExplorerSelectedRowClient(rowId)
        return
      }
      if (explorerSimFocusForTree === 'server') {
        p.simHierarchyServerByPlace[game.defaultPlaceId] = rowId
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
      p.simHierarchyClientByPlace[game.defaultPlaceId] = rowId
      setSimExplorerSelectedRowClient(rowId)
    },
    [
      explorerTreeKind,
      explorerSimFocusForTree,
      simMultiClientMode,
      simActiveClientInstanceIndex,
      levelHierarchyPlaceId,
      game.defaultPlaceId,
    ],
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
    ? explorerRowMeta(
        activeExplorerRowForProperties,
        explorerTreeKind === 'level1Hierarchy' ? currentLevelExplorerTree.rowMeta : undefined,
      ).label
    : null

  const panelChromeTitleAlign = panelTitlesLeftAligned ? ('left' as const) : ('center' as const)

  const bottomDockSinglePanel =
    visibleBottomDockStacks.length === 1 &&
    visibleBottomDockStacks[0]?.tabs.length === 1

  const dockTabStripDragEnabled =
    !bunnyAssetWindow &&
    showAssetInIsolation &&
    !playModeSplitView &&
    visibleBottomDockStacks.length > 0

  const renderPlaceDocumentTab = useCallback(
    (
      panelId: DocumentDockPanelId,
      ctx: {
        active: boolean
        tabIndex: number
        drag: TabRowDragBindings | TriZoneTabDragBindings
        onActivate: () => void
      },
    ) => {
      const dragProps = placeDocumentDockTabDragProps(ctx.drag, ctx.tabIndex)

      if (isAssetDockPanelId(panelId)) {
        const assetId = assetIdFromDockPanel(panelId)
        const asset = assetById(assetId)
        if (asset == null) return null
        const assetFocused = activeDockAssetId === assetId
        const tabClassName = buildPlaceTabClassName({
          active: ctx.active,
          tabStroke: playModeTabStroke && ctx.active && assetFocused,
          tabStrokeOn: playModeTabStroke,
          tabStrokeAllEdges: playModeTabStrokeAllEdges,
          tabStrokeConnected: playModeTabStrokeConnected,
          strokeOn: false,
          tabTintOn: false,
          datamodel: 'drone',
          editMode: !clientSimActive,
        })
        return (
          <TabWithPathTooltip
            key={panelId}
            path={`${game.displayName}/${asset.name}`}
            role="tab"
            tabIndex={0}
            aria-selected={ctx.active}
            className={tabClassName}
            {...dragProps.dragTabProps}
            onClick={(e) => {
              e.stopPropagation()
              dragProps.dragTabProps?.onClick?.(e)
              if (!e.defaultPrevented) {
                focusDockAssetDocument(assetId)
                ctx.onActivate()
              }
            }}
          >
            {asset.thumb === 'audio' ? (
              <Music size={12} strokeWidth={1.5} className={`${styles.tabDiamond} ${styles.tabNeutralIcon}`} aria-hidden />
            ) : (
              <TabDiamond />
            )}
            <span>{asset.name}</span>
            <TabCloseButton onClose={() => setAssetDockOpen(assetId, false)} />
          </TabWithPathTooltip>
        )
      }

      const placeId = placeIdFromDockPanel(panelId)
      const dockPlace = placeById(game, placeId)
      const dockPlaceName = dockPlace?.displayName ?? placeId
      const dockPlaceFocused = activeEditPlaceId === placeId && activeDockAssetId == null
      return (
        <DocumentPlaceTab
          key={panelId}
          label={
            clientSimActive
              ? simServerTabLabel(dockPlaceName, serverTabUsesPlaceName)
              : dockPlaceName
          }
          path={
            dockPlace
              ? clientSimActive
                ? simServerTabPathTooltip(dockPlace)
                : placeRootPathTooltip(dockPlace)
              : dockPlaceName
          }
          tabClassName={buildPlaceTabClassName({
            active: ctx.active,
            tabStroke: playModeTabStroke && ctx.active && dockPlaceFocused,
            tabStrokeOn: playModeTabStroke,
            tabStrokeAllEdges: playModeTabStrokeAllEdges,
            tabStrokeConnected: playModeTabStrokeConnected,
            strokeOn: playModeHasStroke && dockPlaceFocused,
            tabTintOn: clientSimActive && playModeTabTint && dockPlaceFocused,
            datamodel: clientSimActive ? 'server' : 'drone',
            editMode: !clientSimActive,
          })}
          leadingIcon={clientSimActive ? 'server' : 'place'}
          selected={ctx.active}
          onActivate={() => {
            focusPlaceDocument(placeId)
            ctx.onActivate()
          }}
          onClose={() => setPlaceDockOpen(placeId, false)}
          {...dragProps}
        />
      )
    },
    [
      game,
      activeEditPlaceId,
      activeDockAssetId,
      clientSimActive,
      serverTabUsesPlaceName,
      playModeTabStroke,
      playModeTabStrokeAllEdges,
      playModeTabStrokeConnected,
      playModeHasStroke,
      playModeTabTint,
      setPlaceDockOpen,
      setAssetDockOpen,
      focusPlaceDocument,
      focusDockAssetDocument,
    ],
  )

  const renderDockedPanel = useCallback(
    (panelId: DockPanelId, ctx: { tabbed: boolean; placeDocumentTabStripInDock: boolean }) => {
      const onPanelDockDrag =
        panelId === 'output' || isDocumentDockPanelId(panelId)
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
                  onEditSelectedRowIdChange={onEditExplorerSelectRow}
                  level1ExplorerTree={
                    explorerTreeKind === 'level1Hierarchy' ? currentLevelExplorerTree : null
                  }
                  colorTheme={studioColorTheme}
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
                onClose={() => setPrototypeSettingsPanelOpen(false)}
                showPopoutAction={false}
              />
              <div className={styles.panelBodyInteraction}>
              <InteractionSettingsPanel
                hasStroke={playModeHasStroke}
                onHasStrokeChange={setPlayModeHasStroke}
                hasFocusStroke={playModeHasFocusStroke}
                onHasFocusStrokeChange={setPlayModeHasFocusStroke}
                tabStroke={playModeTabStroke}
                onTabStrokeChange={setPlayModeTabStroke}
                tabStrokeAllEdges={playModeTabStrokeAllEdges}
                onTabStrokeAllEdgesChange={setPlayModeTabStrokeAllEdges}
                tabStrokeConnected={playModeTabStrokeConnected}
                onTabStrokeConnectedChange={setPlayModeTabStrokeConnected}
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
                tabTint={playModeTabTint}
                onTabTintChange={setPlayModeTabTint}
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
                onExperienceAssetOnly={
                  bunnyAssetWindow ? undefined : experienceAssetOnly
                }
                onOpenClientScript={bunnyAssetWindow ? undefined : openClientScriptTab}
                onOpenServerScript={bunnyAssetWindow ? undefined : openServerScriptTab}
                onThrowError={bunnyAssetWindow ? undefined : handleThrowError}
                testingMode={clientSimActive}
                onReset={bunnyAssetWindow ? undefined : handlePrototypeReset}
                serversPersistIntoEdit={serversPersistIntoEdit}
                onServersPersistIntoEditChange={setServersPersistIntoEdit}
                openAssetAsDockedDocument={openAssetAsDockedDocument}
                onOpenAssetAsDockedDocumentChange={setOpenAssetAsDockedDocument}
                serverTabUsesPlaceName={serverTabUsesPlaceName}
                onServerTabUsesPlaceNameChange={setServerTabUsesPlaceName}
                clientTabUsesPlaceName={clientTabUsesPlaceName}
                onClientTabUsesPlaceNameChange={setClientTabUsesPlaceName}
                linkSemanticColors={linkSemanticColors}
                onLinkSemanticColorsChange={setLinkSemanticColors}
                linkSemanticHueOnly={linkSemanticHueOnly}
                onLinkSemanticHueOnlyChange={setLinkSemanticHueOnly}
                linkIconAccents={linkIconAccents}
                onLinkIconAccentsChange={setLinkIconAccents}
                panelTogglesUseFills={panelTogglesUseFills}
                onPanelTogglesUseFillsChange={setPanelTogglesUseFills}
                ribbonIconSize={ribbonIconSize}
                onRibbonIconSizeChange={setRibbonIconSize}
                studioColorTheme={studioColorTheme}
                onStudioColorThemeChange={setStudioColorTheme}
                uiScale={uiScale}
                onUiScaleChange={setUiScale}
                toolSelectionColor={toolSelectionColor}
                onToolSelectionColorChange={setToolSelectionColor}
                toolSelectionIncludeNeutrals={toolSelectionIncludeNeutrals}
                onToolSelectionIncludeNeutralsChange={setToolSelectionIncludeNeutrals}
                studioPhase={studioPhase}
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
              fillDock
              titleAlign={panelChromeTitleAlign}
              gameName={game.displayName}
              hideHeader={false}
              onClose={() => setAssetManagerPanelOpen(false)}
              onOpenPlace={openOrFocusPlaceFromAssetManager}
              onOpenAsset={openOrFocusAssetFromAssetManager}
            />
          )
        default:
          if (isAssetDockPanelId(panelId)) {
            const dockAssetId = assetIdFromDockPanel(panelId)
            const dockAsset = assetById(dockAssetId)
            if (dockAsset == null) return null
            const assetFocused = activeDockAssetId === dockAssetId
            return (
              <AssetDocumentPanel
                asset={dockAsset}
                pathTooltip={`${game.displayName}/${dockAsset.name}`}
                hideTabStrip={ctx.placeDocumentTabStripInDock}
                documentFocused={assetFocused}
                showFocusRing={assetFocused}
                onFocusDocument={() => focusDockAssetDocument(dockAssetId)}
                onTabClose={() => setAssetDockOpen(dockAssetId, false)}
                onTabStripPointerDown={ctx.tabbed ? undefined : onPanelDockDrag}
              />
            )
          }
          if (!isPlaceDockPanelId(panelId)) return null
          const dockPlaceId = placeIdFromDockPanel(panelId)
          const dockPlace = placeById(game, dockPlaceId)
          const dockPlaceName = dockPlace?.displayName ?? dockPlaceId
          const dockPlaceFocused =
            activeEditPlaceId === dockPlaceId && activeDockAssetId == null
          return (
            <PlaceDocumentPanel
              title={dockPlaceName}
              tabLabel={
                clientSimActive
                  ? simServerTabLabel(dockPlaceName, serverTabUsesPlaceName)
                  : undefined
              }
              pathTooltip={
                dockPlace
                  ? clientSimActive
                    ? simServerTabPathTooltip(dockPlace)
                    : placeRootPathTooltip(dockPlace)
                  : dockPlaceName
              }
              fillDock={
                !ctx.placeDocumentTabStripInDock &&
                !bottomDockSinglePanel
              }
              hideTabStrip={ctx.placeDocumentTabStripInDock}
              tabStroke={playModeTabStroke}
              tabStrokeAllEdges={playModeTabStrokeAllEdges}
              tabStrokeConnected={playModeTabStrokeConnected}
              strokeOn={clientSimActive && playModeHasStroke}
              tabTintOn={clientSimActive && playModeTabTint}
              testServerView={clientSimActive}
              hasJoinedClient={level1ServerShowsJoinedClient(
                dockPlaceId,
                clientSimActive,
                clientViewPlaceId,
                joinedPlaceIds,
              )}
              showServerSemanticStroke={
                clientSimActive &&
                dockPlaceFocused &&
                playModeHasStroke &&
                !playModeHasFocusStroke
              }
              documentFocused={dockPlaceFocused}
              showFocusRing={
                clientSimActive
                  ? dockPlaceFocused && playModeHasFocusStroke
                  : dockPlaceFocused
              }
              onFocusDocument={() => focusPlaceDocument(dockPlaceId)}
              onTabClose={() => setPlaceDockOpen(dockPlaceId, false)}
              onTabStripPointerDown={ctx.tabbed ? undefined : onPanelDockDrag}
            />
          )
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
      serverTabUsesPlaceName,
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
      playModeTabStroke,
      playModeTabStrokeAllEdges,
      playModeTabStrokeConnected,
      playModeTabTint,
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
      experienceAssetOnly,
      handleThrowError,
      handlePrototypeReset,
      outputLogEntries,
      openCameraZoomScript,
      game,
      mainStripPlace,
      setPlaceDockOpen,
      openOrFocusPlaceFromAssetManager,
      openOrFocusAssetFromAssetManager,
      bottomDockSinglePanel,
      assetManagerPanelOpen,
      activeEditPlaceId,
      activeDockAssetId,
      focusPlaceDocument,
      focusDockAssetDocument,
      setAssetDockOpen,
      simViewportFocus,
      joinedPlaceIds,
      clientViewPlaceId,
      level1ExplorerTree,
      renderPlaceDocumentTab,
    ],
  )

  const centerBottomDock =
    !bunnyAssetWindow && visibleBottomDockStacks.length > 0 ? (
    <>
      <div className={styles.centerDockGutter} aria-hidden />
      <PanelDockZone
        zone="bottom"
        stacks={visibleBottomDockStacks}
        onStacksChange={(bottom) => setPanelDockLayout((layout) => ({ ...layout, bottom }))}
        isDropTarget={panelDockDrag.isDropTarget}
        isMergeDropTarget={panelDockDrag.isMergeDropTarget}
        renderPanel={renderDockedPanel}
        resolvePlaceDisplayName={(placeId) => placeById(game, placeId)?.displayName}
        renderPlaceDocumentTab={renderPlaceDocumentTab}
        documentTabStripDrag={dockTabStripDragEnabled ? documentTabStripDrag : null}
        className={styles.centerDock}
        onHostPointerDown={handleBottomDocumentHostFocus}
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

      if (restoreExperienceAssetViewOnStopRef.current) {
        restoreExperienceAssetViewOnStopRef.current = false
        setExperienceAssetOnlyMode(true)
        setEditWorkspaceDocumentFocus('isolation')
        setCombinedIsoZoneKeys([isoPersistentKey('isolation')])
        setMainDocumentEditorTab('droneRacer')
      } else {
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
    }
    prevClientSimActiveRef.current = clientSimActive
    // editWorkspaceDocumentFocus intentionally omitted: only snapshot on sim toggle, not each focus tick.
  }, [clientSimActive, showAssetInIsolation])

  /** Keep script/sim strip orders aligned with combined-zone placement (drag / iso column). */
  useEffect(() => {
    if (!showAssetInIsolation || playModeSplitView) return
    if (combinedMainZoneKeys == null && combinedIsoZoneKeys == null) return
    if (simMultiClientMode) return

    let mainKeys = [...(combinedMainZoneKeys ?? [])]
    for (const placeId of joinedPlaceIds) {
      if (!placeServerUsesMainStripTab(placeId)) continue
      mainKeys = insertPlaceServerPersistentKeyAfterClient(mainKeys, placeId)
    }

    const synced = syncAllDocumentOrdersFromPersistentZones(
      mainKeys,
      combinedIsoZoneKeys ?? [],
      simDocumentTabOrder,
      scriptTabOrder,
      editIsolationTabOrder,
    )
    setSimDocumentTabOrder(() => {
      let next = synced.simOrder
      for (const placeId of joinedPlaceIds) {
        if (!placeServerUsesMainStripTab(placeId)) continue
        const tab = simPlaceServerTabId(placeId)
        if (!next.includes(tab)) {
          next = insertPlaceServerTabAfterClient(next, placeId)
        }
      }
      return next
    })
    setScriptTabOrder(synced.scriptOrder)
    setEditIsolationTabOrder(synced.isoTabOrder)
  }, [
    combinedMainZoneKeys,
    combinedIsoZoneKeys,
    showAssetInIsolation,
    playModeSplitView,
    simMultiClientMode,
    joinedPlaceIds,
  ])

  useEffect(() => {
    if (!showAssetInIsolation) {
      setDocumentUndocked(false)
      setExperienceAssetOnlyMode(false)
    }
  }, [showAssetInIsolation])

  useEffect(() => {
    if (!showAssetInIsolation) setEditWorkspaceDocumentFocus('main')
  }, [showAssetInIsolation])

  useEffect(() => {
    if (clientSimActive) setExperienceAssetOnlyMode(false)
  }, [clientSimActive])

  useEffect(() => {
    document.documentElement.dataset.theme = studioColorTheme
  }, [studioColorTheme])

  return (
    <div
      ref={frameRef}
      className={styles.frame}
      data-node-id="3841:114990"
      data-name="Studio - Windows OS"
      data-ui-scale={uiScale}
      data-tool-selection-color={toolSelectionColor}
      {...(toolSelectionColor === 'blue_highlight' && toolSelectionIncludeNeutrals
        ? { 'data-tool-selection-include-neutrals': '' as const }
        : {})}
      style={{ ['--ui-scale' as string]: uiScaleFactor(uiScale) }}
      {...(floatingWindows.length > 0 ||
      floatingPlaceWindows.length > 0 ||
      floatingAssetWindows.length > 0 ||
      studioSettingsOpen ||
      documentUndocked
        ? { 'data-floating-panels': '' as const }
        : {})}
      {...(linkSemanticColors ? { 'data-link-semantic-colors': '' as const } : {})}
      {...(linkSemanticColors && linkSemanticHueOnly
        ? { 'data-link-semantic-hue-only': '' as const }
        : {})}
      {...(linkSemanticColors && linkIconAccents
        ? { 'data-link-icon-accents': '' as const }
        : {})}
      {...(panelTogglesUseFills ? { 'data-panel-toggles-use-fills': '' as const } : {})}
      data-ribbon-icon-size={ribbonIconSize}
    >
      <div className={styles.frameScaledContent}>
      <div className={styles.frameShell}>
      <header
        className={styles.appBar}
        data-node-id="3842:134467"
        onPointerDown={onWindowChromePointerDown}
      >
        <div className={styles.appBarLeft}>
          <button type="button" className={styles.logoBtn} aria-label="App menu">
            <span
              className={styles.appBarLogoMask}
              style={{
                maskImage: `url("${publicAssetUrl('assets/appbar-logo.svg')}")`,
                WebkitMaskImage: `url("${publicAssetUrl('assets/appbar-logo.svg')}")`,
              }}
              aria-hidden
            />
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
              ) : label === 'Window' ? (
                <WindowAppMenu
                  key={label}
                  triggerClassName={styles.menuItem}
                  disabled={bunnyAssetWindow}
                  showPlaceDockPanels={phase2}
                  assetManagerOpen={assetManagerPanelOpen}
                  studioSettingsOpen={studioSettingsOpen}
                  prototypeSettingsOpen={prototypeSettingsPanelOpen}
                  placeLevel1Open={isPlaceDockOpen('level-1')}
                  outputOpen={outputPanelOpen}
                  onTogglePanel={toggleWindowPanel}
                />
              ) : (
                <span key={label} className={styles.menuItem}>
                  {label}
                </span>
              ),
            )}
          </nav>
        </div>
        <h1 className={styles.title}>
          {bunnyAssetWindow ? 'Bunny' : phase2 ? game.displayName : PHASE_1_APP_BAR_TITLE}
        </h1>
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

      <div className={styles.ribbonBlock}>
      <LegacyRibbon
        panelToggles={ribbonPanelToggles}
        onPanelToggle={handleRibbonPanelToggle}
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
          const playFromExperienceAssetView = experienceAssetOnlyMode
          if (playFromExperienceAssetView) {
            restoreExperienceAssetViewOnStopRef.current = true
            playModeSessionRef.current = {
              ...session,
              hasStoredSession: false,
            }
          }
          const restore = playFromExperienceAssetView ? false : session.hasStoredSession
          const isFirstServerAndClientsPlay =
            testRunMode === 'serverAndClients' && (!restore || !session.simMultiClientMode)
          const clientOpen = playFromExperienceAssetView
            ? true
            : isFirstServerAndClientsPlay
              ? true
              : restore
                ? session.simClientTabOpen
                : true
          const serverOpen = playFromExperienceAssetView
            ? true
            : restore
              ? session.simServerTabOpen
              : PROTOTYPE_SETTINGS_DEFAULTS.simServerTabOpen

          if (playFromExperienceAssetView) {
            setScriptATabOpen(false)
            setScriptBTabOpen(false)
            setClientScriptTabOpen(false)
            setServerScriptTabOpen(false)
            setExperienceAssetOnlyMode(false)
          }

          setClientSimActive(true)
          if (!restore) {
            resetClientJoins()
            setActiveEditPlaceId(game.defaultPlaceId)
            setClientViewPlaceId(game.defaultPlaceId)
            setSimViewportFocus('client')
            setSimFocusedStripTab('client')
          }
          if (phase2 && !playFromExperienceAssetView) {
            setOpenPlaceDockPlaceIds((ids) => mergeOpenPlaceDockPlaceIds(ids))
            setPanelDockLayout((layout) => focusBottomDockPlaceTab(layout, 'level-1'))
          } else if (playFromExperienceAssetView) {
            setOpenPlaceDockPlaceIds([])
          }
          setSimClientTabOpen(clientOpen)
          setSimServerTabOpen(serverOpen)
          setMainDocumentEditorTab('droneRacer')
          setEditWorkspaceDocumentFocus('main')

          const scriptOpen = playFromExperienceAssetView
            ? {
                scriptA: false,
                scriptB: false,
                clientScript: false,
                serverScript: false,
              }
            : {
                scriptA: scriptATabOpen,
                scriptB: scriptBTabOpen,
                clientScript: clientScriptTabOpen,
                serverScript: serverScriptTabOpen,
              }

          const isScriptOpen = (tab: MainScriptTabId) => scriptOpen[tab]

          const editPersistedServerPlaces = openMainStripPlaceIdsFromJoined(
            openMainStripPlaceIds,
            serverPlaces,
          )
          const sessionJoinedPlaces = restore
            ? joinedPlaceIdsFromSimOrder(session.simDocumentTabOrder)
            : []
          const seedJoinedPlaceIds = placeIdsInServerOrder(
            [
              ...new Set([...sessionJoinedPlaces, ...editPersistedServerPlaces]),
            ],
            serverPlaces,
          )

          const applyPersistedPlaceServerTabs = (order: SimDocumentStripTab[]) => {
            if (!phase2 || seedJoinedPlaceIds.length === 0) return order
            setJoinedPlaceIds(seedJoinedPlaceIds)
            return insertPlaceServerTabsAfterClient(order, seedJoinedPlaceIds)
          }

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
            let multiClientSimOrder = restore && !isFirstServerAndClientsPlay
              ? mergeOpenTabOrder(session.simDocumentTabOrder, desiredOrder)
              : desiredOrder
            multiClientSimOrder = applyPersistedPlaceServerTabs(multiClientSimOrder)
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
              if (playFromExperienceAssetView) {
                setCombinedIsoZoneKeys([isoPersistentKey('isolation')])
              }
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
            let singleTestSimOrder = restore
              ? mergeOpenTabOrder(session.simDocumentTabOrder, desiredOrder)
              : desiredOrder
            singleTestSimOrder = applyPersistedPlaceServerTabs(singleTestSimOrder)
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
              if (playFromExperienceAssetView) {
                setCombinedIsoZoneKeys([isoPersistentKey('isolation')])
              }
            }
          }
        }}
        onStop={() => {
          const returnToExperienceAssetView = restoreExperienceAssetViewOnStopRef.current
          const focusedPlaceId = editPlaceIdAfterTestStop(
            simFocusedStripTab,
            activeEditPlaceId,
            game.defaultPlaceId,
          )
          const joined = joinedPlaceIds
          if (
            phase2 &&
            serversPersistIntoEdit &&
            joined.length > 0 &&
            !returnToExperienceAssetView
          ) {
            const mainStrip = openMainStripPlaceIdsFromJoined(joined, serverPlaces)
            setOpenMainStripPlaceIds(mainStrip)
            setOpenPlaceDockPlaceIds(mergeOpenPlaceDockPlaceIds([]))
            const editFocusPlaceId =
              focusedPlaceId === game.defaultPlaceId ||
              focusedPlaceId === DOCKED_TEST_SERVER_PLACE_ID ||
              mainStrip.includes(focusedPlaceId)
                ? focusedPlaceId
                : mainStrip[mainStrip.length - 1] ?? game.defaultPlaceId
            setActiveEditPlaceId(editFocusPlaceId)
            setMainDocumentEditorTab('droneRacer')
            setEditWorkspaceDocumentFocus('main')
          } else if (!serversPersistIntoEdit && !returnToExperienceAssetView) {
            setOpenMainStripPlaceIds([])
            setOpenPlaceDockPlaceIds(initialOpenPlaceDockPlaceIds(studioPhase))
            setActiveEditPlaceId(
              focusedPlaceId === game.defaultPlaceId ||
              focusedPlaceId === DOCKED_TEST_SERVER_PLACE_ID
                ? focusedPlaceId
                : game.defaultPlaceId,
            )
            setMainDocumentEditorTab('droneRacer')
            setEditWorkspaceDocumentFocus('main')
          } else if (returnToExperienceAssetView) {
            setOpenMainStripPlaceIds([])
            setOpenPlaceDockPlaceIds([])
            setActiveEditPlaceId(game.defaultPlaceId)
            setMainDocumentEditorTab('droneRacer')
          }
          resetClientJoins()
          setClientSimActive(false)
          setSimMultiClientMode(false)
          setSimClientInstanceCount(1)
          setSimFocusedStripTab('client')
          setSimExplorerSelectionByClient({})
          setCombinedMainZoneKeys(null)
        }}
      />
      </div>

      <div className={styles.workspaceGutter} aria-hidden />

      <div className={styles.panels} data-node-id="3841:115136">
        {toolboxPanelOpen || assetManagerPanelOpen ? (
          <aside className={styles.left} data-node-id="3841:115189">
            {toolboxPanelOpen ? (
              <div className={styles.leftDockedPanelWrap}>
                <ToolboxPanel
                  fillDock
                  titleAlign={panelChromeTitleAlign}
                  onClose={() => setToolboxPanelOpen(false)}
                />
              </div>
            ) : null}
            {assetManagerPanelOpen ? (
              <div className={styles.leftDockedPanelWrap}>
                {renderDockedPanel('assetManager', {
                  tabbed: false,
                  placeDocumentTabStripInDock: false,
                })}
              </div>
            ) : null}
          </aside>
        ) : null}
        {clientSimActive ? (
          <section className={styles.center} data-node-id="3841:115137">
            <div className={styles.centerWorkspace}>
              {bunnyAssetWindow ? (
                <BunnyWorkspace
                  clientSim
                  simViewportFocus={simViewportFocus}
                  onSimViewportFocusChange={setSimViewportFocus}
                  mainDocumentEditorTab={mainDocumentEditorTab}
                  onMainDocumentEditorTabChange={handleMainDocumentEditorTabChange}
                  playModeHasStroke={playModeHasStroke}
                  playModeHasFocusStroke={playModeHasFocusStroke}
                  playModeTabStroke={playModeTabStroke}
                  playModeTabStrokeAllEdges={playModeTabStrokeAllEdges}
                  playModeTabStrokeConnected={playModeTabStrokeConnected}
                  playModeTabTint={playModeTabTint}
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
                  onMainDocumentEditorTabChange={handleMainDocumentEditorTabChange}
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
                  playModeTabStrokeAllEdges={playModeTabStrokeAllEdges}
                  playModeTabStrokeConnected={playModeTabStrokeConnected}
                  playModeTabTint={playModeTabTint}
                  tintActive={tintActive}
                  focusHoleRef={focusHoleRef}
                  playModeSplitView={playModeSplitView}
                  editDatamodelShowStroke={editDatamodelShowStroke}
                  editDocumentFocus={editWorkspaceDocumentFocus}
                  onEditDocumentFocusChange={handleEditWorkspaceDocumentFocusChange}
                  documentUndocked={documentUndocked}
                  floatingDocumentPosition={floatingDocumentPosition}
                  onFloatingDocumentPositionChange={setFloatingDocumentPosition}
                  onDockDocument={dockDocument}
                  frameRef={frameRef}
                  panelChromeTitleAlign={panelChromeTitleAlign}
                  clientScriptDocument={clientScriptDocument}
                  mainStripPlace={mainStripPlace}
                  gameDisplayName={game.displayName}
                  activeEditPlaceId={activeEditPlaceId}
                  onFocusLobbyPlace={focusLobbyPlace}
                  joinedPlaceIds={joinedPlaceIds}
                  clientViewPlaceId={clientViewPlaceId}
                  clientJoiningPlace={clientJoiningPlace}
                  joiningPlaceDisplayName={joiningPlaceDisplayName}
                  canJoinAnotherPlace={canJoinAnotherPlace}
                  onClientSimJoinNextPlace={
                    phase2 ? handleClientSimJoinNextPlace : undefined
                  }
                  onClosePlaceServerTab={closePlaceServerTab}
                  onFocusPlaceDocument={focusPlaceDocument}
                  serverPlaces={serverPlaces}
                  openMainStripPlaceIds={openMainStripPlaceIds}
                  onCloseMainStripPlaceTab={closeMainStripPlaceTab}
                  onActivateMainStripPlaceTab={activateMainStripPlaceTab}
                  openMainStripAssetIds={openMainStripAssetIds}
                  activeMainStripAssetId={activeMainStripAssetId}
                  onCloseMainStripAssetTab={closeMainStripAssetTab}
                  onActivateMainStripAssetTab={activateMainStripAssetTab}
                  openIsoStripAssetIds={openIsoStripAssetIds}
                  activeIsoStripAssetId={activeIsoStripAssetId}
                  onCloseIsoStripAssetTab={closeIsoStripAssetTab}
                  onActivateIsoStripAssetTab={activateIsoStripAssetTab}
                  onMainDocumentHostFocus={handleMainDocumentHostFocus}
                  onIsoDocumentHostFocus={handleIsoDocumentHostFocus}
                  onClearIsoStripAssetSelection={clearIsoStripAssetSelection}
                  documentHostFocus={focusedDocumentHost}
                  serverTabUsesPlaceName={serverTabUsesPlaceName}
                  clientTabUsesPlaceName={clientTabUsesPlaceName}
                  studioPhase={studioPhase}
                  dockTabStripEnabled={dockTabStripDragEnabled}
                  openPlaceDockPlaceIds={openPlaceDockPlaceIds}
                  onOpenPlaceDockPlaceIdsChange={setOpenPlaceDockPlaceIds}
                  onRegisterDocumentTabStripDrag={registerDocumentTabStripDrag}
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
                  playModeTabStrokeAllEdges={playModeTabStrokeAllEdges}
                  playModeTabStrokeConnected={playModeTabStrokeConnected}
                  playModeTabTint={playModeTabTint}
                  editDatamodelShowStroke={editDatamodelShowStroke}
                  editDocumentFocus={editWorkspaceDocumentFocus}
                  onEditDocumentFocusChange={setEditWorkspaceDocumentFocus}
                  mainDocumentEditorTab={mainDocumentEditorTab}
                  onMainDocumentEditorTabChange={handleMainDocumentEditorTabChange}
                />
              ) : (
                <DroneRacerWorkspace
                  showAssetInIsolation={showAssetInIsolation}
                  experienceAssetOnlyMode={experienceAssetOnlyMode}
                  editDatamodelShowStroke={editDatamodelShowStroke}
                  editDocumentFocus={editWorkspaceDocumentFocus}
                  onEditDocumentFocusChange={handleEditWorkspaceDocumentFocusChange}
                  mainDocumentEditorTab={mainDocumentEditorTab}
                  onMainDocumentEditorTabChange={handleMainDocumentEditorTabChange}
                  playModeHasStroke={playModeHasStroke}
                  playModeHasFocusStroke={playModeHasFocusStroke}
                  playModeTabStroke={playModeTabStroke}
                  playModeTabStrokeAllEdges={playModeTabStrokeAllEdges}
                  playModeTabStrokeConnected={playModeTabStrokeConnected}
                  playModeTabTint={playModeTabTint}
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
                  mainStripPlace={mainStripPlace}
                  gameDisplayName={game.displayName}
                  activeEditPlaceId={activeEditPlaceId}
                  onFocusLobbyPlace={focusLobbyPlace}
                  openMainStripPlaceIds={openMainStripPlaceIds}
                  onCloseMainStripPlaceTab={closeMainStripPlaceTab}
                  onActivateMainStripPlaceTab={activateMainStripPlaceTab}
                  openMainStripAssetIds={openMainStripAssetIds}
                  activeMainStripAssetId={activeMainStripAssetId}
                  onCloseMainStripAssetTab={closeMainStripAssetTab}
                  onActivateMainStripAssetTab={activateMainStripAssetTab}
                  openIsoStripAssetIds={openIsoStripAssetIds}
                  activeIsoStripAssetId={activeIsoStripAssetId}
                  onCloseIsoStripAssetTab={closeIsoStripAssetTab}
                  onActivateIsoStripAssetTab={activateIsoStripAssetTab}
                  onMainDocumentHostFocus={handleMainDocumentHostFocus}
                  onIsoDocumentHostFocus={handleIsoDocumentHostFocus}
                  onClearIsoStripAssetSelection={clearIsoStripAssetSelection}
                  documentHostFocus={focusedDocumentHost}
                  onFocusPlaceDocument={focusPlaceDocument}
                  serverPlaces={serverPlaces}
                  serverTabUsesPlaceName={serverTabUsesPlaceName}
                  clientTabUsesPlaceName={clientTabUsesPlaceName}
                  studioPhase={studioPhase}
                  dockTabStripEnabled={dockTabStripDragEnabled}
                  openPlaceDockPlaceIds={openPlaceDockPlaceIds}
                  onOpenPlaceDockPlaceIdsChange={setOpenPlaceDockPlaceIds}
                  onRegisterDocumentTabStripDrag={registerDocumentTabStripDrag}
                />
              )}
            </div>
            {centerBottomDock}
          </section>
        )}

        <aside
          className={styles.right}
          data-node-id="3841:115190"
          data-prototype-settings-open={prototypeSettingsPanelOpen ? 'true' : 'false'}
        >
          {explorerPanelOpen && !floatingExplorerOpen ? (
            <div className={styles.rightDockedPanelWrap} data-node-id="3841:115191">
              {renderDockedPanel('explorer', { tabbed: false, placeDocumentTabStripInDock: false })}
            </div>
          ) : null}
          {propertiesPanelOpen && !floatingPropertiesOpen ? (
            <div className={styles.rightDockedPanelWrap} data-node-id="3841:115196">
              {renderDockedPanel('properties', { tabbed: false, placeDocumentTabStripInDock: false })}
            </div>
          ) : null}
          {prototypeSettingsPanelOpen ? (
            <div className={`${styles.panel} ${styles.panelInteraction}`}>
              {renderDockedPanel('prototypeSettings', {
                tabbed: false,
                placeDocumentTabStripInDock: false,
              })}
            </div>
          ) : null}
        </aside>
      </div>

      <div className={styles.workspaceGutter} aria-hidden />

      <StudioFooter
        questions={FOOTER_QUESTIONS}
        datamodelTintFocus={footerDatamodelTintFocus}
      />
      </div>

      {studioSettingsOpen ? (
        <FloatingStudioSettingsWindow
          frameRef={frameRef}
          position={studioSettingsPosition}
          onPositionChange={setStudioSettingsPosition}
          size={studioSettingsSize}
          onSizeChange={setStudioSettingsSize}
          onClose={() => setStudioSettingsOpen(false)}
          studioColorTheme={studioColorTheme}
          onStudioColorThemeChange={setStudioColorTheme}
          themePreset={studioThemePreset}
          onThemePresetChange={setStudioThemePreset}
        />
      ) : null}

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
              showPopoutAction={false}
              showCloseAction
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
                  onEditSelectedRowIdChange={onEditExplorerSelectRow}
                  level1ExplorerTree={
                    explorerTreeKind === 'level1Hierarchy' ? currentLevelExplorerTree : null
                  }
                  colorTheme={studioColorTheme}
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

      {floatingPlaceWindows.map((win) => (
        <FloatingPlaceDocumentWindow
          key={win.windowId}
          frameRef={frameRef}
          placeId={win.placeId}
          position={win.position}
          defaultSlot={win.defaultSlot}
          onPositionChange={(position) =>
            setFloatingPlaceWindows((windows) =>
              windows.map((w) => (w.windowId === win.windowId ? { ...w, position } : w)),
            )
          }
        >
          {({ onTabStripPointerDown }) =>
            renderFloatingPlaceDocumentPanel(win.placeId, {
              onTabStripPointerDown,
              onTabClose: () => closeFloatingPlaceWindow(win.placeId),
            })
          }
        </FloatingPlaceDocumentWindow>
      ))}

      {floatingAssetWindows.map((win) => (
        <FloatingAssetDocumentWindow
          key={win.windowId}
          frameRef={frameRef}
          assetId={win.assetId}
          position={win.position}
          defaultSlot={win.defaultSlot}
          onPositionChange={(position) =>
            setFloatingAssetWindows((windows) =>
              windows.map((w) => (w.windowId === win.windowId ? { ...w, position } : w)),
            )
          }
        >
          {({ onTabStripPointerDown }) =>
            renderFloatingAssetDocumentPanel(win.assetId, {
              onTabStripPointerDown,
              onTabClose: () => closeFloatingAssetWindow(win.assetId),
            })
          }
        </FloatingAssetDocumentWindow>
      ))}

      {tintActive ? (
        <div
          className={`${styles.simFullTintOverlay} ${
            simViewportFocus === 'client'
              ? styles.simFullTintOverlayClient
              : styles.simFullTintOverlayServer
          }`}
          style={{
            clipPath: tintClipPath ?? 'none',
          }}
          aria-hidden
        />
      ) : null}
      </div>
    </div>
  )
}
