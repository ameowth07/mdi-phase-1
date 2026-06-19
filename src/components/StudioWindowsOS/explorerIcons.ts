import { publicAssetUrl } from '../../publicAssetUrl'
import type { StudioColorTheme } from './themeColorOperators'

/** Figma Studio Surface Colors — Explorer icon sets 1241:108643 + 1243:108911. */
export const EXPLORER_ICON_TYPES = [
  'Script',
  'LocalScript',
  'ModuleScript',
  'RobloxPluginGuiService',
  'PluginGuiService',
  'ViewportFrame',
  'ScreenGui',
  'Frame',
  'ScrollingFrame',
  'TextLabel',
  'TextButton',
  'BlockMesh',
  'TextBox',
  'CharacterMesh',
  'ImageButton',
  'SpecialMesh',
  'ImageLabel',
  'Workspace',
  'Camera',
  'Terrain',
  'Players',
  'Model',
  'PartBlock',
  'Weld',
  'BoolValue',
] as const

export type ExplorerIconType = (typeof EXPLORER_ICON_TYPES)[number]

const ROW_ID_ICON: Record<string, ExplorerIconType> = {
  workspace: 'Workspace',
  'l1-workspace': 'Workspace',
  'c3-workspace': 'Workspace',
  'c4-workspace': 'Workspace',
  camera: 'Camera',
  'l1-camera': 'Camera',
  terrain: 'Terrain',
  'l1-terrain': 'Terrain',
  players: 'Players',
  'c4-players': 'Players',
  billboard: 'ImageLabel',
  'spawn-pad': 'PartBlock',
  'finish-gate': 'PartBlock',
  'track-mesh': 'SpecialMesh',
  shop: 'Model',
  shopkeeper: 'Model',
  counter: 'Model',
  shelves: 'Model',
  register: 'Model',
  door: 'Model',
  'door-weld': 'Weld',
  'shop-sign': 'TextLabel',
  'shop-open-flag': 'BoolValue',
  'starter-gui': 'ScreenGui',
  'race-hud': 'Frame',
  'timer-label': 'TextLabel',
  'start-button': 'TextButton',
  'server-script': 'Script',
  'module-handler': 'ModuleScript',
  'local-controller': 'LocalScript',
  'replicated-storage': 'Frame',
  lighting: 'PluginGuiService',
  materialservice: 'PluginGuiService',
  'c2-replicated': 'Frame',
  'c2-starter': 'CharacterMesh',
  'c2-startergui': 'ScreenGui',
  'c2-sound': 'PluginGuiService',
  'c3-characters': 'CharacterMesh',
  'c3-replicatedfirst': 'Script',
  'c3-text': 'TextLabel',
  'c4-pathfinding': 'PluginGuiService',
  'c4-localization': 'TextLabel',
  bunnyExplorerRow: 'Model',
  'drone-isolation-root': 'Model',
  'drone-isolation-hover-script': 'Script',
  'drone-isolation-frame': 'Frame',
  'drone-isolation-rotor-a': 'SpecialMesh',
  'drone-isolation-rotor-b': 'SpecialMesh',
  'drone-isolation-sensor': 'PartBlock',
}

const CLASS_NAME_ICON: Record<string, ExplorerIconType> = {
  Script: 'Script',
  LocalScript: 'LocalScript',
  ModuleScript: 'ModuleScript',
  Folder: 'Frame',
  StarterPlayer: 'CharacterMesh',
  StarterGui: 'ScreenGui',
  SoundService: 'PluginGuiService',
  ReplicatedFirst: 'Script',
  TextChatService: 'TextLabel',
  PathfindingService: 'PluginGuiService',
  LocalizationService: 'TextLabel',
  Players: 'Players',
  Model: 'Model',
  Part: 'PartBlock',
  Weld: 'Weld',
  BoolValue: 'BoolValue',
  Frame: 'Frame',
  TextLabel: 'TextLabel',
  TextButton: 'TextButton',
  SpecialMesh: 'SpecialMesh',
  BlockMesh: 'BlockMesh',
  Workspace: 'Workspace',
  Camera: 'Camera',
  Terrain: 'Terrain',
  BillboardGui: 'ImageLabel',
  Lighting: 'PluginGuiService',
  MaterialService: 'PluginGuiService',
}

const LABEL_ICON: Record<string, ExplorerIconType> = {
  Frame: 'Frame',
  HoverScript: 'Script',
  Workspace: 'Workspace',
  Camera: 'Camera',
  Terrain: 'Terrain',
  Players: 'Players',
  ReplicatedStorage: 'Frame',
  StarterGui: 'ScreenGui',
  SoundService: 'PluginGuiService',
  TextChatService: 'TextLabel',
  Characters: 'CharacterMesh',
}

/** Map an Explorer row to the closest Figma icon type. */
export function resolveExplorerIconType(
  rowId: string,
  label: string,
  className = 'Model',
): ExplorerIconType {
  if (ROW_ID_ICON[rowId]) return ROW_ID_ICON[rowId]
  if (LABEL_ICON[label]) return LABEL_ICON[label]
  if (CLASS_NAME_ICON[className]) return CLASS_NAME_ICON[className]
  return 'Model'
}

export function explorerIconAssetUrl(
  iconType: ExplorerIconType,
  theme: StudioColorTheme,
): string {
  const variant = theme === 'light' ? 'light' : 'dark'
  return publicAssetUrl(`assets/explorer-icons/${iconType}-${variant}.svg`)
}
