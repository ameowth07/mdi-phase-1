import type { Level1ExplorerDisplayNode } from './level1ExplorerData'

export type DroneRacerExplorerNodeDef = {
  id: string
  label: string
  parentId: string | null
  chevron: 'open' | 'closed' | 'spacer'
  className: string
}

/** Drone Racer default Explorer hierarchy — shop subtree uses Model icons. */
const DRONE_RACER_EXPLORER_NODE_DEFS: readonly DroneRacerExplorerNodeDef[] = [
  { id: 'workspace', label: 'Workspace', parentId: null, chevron: 'open', className: 'Workspace' },
  { id: 'camera', label: 'Camera', parentId: 'workspace', chevron: 'spacer', className: 'Camera' },
  { id: 'terrain', label: 'Terrain', parentId: 'workspace', chevron: 'spacer', className: 'Terrain' },
  { id: 'billboard', label: 'Billboard', parentId: 'workspace', chevron: 'closed', className: 'BillboardGui' },
  { id: 'spawn-pad', label: 'SpawnPad', parentId: 'workspace', chevron: 'spacer', className: 'Part' },
  { id: 'finish-gate', label: 'FinishGate', parentId: 'workspace', chevron: 'spacer', className: 'Part' },
  { id: 'track-mesh', label: 'TrackMesh', parentId: 'workspace', chevron: 'closed', className: 'SpecialMesh' },
  { id: 'shop', label: 'Shop', parentId: 'workspace', chevron: 'open', className: 'Model' },
  { id: 'shopkeeper', label: 'Shopkeeper', parentId: 'shop', chevron: 'closed', className: 'Model' },
  { id: 'counter', label: 'Counter', parentId: 'shop', chevron: 'closed', className: 'Model' },
  { id: 'shelves', label: 'Shelves', parentId: 'shop', chevron: 'closed', className: 'Model' },
  { id: 'register', label: 'Register', parentId: 'shop', chevron: 'closed', className: 'Model' },
  { id: 'door', label: 'Door', parentId: 'shop', chevron: 'closed', className: 'Model' },
  { id: 'door-weld', label: 'DoorWeld', parentId: 'shop', chevron: 'spacer', className: 'Weld' },
  { id: 'shop-sign', label: 'OpenSign', parentId: 'shop', chevron: 'spacer', className: 'TextLabel' },
  { id: 'shop-open-flag', label: 'IsOpen', parentId: 'shop', chevron: 'spacer', className: 'BoolValue' },
  { id: 'starter-gui', label: 'StarterGui', parentId: 'workspace', chevron: 'open', className: 'StarterGui' },
  { id: 'race-hud', label: 'RaceHUD', parentId: 'starter-gui', chevron: 'open', className: 'Frame' },
  { id: 'timer-label', label: 'TimerLabel', parentId: 'race-hud', chevron: 'spacer', className: 'TextLabel' },
  { id: 'start-button', label: 'StartButton', parentId: 'race-hud', chevron: 'spacer', className: 'TextButton' },
  { id: 'server-script', label: 'RaceServer', parentId: 'workspace', chevron: 'closed', className: 'Script' },
  { id: 'module-handler', label: 'RaceModule', parentId: 'workspace', chevron: 'closed', className: 'ModuleScript' },
  { id: 'local-controller', label: 'InputController', parentId: 'workspace', chevron: 'closed', className: 'LocalScript' },
  { id: 'replicated-storage', label: 'ReplicatedStorage', parentId: 'workspace', chevron: 'closed', className: 'Folder' },
  { id: 'players', label: 'Players', parentId: 'workspace', chevron: 'spacer', className: 'Players' },
  { id: 'lighting', label: 'Lighting', parentId: 'workspace', chevron: 'closed', className: 'Lighting' },
  { id: 'materialservice', label: 'MaterialService', parentId: 'workspace', chevron: 'closed', className: 'MaterialService' },
]

function depthForNode(
  id: string,
  parentById: Record<string, string | null>,
): number {
  let depth = 0
  let current: string | null = id
  while (current != null) {
    const parent: string | null = parentById[current] ?? null
    if (parent == null) break
    depth += 1
    current = parent
  }
  return depth
}

export type DroneRacerExplorerTreeData = {
  parentMap: Record<string, string | null>
  rowMeta: Record<string, { label: string; className: string }>
  rows: readonly string[]
  display: readonly Level1ExplorerDisplayNode[]
}

export function buildDroneRacerExplorerTree(): DroneRacerExplorerTreeData {
  const parentMap: Record<string, string | null> = {}
  const rowMeta: Record<string, { label: string; className: string }> = {}
  const rows: string[] = []
  const display: Level1ExplorerDisplayNode[] = []

  for (const node of DRONE_RACER_EXPLORER_NODE_DEFS) {
    parentMap[node.id] = node.parentId
    rowMeta[node.id] = { label: node.label, className: node.className }
    rows.push(node.id)
  }

  for (const node of DRONE_RACER_EXPLORER_NODE_DEFS) {
    display.push({
      id: node.id,
      label: node.label,
      depth: depthForNode(node.id, parentMap),
      chevron: node.chevron,
      className: node.className,
    })
  }

  return { parentMap, rowMeta, rows, display }
}

export const DRONE_RACER_EXPLORER_TREE = buildDroneRacerExplorerTree()

export const DRONE_RACER_EXPLORER_ROWS = DRONE_RACER_EXPLORER_TREE.rows
