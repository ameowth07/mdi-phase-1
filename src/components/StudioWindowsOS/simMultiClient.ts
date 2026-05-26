import type {
  MainScriptTabId,
  SimClientInstanceId,
  SimDocumentStripTab,
} from './documentTabClose'

export type { SimClientInstanceId } from './documentTabClose'

export function isSimClientInstanceId(tab: string): tab is SimClientInstanceId {
  return /^client-\d+$/.test(tab)
}

export function simClientInstanceId(index: number): SimClientInstanceId {
  return `client-${index}` as SimClientInstanceId
}

export function parseSimClientInstanceIndex(tab: SimClientInstanceId): number {
  return Number.parseInt(tab.slice('client-'.length), 10)
}

export function simClientInstanceLabel(index: number): string {
  return `Client ${index}`
}

export function isSimClientStripTab(tab: SimDocumentStripTab): boolean {
  return tab === 'client' || isSimClientInstanceId(tab)
}

export function clientInstanceIndexFromStripTab(
  tab: SimDocumentStripTab,
): number | null {
  if (tab === 'client') return 1
  if (isSimClientInstanceId(tab)) return parseSimClientInstanceIndex(tab)
  return null
}

export type SimClientExplorerRow = {
  id: string
  label: string
  icon: string
  iconColor?: string
}

/** Distinct flat Explorer trees per client instance (cycles when n > variants). */
const CLIENT_EXPLORER_TREE_VARIANTS: readonly (readonly SimClientExplorerRow[])[] = [
  [
    { id: 'workspace', label: 'Workspace', icon: '●', iconColor: '#4a9eff' },
    { id: 'players', label: 'Players', icon: '☺', iconColor: '#e8944a' },
    { id: 'lighting', label: 'Lighting', icon: '💡' },
    { id: 'materialservice', label: 'MaterialService', icon: '⌗' },
  ],
  [
    { id: 'c2-replicated', label: 'ReplicatedStorage', icon: '◆', iconColor: '#4a9eff' },
    { id: 'c2-starter', label: 'StarterPlayer', icon: '☺', iconColor: '#c084fc' },
    { id: 'c2-startergui', label: 'StarterGui', icon: '▣', iconColor: '#f472b6' },
    { id: 'c2-sound', label: 'SoundService', icon: '♪' },
  ],
  [
    { id: 'c3-workspace', label: 'Workspace', icon: '●', iconColor: '#38bdf8' },
    { id: 'c3-characters', label: 'Characters', icon: '◎', iconColor: '#fbbf24' },
    { id: 'c3-replicatedfirst', label: 'ReplicatedFirst', icon: '◇', iconColor: '#a78bfa' },
    { id: 'c3-text', label: 'TextChatService', icon: '💬' },
  ],
  [
    { id: 'c4-workspace', label: 'Workspace', icon: '●', iconColor: '#22d3ee' },
    { id: 'c4-players', label: 'Players', icon: '☺', iconColor: '#fb923c' },
    { id: 'c4-pathfinding', label: 'PathfindingService', icon: '⬡' },
    { id: 'c4-localization', label: 'LocalizationService', icon: 'Aa' },
  ],
] as const

export function explorerTreeForClientInstance(clientIndex: number): SimClientExplorerRow[] {
  const variant = CLIENT_EXPLORER_TREE_VARIANTS[(clientIndex - 1) % CLIENT_EXPLORER_TREE_VARIANTS.length]!
  return [...variant]
}

/** First row id per client — used when spawning Server & Clients play sessions. */
export function buildInitialExplorerSelectionByClient(
  clientCount: number,
): Record<number, string> {
  const result: Record<number, string> = {}
  for (let i = 1; i <= clientCount; i++) {
    const first = explorerTreeForClientInstance(i)[0]
    if (first) result[i] = first.id
  }
  return result
}

/** Re-open a closed `client-n` tab in canonical multi-client strip order. */
export function insertClientInstanceTabInOrder(
  order: readonly SimDocumentStripTab[],
  tab: SimClientInstanceId,
  clientCount: number,
): SimDocumentStripTab[] {
  const without = order.filter((t) => t !== tab)
  const clientTabs: SimClientInstanceId[] = []
  for (let i = 1; i <= clientCount; i++) {
    const id = simClientInstanceId(i)
    if (id === tab || without.includes(id)) clientTabs.push(id)
  }
  const tail = without.filter((t) => !isSimClientInstanceId(t))
  return [...clientTabs, ...tail]
}

export function buildMultiClientSimDocumentTabOrder(
  clientCount: number,
  open: {
    server: boolean
    scriptA: boolean
    scriptB: boolean
    clientScript: boolean
    serverScript: boolean
  },
  scriptOrder: readonly MainScriptTabId[],
): SimDocumentStripTab[] {
  const tabs: SimDocumentStripTab[] = []
  for (let i = 1; i <= clientCount; i++) {
    tabs.push(simClientInstanceId(i))
  }
  if (open.server) tabs.push('server')
  for (const id of scriptOrder) {
    if (open[id]) tabs.push(id)
  }
  return tabs
}
