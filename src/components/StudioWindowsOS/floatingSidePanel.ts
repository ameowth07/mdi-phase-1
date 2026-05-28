export type FloatingSidePanelId = 'explorer' | 'properties'

export const FLOATING_SIDE_PANEL_LABELS: Record<FloatingSidePanelId, string> = {
  explorer: 'Explorer',
  properties: 'Properties',
}

export type FloatingPanelWindowState = {
  windowId: string
  tabs: FloatingSidePanelId[]
  activeTab: FloatingSidePanelId
  position: { left: number; top: number } | null
  /** Default anchor when `position` is null (0 = primary, 1 = offset below). */
  defaultSlot: number
}

let floatingWindowIdSeq = 0

export function newFloatingWindowId(): string {
  floatingWindowIdSeq += 1
  return `floating-window-${floatingWindowIdSeq}`
}

export function createFloatingWindow(
  tab: FloatingSidePanelId,
  defaultSlot: number,
): FloatingPanelWindowState {
  return {
    windowId: newFloatingWindowId(),
    tabs: [tab],
    activeTab: tab,
    position: null,
    defaultSlot,
  }
}

export function findFloatingWindowWithTab(
  windows: readonly FloatingPanelWindowState[],
  tab: FloatingSidePanelId,
): FloatingPanelWindowState | undefined {
  return windows.find((w) => w.tabs.includes(tab))
}

export function reorderFloatingSidePanelTabs(
  tabs: readonly FloatingSidePanelId[],
  fromIndex: number,
  toIndex: number,
): FloatingSidePanelId[] {
  if (fromIndex === toIndex) return [...tabs]
  const next = [...tabs]
  const [moved] = next.splice(fromIndex, 1)
  if (moved == null) return [...tabs]
  next.splice(toIndex, 0, moved)
  return next
}

export function removeFloatingSidePanelTab(
  tabs: readonly FloatingSidePanelId[],
  tab: FloatingSidePanelId,
): FloatingSidePanelId[] {
  return tabs.filter((t) => t !== tab)
}

export function mergeFloatingWindows(
  windows: readonly FloatingPanelWindowState[],
  sourceWindowId: string,
  targetWindowId: string,
  /** Tab to select on the merged window (typically the dragged panel). */
  mergedActiveTab?: FloatingSidePanelId,
): FloatingPanelWindowState[] {
  if (sourceWindowId === targetWindowId) return [...windows]
  const source = windows.find((w) => w.windowId === sourceWindowId)
  const target = windows.find((w) => w.windowId === targetWindowId)
  if (source == null || target == null) return [...windows]

  const mergedTabs = [...target.tabs]
  for (const tab of source.tabs) {
    if (!mergedTabs.includes(tab)) mergedTabs.push(tab)
  }
  const activeTab =
    mergedActiveTab != null && mergedTabs.includes(mergedActiveTab)
      ? mergedActiveTab
      : mergedTabs.includes(source.activeTab)
        ? source.activeTab
        : target.activeTab

  return windows
    .filter((w) => w.windowId !== sourceWindowId)
    .map((w) =>
      w.windowId === targetWindowId
        ? {
            ...w,
            tabs: mergedTabs,
            activeTab,
            position: w.position ?? target.position,
            defaultSlot: Math.min(w.defaultSlot, target.defaultSlot),
          }
        : w,
    )
}
