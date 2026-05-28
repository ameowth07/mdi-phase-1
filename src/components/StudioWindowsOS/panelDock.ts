export type DockPanelId =
  | 'explorer'
  | 'properties'
  | 'prototypeSettings'
  | 'output'
  | 'assetManager'

export type DockZoneId = 'right' | 'bottom'

export const PANEL_DOCK_LABELS: Record<DockPanelId, string> = {
  explorer: 'Explorer',
  properties: 'Properties',
  prototypeSettings: 'Prototype settings',
  output: 'Output',
  assetManager: 'Asset Manager',
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

  const bottomTabs: DockPanelId[] = options.outputPanelOpen
    ? ['output', 'assetManager']
    : ['assetManager']

  return {
    right,
    bottom: [createPanelStack(bottomTabs, bottomTabs[0]!)],
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

  const bottomLoc = findPanelLocation(layout, 'assetManager')
  if (bottomLoc == null) {
    return {
      ...layout,
      bottom: [...layout.bottom, createPanelStack(['output', 'assetManager'], 'output')],
    }
  }

  const next = {
    right: layout.right.map((s) => ({ ...s, tabs: [...s.tabs] })),
    bottom: layout.bottom.map((s) => ({ ...s, tabs: [...s.tabs] })),
  }
  const stack = next.bottom[bottomLoc.stackIndex]!
  if (!stack.tabs.includes('output')) {
    const assetIdx = stack.tabs.indexOf('assetManager')
    const insertAt = assetIdx >= 0 ? assetIdx : stack.tabs.length
    stack.tabs.splice(insertAt, 0, 'output')
  }
  stack.activeTab = 'output'
  return next
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
