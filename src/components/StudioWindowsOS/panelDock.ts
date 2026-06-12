import {
  DEFAULT_OPEN_PLACE_DOCK_PLACE_IDS,
  isPlaceDockPanelId,
  placeDockPanelId,
  placeIdFromDockPanel,
  type PlaceDockPanelId,
} from './placeDockPanels'
import {
  assetDockPanelId,
  assetIdFromDockPanel,
  isAssetDockPanelId,
  type AssetDockPanelId,
} from './assetDockPanels'
import { isDocumentDockPanelId } from './documentDockPanels'

export type { PlaceDockPanelId } from './placeDockPanels'
export type { AssetDockPanelId } from './assetDockPanels'

export type DockPanelId =
  | 'explorer'
  | 'properties'
  | 'prototypeSettings'
  | 'output'
  | 'assetManager'
  | PlaceDockPanelId
  | AssetDockPanelId

export type DockZoneId = 'right' | 'bottom'

const STATIC_PANEL_DOCK_LABELS = {
  explorer: 'Explorer',
  properties: 'Properties',
  prototypeSettings: 'Prototype settings',
  output: 'Output',
  assetManager: 'Asset Manager',
} as const satisfies Record<
  Exclude<DockPanelId, PlaceDockPanelId | AssetDockPanelId>,
  string
>

/** @deprecated Use `panelDockLabel` for place dock tabs. */
export const PANEL_DOCK_LABELS: Record<string, string> = {
  ...STATIC_PANEL_DOCK_LABELS,
  'place:level-1': 'Level 1',
}

export function panelDockLabel(
  panelId: DockPanelId,
  resolvePlaceDisplayName?: (placeId: string) => string | undefined,
  resolveAssetDisplayName?: (assetId: string) => string | undefined,
): string {
  if (isPlaceDockPanelId(panelId)) {
    const name = resolvePlaceDisplayName?.(placeIdFromDockPanel(panelId))
    return name ?? placeIdFromDockPanel(panelId)
  }
  if (isAssetDockPanelId(panelId)) {
    const name = resolveAssetDisplayName?.(assetIdFromDockPanel(panelId))
    return name ?? assetIdFromDockPanel(panelId)
  }
  return STATIC_PANEL_DOCK_LABELS[panelId]
}

export type PanelStackState = {
  stackId: string
  tabs: DockPanelId[]
  activeTab: DockPanelId
}

export type PanelDockLayoutState = {
  right: PanelStackState[]
  bottom: PanelStackState[]
}

let stackIdSeq = 0
export function newPanelStackId(): string {
  stackIdSeq += 1
  return `panel-stack-${stackIdSeq}`
}

export function createPanelStack(
  tabs: DockPanelId[],
  activeTab: DockPanelId = tabs[0]!,
): PanelStackState {
  return { stackId: newPanelStackId(), tabs: [...tabs], activeTab }
}

export type PanelDockLayoutOptions = {
  outputPanelOpen: boolean
  assetManagerPanelOpen?: boolean
  /** Place ids with a bottom-dock document (default Level 1). */
  openPlaceDockPlaceIds?: readonly string[]
  /** Order for `openPlaceDockPlaceIds` when building default layout tabs. */
  serverPlaceOrder?: readonly string[]
  hideExplorer: boolean
  hideProperties: boolean
}

export function createDefaultPanelDockLayout(
  options: PanelDockLayoutOptions,
): PanelDockLayoutState {
  const right: PanelStackState[] = []
  if (!options.hideExplorer) {
    right.push(createPanelStack(['explorer']))
  }
  if (!options.hideProperties) {
    right.push(createPanelStack(['properties']))
  }
  right.push(createPanelStack(['prototypeSettings']))

  const openPlaceIds =
    options.openPlaceDockPlaceIds ?? [...DEFAULT_OPEN_PLACE_DOCK_PLACE_IDS]
  const placeOrder = options.serverPlaceOrder ?? [...openPlaceIds]
  const bottomTabs: DockPanelId[] = []
  if (options.outputPanelOpen) bottomTabs.push('output')
  for (const placeId of placeOrder) {
    if (openPlaceIds.includes(placeId)) bottomTabs.push(placeDockPanelId(placeId))
  }

  return {
    right,
    bottom:
      bottomTabs.length > 0
        ? [createPanelStack(bottomTabs, bottomTabs[0]!)]
        : [],
  }
}

export function findPanelLocation(
  layout: PanelDockLayoutState,
  panelId: DockPanelId,
): { zone: DockZoneId; stackIndex: number; tabIndex: number } | null {
  for (const zone of ['right', 'bottom'] as const) {
    const stacks = layout[zone]
    for (let stackIndex = 0; stackIndex < stacks.length; stackIndex++) {
      const tabIndex = stacks[stackIndex]!.tabs.indexOf(panelId)
      if (tabIndex >= 0) return { zone, stackIndex, tabIndex }
    }
  }
  return null
}

export function reorderStackTabs(
  stack: PanelStackState,
  fromIndex: number,
  toIndex: number,
): PanelStackState {
  if (fromIndex === toIndex) return stack
  const tabs = [...stack.tabs]
  const [moved] = tabs.splice(fromIndex, 1)
  if (moved == null) return stack
  tabs.splice(toIndex, 0, moved)
  return { ...stack, tabs }
}

export function setStackActiveTab(
  stack: PanelStackState,
  tab: DockPanelId,
): PanelStackState {
  if (!stack.tabs.includes(tab)) return stack
  return { ...stack, activeTab: tab }
}

function normalizeStack(stack: PanelStackState): PanelStackState | null {
  if (stack.tabs.length === 0) return null
  const activeTab = stack.tabs.includes(stack.activeTab)
    ? stack.activeTab
    : stack.tabs[0]!
  return { ...stack, activeTab }
}

function normalizeZone(stacks: PanelStackState[]): PanelStackState[] {
  return stacks
    .map(normalizeStack)
    .filter((s): s is PanelStackState => s != null)
}

export type PanelDockDropTarget =
  | { kind: 'new-stack'; zone: DockZoneId; stackIndex: number }
  | { kind: 'merge'; zone: DockZoneId; stackIndex: number }

function stackHasPrototype(stack: PanelStackState): boolean {
  return stack.tabs.includes('prototypeSettings')
}

/** Prototype settings stays in its own stack — not tabbed with Explorer / Properties. */
export function canMergePanelIntoStack(
  panelId: DockPanelId,
  destStack: PanelStackState | undefined,
): boolean {
  if (panelId === 'prototypeSettings') return false
  if (destStack != null && stackHasPrototype(destStack)) return false
  return true
}

/**
 * Undo accidental merges that hide Explorer / Properties behind Prototype settings tabs.
 */
export function normalizeRightDockLayout(layout: PanelDockLayoutState): PanelDockLayoutState {
  const needsSplit = layout.right.some(
    (stack) => stackHasPrototype(stack) && stack.tabs.length > 1,
  )
  if (!needsSplit) return layout

  const present = new Set<DockPanelId>()
  let explorerPropsStack: PanelStackState | null = null
  let protoActive = false

  for (const stack of layout.right) {
    for (const tab of stack.tabs) present.add(tab)
    if (stack.activeTab === 'prototypeSettings') protoActive = true
    if (
      stack.tabs.includes('explorer') &&
      stack.tabs.includes('properties') &&
      !stackHasPrototype(stack)
    ) {
      explorerPropsStack = stack
    }
  }

  const newRight: PanelStackState[] = []

  if (
    present.has('explorer') &&
    present.has('properties') &&
    explorerPropsStack != null
  ) {
    newRight.push({
      ...explorerPropsStack,
      tabs: explorerPropsStack.tabs.filter((t) => t !== 'prototypeSettings'),
    })
  } else {
    if (present.has('explorer')) {
      const stack = layout.right.find((s) => s.tabs.includes('explorer'))
      newRight.push(
        createPanelStack(
          ['explorer'],
          stack?.tabs.includes('explorer') && stack.activeTab === 'explorer'
            ? 'explorer'
            : 'explorer',
        ),
      )
    }
    if (present.has('properties')) {
      const stack = layout.right.find((s) => s.tabs.includes('properties'))
      newRight.push(
        createPanelStack(
          ['properties'],
          stack?.tabs.includes('properties') && stack.activeTab === 'properties'
            ? 'properties'
            : 'properties',
        ),
      )
    }
  }

  if (present.has('prototypeSettings')) {
    newRight.push(
      createPanelStack(['prototypeSettings'], protoActive ? 'prototypeSettings' : 'prototypeSettings'),
    )
  }

  return { ...layout, right: normalizeZone(newRight) }
}

export function movePanelInLayout(
  layout: PanelDockLayoutState,
  panelId: DockPanelId,
  target: PanelDockDropTarget,
): PanelDockLayoutState {
  const from = findPanelLocation(layout, panelId)
  if (from == null) return layout

  if (panelId === 'prototypeSettings' && target.kind === 'merge') {
    return layout
  }

  const next: PanelDockLayoutState = {
    right: layout.right.map((s) => ({ ...s, tabs: [...s.tabs] })),
    bottom: layout.bottom.map((s) => ({ ...s, tabs: [...s.tabs] })),
  }

  const sourceStacks = next[from.zone]
  const sourceStack = sourceStacks[from.stackIndex]!
  sourceStack.tabs.splice(from.tabIndex, 1)
  if (sourceStack.tabs.length > 0 && !sourceStack.tabs.includes(sourceStack.activeTab)) {
    sourceStack.activeTab = sourceStack.tabs[0]!
  }

  if (target.kind === 'merge') {
    const destStacks = next[target.zone]
    let destStack = destStacks[target.stackIndex]
    if (!canMergePanelIntoStack(panelId, destStack)) {
      return layout
    }
    if (destStack == null) {
      destStack = createPanelStack([panelId])
      destStacks[target.stackIndex] = destStack
    } else if (!destStack.tabs.includes(panelId)) {
      destStack.tabs.push(panelId)
      destStack.activeTab = panelId
    } else {
      destStack.activeTab = panelId
    }
  } else {
    const destStacks = next[target.zone]
    const insertIndex = Math.min(Math.max(0, target.stackIndex), destStacks.length)
    destStacks.splice(insertIndex, 0, createPanelStack([panelId]))
  }

  next.right = normalizeZone(next.right)
  next.bottom = normalizeZone(next.bottom)
  return normalizeRightDockLayout(next)
}

export function syncOutputPanelInLayout(
  layout: PanelDockLayoutState,
  outputPanelOpen: boolean,
): PanelDockLayoutState {
  const hasOutput = findPanelLocation(layout, 'output') != null
  if (outputPanelOpen === hasOutput) return layout

  if (!outputPanelOpen) {
    const next = {
      right: layout.right.map((s) => ({ ...s, tabs: [...s.tabs] })),
      bottom: layout.bottom.map((s) => ({ ...s, tabs: [...s.tabs] })),
    }
    for (const zone of ['right', 'bottom'] as const) {
      for (const stack of next[zone]) {
        const idx = stack.tabs.indexOf('output')
        if (idx >= 0) stack.tabs.splice(idx, 1)
        if (stack.tabs.length > 0 && !stack.tabs.includes(stack.activeTab)) {
          stack.activeTab = stack.tabs[0]!
        }
      }
      next[zone] = normalizeZone(next[zone])
    }
    return next
  }

  const bottomLoc =
    findFirstBottomPanelLocation(layout, ['output']) ??
    findFirstPlaceDockLocation(layout)
  if (bottomLoc == null) {
    return {
      ...layout,
      bottom: [...layout.bottom, createPanelStack(['output'], 'output')],
    }
  }

  const next = {
    right: layout.right.map((s) => ({ ...s, tabs: [...s.tabs] })),
    bottom: layout.bottom.map((s) => ({ ...s, tabs: [...s.tabs] })),
  }
  const stack = next.bottom[bottomLoc.stackIndex]!
  if (!stack.tabs.includes('output')) {
    const firstPlaceIdx = stack.tabs.findIndex((t) => isPlaceDockPanelId(t))
    const insertAt = firstPlaceIdx >= 0 ? firstPlaceIdx : stack.tabs.length
    stack.tabs.splice(insertAt, 0, 'output')
  }
  stack.activeTab = 'output'
  return next
}

function removePanelFromLayout(
  layout: PanelDockLayoutState,
  panelId: DockPanelId,
): PanelDockLayoutState {
  const next: PanelDockLayoutState = {
    right: layout.right.map((s) => ({ ...s, tabs: [...s.tabs] })),
    bottom: layout.bottom.map((s) => ({ ...s, tabs: [...s.tabs] })),
  }
  for (const zone of ['right', 'bottom'] as const) {
    for (const stack of next[zone]) {
      const idx = stack.tabs.indexOf(panelId)
      if (idx >= 0) stack.tabs.splice(idx, 1)
      if (stack.tabs.length > 0 && !stack.tabs.includes(stack.activeTab)) {
        stack.activeTab = stack.tabs[0]!
      }
    }
    next[zone] = normalizeZone(next[zone])
  }
  return next
}

/**
 * Asset Manager docks in the left rail when open, not the bottom dock.
 * Layout state only strips stale bottom-dock entries; visibility is driven by
 * `assetManagerPanelOpen` in StudioWindowsOS.
 */
export function syncAssetManagerPanelInLayout(
  layout: PanelDockLayoutState,
  assetManagerPanelOpen: boolean,
): PanelDockLayoutState {
  const loc = findPanelLocation(layout, 'assetManager')
  if (!assetManagerPanelOpen && loc == null) return layout
  if (loc?.zone === 'bottom') {
    return removePanelFromLayout(layout, 'assetManager')
  }
  return layout
}

function findFirstPlaceDockLocation(
  layout: PanelDockLayoutState,
): { zone: DockZoneId; stackIndex: number; tabIndex: number } | null {
  for (const zone of ['bottom', 'right'] as const) {
    const stacks = layout[zone]
    for (let stackIndex = 0; stackIndex < stacks.length; stackIndex++) {
      const tabIndex = stacks[stackIndex]!.tabs.findIndex((t) => isDocumentDockPanelId(t))
      if (tabIndex >= 0) return { zone, stackIndex, tabIndex }
    }
  }
  return null
}

function findFirstBottomPanelLocation(
  layout: PanelDockLayoutState,
  panelIds: readonly DockPanelId[],
): { zone: DockZoneId; stackIndex: number; tabIndex: number } | null {
  for (const panelId of panelIds) {
    const loc = findPanelLocation(layout, panelId)
    if (loc?.zone === 'bottom') return loc
  }
  return null
}

function cloneLayout(layout: PanelDockLayoutState): PanelDockLayoutState {
  return {
    right: layout.right.map((s) => ({ ...s, tabs: [...s.tabs] })),
    bottom: layout.bottom.map((s) => ({ ...s, tabs: [...s.tabs] })),
  }
}

export function syncPlaceDockPanelsInLayout(
  layout: PanelDockLayoutState,
  openPlaceIds: readonly string[],
  serverPlaceOrder: readonly string[],
): PanelDockLayoutState {
  const desiredPanelIds: PlaceDockPanelId[] = []
  for (const placeId of serverPlaceOrder) {
    if (openPlaceIds.includes(placeId)) desiredPanelIds.push(placeDockPanelId(placeId))
  }
  const desiredPanels = new Set(desiredPanelIds)

  let next = cloneLayout(layout)

  for (const zone of ['right', 'bottom'] as const) {
    for (const stack of next[zone]) {
      stack.tabs = stack.tabs.filter(
        (t) => !isPlaceDockPanelId(t) || desiredPanels.has(t),
      )
      if (stack.tabs.length > 0 && !stack.tabs.includes(stack.activeTab)) {
        stack.activeTab = stack.tabs[0]!
      }
    }
    next[zone] = normalizeZone(next[zone])
  }

  const missing = [...desiredPanels].filter(
    (panelId) => findPanelLocation(next, panelId) == null,
  )
  if (missing.length === 0) return next

  const outputLoc = findPanelLocation(next, 'output')
  const insertPanels = (stack: PanelStackState) => {
    for (const panelId of missing) {
      if (!stack.tabs.includes(panelId)) {
        const outputIdx = stack.tabs.indexOf('output')
        const insertAt = outputIdx >= 0 ? outputIdx + 1 : stack.tabs.length
        stack.tabs.splice(insertAt, 0, panelId)
      }
    }
    if (missing[0] != null) stack.activeTab = missing[missing.length - 1]!
  }

  if (outputLoc?.zone === 'bottom') {
    insertPanels(next.bottom[outputLoc.stackIndex]!)
    return next
  }

  if (next.bottom.length > 0) {
    insertPanels(next.bottom[0]!)
    return next
  }

  return {
    ...next,
    bottom: [createPanelStack(missing, missing[missing.length - 1]!)],
  }
}

/** Select a place document in the bottom dock (e.g. Lobby server / Level 1 on Play). */
export function focusBottomDockPlaceTab(
  layout: PanelDockLayoutState,
  placeId: string,
): PanelDockLayoutState {
  const tab = placeDockPanelId(placeId)
  return {
    ...layout,
    bottom: layout.bottom.map((stack) =>
      stack.tabs.includes(tab) ? { ...stack, activeTab: tab } : stack,
    ),
  }
}

/** Select an asset document in the bottom dock. */
export function focusBottomDockAssetTab(
  layout: PanelDockLayoutState,
  assetId: string,
): PanelDockLayoutState {
  const tab = assetDockPanelId(assetId)
  return {
    ...layout,
    bottom: layout.bottom.map((stack) =>
      stack.tabs.includes(tab) ? { ...stack, activeTab: tab } : stack,
    ),
  }
}

function findTargetBottomStackForNewDocument(
  stacks: readonly PanelStackState[],
): number {
  for (let i = 0; i < stacks.length; i++) {
    if (isDocumentDockPanelId(stacks[i]!.activeTab)) return i
  }
  for (let i = 0; i < stacks.length; i++) {
    if (stacks[i]!.tabs.some(isDocumentDockPanelId)) return i
  }
  return 0
}

/** Add an asset tab to the focused bottom document stack and select it. */
export function openAssetInFocusedBottomStack(
  layout: PanelDockLayoutState,
  assetId: string,
): PanelDockLayoutState {
  const tab = assetDockPanelId(assetId)
  let next = cloneLayout(layout)

  if (next.bottom.length === 0) {
    return { ...next, bottom: [createPanelStack([tab], tab)] }
  }

  const stackIndex = findTargetBottomStackForNewDocument(next.bottom)
  const stack = next.bottom[stackIndex]!
  if (!stack.tabs.includes(tab)) {
    const lastDocIdx = stack.tabs.reduce(
      (max, t, i) => (isDocumentDockPanelId(t) ? i : max),
      -1,
    )
    const insertAt = lastDocIdx >= 0 ? lastDocIdx + 1 : stack.tabs.length
    stack.tabs.splice(insertAt, 0, tab)
  }
  stack.activeTab = tab
  next.bottom[stackIndex] = stack
  return next
}

export function syncAssetDockPanelsInLayout(
  layout: PanelDockLayoutState,
  openAssetIds: readonly string[],
): PanelDockLayoutState {
  const desiredPanelIds = openAssetIds.map(assetDockPanelId)
  const desiredPanels = new Set(desiredPanelIds)

  let next = cloneLayout(layout)

  for (const zone of ['right', 'bottom'] as const) {
    for (const stack of next[zone]) {
      stack.tabs = stack.tabs.filter(
        (t) => !isAssetDockPanelId(t) || desiredPanels.has(t),
      )
      if (stack.tabs.length > 0 && !stack.tabs.includes(stack.activeTab)) {
        stack.activeTab = stack.tabs[0]!
      }
    }
    next[zone] = normalizeZone(next[zone])
  }

  const missing = desiredPanelIds.filter(
    (panelId) => findPanelLocation(next, panelId) == null,
  )
  if (missing.length === 0) return next

  return openAssetInFocusedBottomStack(
    {
      ...next,
      bottom: next.bottom.map((stack) => ({
        ...stack,
        tabs: [...stack.tabs],
      })),
    },
    assetIdFromDockPanel(missing[missing.length - 1]!),
  )
}

export function syncBottomPanelsInLayout(
  layout: PanelDockLayoutState,
  options: {
    outputPanelOpen: boolean
    assetManagerPanelOpen: boolean
    openPlaceDockPlaceIds: readonly string[]
    openAssetDockAssetIds: readonly string[]
    serverPlaceOrder: readonly string[]
  },
): PanelDockLayoutState {
  return syncAssetDockPanelsInLayout(
    syncPlaceDockPanelsInLayout(
      syncAssetManagerPanelInLayout(
        syncOutputPanelInLayout(layout, options.outputPanelOpen),
        options.assetManagerPanelOpen,
      ),
      options.openPlaceDockPlaceIds,
      options.serverPlaceOrder,
    ),
    options.openAssetDockAssetIds,
  )
}

export function layoutWithoutPanels(
  layout: PanelDockLayoutState,
  hidden: readonly DockPanelId[],
): PanelDockLayoutState {
  const hiddenSet = new Set(hidden)
  const filterStacks = (stacks: PanelStackState[]) =>
    normalizeZone(
      stacks.flatMap((stack) => {
        const tabs = stack.tabs.filter((t) => !hiddenSet.has(t))
        if (tabs.length === 0) return []
        const activeTab = tabs.includes(stack.activeTab) ? stack.activeTab : tabs[0]!
        return [{ ...stack, tabs, activeTab }]
      }),
    )

  return {
    right: filterStacks(layout.right),
    bottom: filterStacks(layout.bottom),
  }
}
