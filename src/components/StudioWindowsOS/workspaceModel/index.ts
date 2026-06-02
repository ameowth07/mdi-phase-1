export type {
  DatamodelChrome,
  DocumentTabContent,
  DocumentTabDescriptor,
  DocumentTabKind,
  Game,
  Place,
  ResolvedWorkspace,
  StudioFrameVariant,
  TabStripId,
} from './types'

export {
  bunnyGame,
  droneRacerGame,
  placeById,
  placeClientDatamodelPrefix,
  placeRootPathTooltip,
  placeScriptPathTooltip,
  placeServerDatamodelPrefix,
  placeServerRootPathTooltip,
  placeTestDatamodelRole,
  simClientTabLabel,
  simClientTabPathTooltip,
  simServerTabLabel,
  simServerTabPathTooltip,
  resolveWorkspace,
} from './workspaceConfig'

export {
  TAB_PATHS,
  buildPhase1TabDescriptorCatalog,
  cameraZoomClientScriptDocument,
  descriptorForIsolationTab,
  descriptorForMainTab,
  descriptorForSimTab,
  type TabDescriptorRegistryOptions,
} from './tabDescriptorRegistry'
