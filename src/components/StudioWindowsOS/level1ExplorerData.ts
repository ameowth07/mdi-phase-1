export type Level1ExplorerRowMeta = { label: string; className: string }

export type Level1ExplorerDisplayNode = {
  id: string
  label: string
  depth: number
  chevron: 'open' | 'closed' | 'spacer'
  className: string
}

export type Level1ExplorerTreeData = {
  parentMap: Record<string, string | null>
  rowMeta: Record<string, Level1ExplorerRowMeta>
  rows: readonly string[]
  display: readonly Level1ExplorerDisplayNode[]
}

const LEVEL1_EXTRA_ITEMS: readonly { label: string; className: string }[] = [
  { label: 'SpawnPad', className: 'Part' },
  { label: 'FinishGate', className: 'Part' },
  { label: 'MovingPlatform', className: 'Model' },
  { label: 'LaserGrid', className: 'Model' },
  { label: 'CheckpointSign', className: 'TextLabel' },
  { label: 'RaceModule', className: 'ModuleScript' },
  { label: 'InputController', className: 'LocalScript' },
  { label: 'TrackMesh', className: 'SpecialMesh' },
  { label: 'BoostPad', className: 'Part' },
  { label: 'GateSensor', className: 'BoolValue' },
  { label: 'TrackWeld', className: 'Weld' },
  { label: 'SecretRoom', className: 'Model' },
]

function slugId(label: string): string {
  return `l1-${label.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

/** Random Level 1 hierarchy — always Workspace, Camera, Terrain at the top. */
export function generateLevel1ExplorerTree(): Level1ExplorerTreeData {
  const parentMap: Record<string, string | null> = {
    'l1-workspace': null,
    'l1-camera': 'l1-workspace',
    'l1-terrain': 'l1-workspace',
  }
  const rowMeta: Record<string, Level1ExplorerRowMeta> = {
    'l1-workspace': { label: 'Workspace', className: 'Workspace' },
    'l1-camera': { label: 'Camera', className: 'Camera' },
    'l1-terrain': { label: 'Terrain', className: 'Terrain' },
  }
  const rows: string[] = ['l1-workspace', 'l1-camera', 'l1-terrain']
  const display: Level1ExplorerDisplayNode[] = [
    {
      id: 'l1-workspace',
      label: 'Workspace',
      depth: 0,
      chevron: 'open',
      className: 'Workspace',
    },
    {
      id: 'l1-camera',
      label: 'Camera',
      depth: 1,
      chevron: 'spacer',
      className: 'Camera',
    },
    {
      id: 'l1-terrain',
      label: 'Terrain',
      depth: 1,
      chevron: 'spacer',
      className: 'Terrain',
    },
  ]

  const extraCount = 5 + Math.floor(Math.random() * 4)
  const extras = shuffle(LEVEL1_EXTRA_ITEMS).slice(0, extraCount)

  for (let i = 0; i < extras.length; i++) {
    const { label, className } = extras[i]!
    const id = slugId(label)
    parentMap[id] = 'l1-workspace'
    rowMeta[id] = { label, className }
    rows.push(id)
    display.push({
      id,
      label,
      depth: 1,
      chevron: i % 3 === 0 ? 'closed' : 'spacer',
      className,
    })
  }

  return { parentMap, rowMeta, rows, display }
}
