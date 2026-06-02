import {
  CAMERA_ZOOM_SCRIPT_TAB_LABEL,
  CAMERA_ZOOM_SCRIPT_TAB_PATH,
  CAMERA_ZOOM_SCRIPT_SOURCE,
  DEFAULT_CLIENT_SCRIPT_DOCUMENT,
  SERVER_SCRIPT_TAB_LABEL,
  SERVER_SCRIPT_TAB_PATH,
  type ClientScriptDocument,
} from '../clientScripts'
import type { MainDocumentEditorTab } from '../prototypeDefaults'
import type { EditIsolationTabId, SimDocumentStripTab } from '../documentTabClose'
import {
  placeClientDatamodelPrefix,
  placeRootPathTooltip,
  placeScriptPathTooltip,
  placeServerDatamodelPrefix,
} from './workspaceConfig'
import type { DocumentTabDescriptor, Place } from './types'

/** Asset-isolation path tooltips (asset label, not place name). */
export const TAB_PATHS = {
  droneAsset: 'Drone/Drone',
  droneHoverScript: 'Drone/HoverScript',
  bunnyDocument: 'Bunny/Bunny',
} as const

export type TabDescriptorRegistryOptions = {
  place: Place
  /** Main-strip isolation asset label (Phase 1 studio: `Drone`). */
  isolationAssetLabel?: string
  clientScriptDocument?: ClientScriptDocument
}

function mainLegacy(tab: MainDocumentEditorTab): DocumentTabDescriptor['legacyKey'] {
  return { type: 'main', tab }
}

function simLegacy(tab: SimDocumentStripTab): DocumentTabDescriptor['legacyKey'] {
  return { type: 'sim', tab }
}

function isolationLegacy(tab: EditIsolationTabId): DocumentTabDescriptor['legacyKey'] {
  return { type: 'isolation', tab }
}

/**
 * Full Phase 1 tab catalog for a place (open/closed filtering stays in UI state).
 * M1: registry only — render paths still use legacy switches.
 */
export function buildPhase1TabDescriptorCatalog(
  options: TabDescriptorRegistryOptions,
): DocumentTabDescriptor[] {
  const { place } = options
  const placeId = place.id
  const placeName = place.displayName
  const isolationLabel = options.isolationAssetLabel ?? 'Drone'
  const clientScript = options.clientScriptDocument ?? DEFAULT_CLIENT_SCRIPT_DOCUMENT

  const mainStrip: DocumentTabDescriptor[] = [
    {
      id: `${placeId}:place-root`,
      label: placeName,
      strip: 'main',
      kind: 'place-root',
      pathTooltip: placeRootPathTooltip(place),
      closable: false,
      content: 'main-viewport',
      datamodel: 'drone',
      placeId,
      legacyKey: mainLegacy('droneRacer'),
    },
    {
      id: `${placeId}:script-a`,
      label: 'Script',
      strip: 'main',
      kind: 'place-script',
      pathTooltip: placeScriptPathTooltip(placeName),
      closable: true,
      content: 'script-editor',
      datamodel: 'drone',
      placeId,
      legacyKey: mainLegacy('scriptA'),
    },
    {
      id: `${placeId}:script-b`,
      label: 'Script',
      strip: 'main',
      kind: 'place-script',
      pathTooltip: placeScriptPathTooltip(placeName),
      closable: true,
      content: 'script-editor',
      datamodel: 'drone',
      placeId,
      legacyKey: mainLegacy('scriptB'),
    },
    {
      id: `${placeId}:client-script`,
      label: clientScript.tabLabel,
      strip: 'main',
      kind: 'client-script',
      pathTooltip: clientScript.tabPath,
      closable: true,
      content: 'script-editor',
      datamodel: 'client',
      placeId,
      legacyKey: mainLegacy('clientScript'),
    },
    {
      id: `${placeId}:server-script`,
      label: SERVER_SCRIPT_TAB_LABEL,
      strip: 'main',
      kind: 'server-script',
      pathTooltip: SERVER_SCRIPT_TAB_PATH,
      closable: true,
      content: 'script-editor',
      datamodel: 'server',
      placeId,
      legacyKey: mainLegacy('serverScript'),
    },
  ]

  const isolationStrip: DocumentTabDescriptor[] = [
    {
      id: `${placeId}:isolated-asset`,
      label: isolationLabel,
      strip: 'isolation',
      kind: 'isolated-asset',
      pathTooltip: TAB_PATHS.droneAsset,
      closable: true,
      content: 'isolation-preview',
      datamodel: 'drone',
      placeId,
      legacyKey: isolationLegacy('isolation'),
    },
    {
      id: `${placeId}:isolated-hover-script`,
      label: 'HoverScript',
      strip: 'isolation',
      kind: 'isolated-script',
      pathTooltip: TAB_PATHS.droneHoverScript,
      closable: true,
      content: 'hover-script',
      datamodel: 'drone',
      placeId,
      legacyKey: isolationLegacy('hoverScript'),
    },
  ]

  const simStrip: DocumentTabDescriptor[] = [
    {
      id: `${placeId}:sim-client`,
      label: 'Client',
      strip: 'main',
      kind: 'sim-client',
      pathTooltip: placeClientDatamodelPrefix(placeName),
      closable: true,
      content: 'client-sim',
      datamodel: 'client',
      placeId,
      legacyKey: simLegacy('client'),
    },
    {
      id: `${placeId}:sim-server`,
      label: 'Server',
      strip: 'main',
      kind: 'sim-server',
      pathTooltip: placeServerDatamodelPrefix(placeName),
      closable: true,
      content: 'server-sim',
      datamodel: 'server',
      placeId,
      legacyKey: simLegacy('server'),
    },
    {
      id: `${placeId}:sim-script-a`,
      label: 'Script',
      strip: 'main',
      kind: 'place-script',
      pathTooltip: placeScriptPathTooltip(placeName),
      closable: true,
      content: 'script-editor',
      datamodel: 'drone',
      placeId,
      legacyKey: simLegacy('scriptA'),
    },
    {
      id: `${placeId}:sim-script-b`,
      label: 'Script',
      strip: 'main',
      kind: 'place-script',
      pathTooltip: placeScriptPathTooltip(placeName),
      closable: true,
      content: 'script-editor',
      datamodel: 'drone',
      placeId,
      legacyKey: simLegacy('scriptB'),
    },
    {
      id: `${placeId}:sim-client-script`,
      label: clientScript.tabLabel,
      strip: 'main',
      kind: 'client-script',
      pathTooltip: clientScript.tabPath,
      closable: true,
      content: 'script-editor',
      datamodel: 'client',
      placeId,
      legacyKey: simLegacy('clientScript'),
    },
    {
      id: `${placeId}:sim-server-script`,
      label: SERVER_SCRIPT_TAB_LABEL,
      strip: 'main',
      kind: 'server-script',
      pathTooltip: SERVER_SCRIPT_TAB_PATH,
      closable: true,
      content: 'script-editor',
      datamodel: 'server',
      placeId,
      legacyKey: simLegacy('serverScript'),
    },
  ]

  return [...mainStrip, ...isolationStrip, ...simStrip]
}

export function descriptorForMainTab(
  catalog: DocumentTabDescriptor[],
  tab: MainDocumentEditorTab,
): DocumentTabDescriptor | undefined {
  return catalog.find(
    (d) => d.legacyKey?.type === 'main' && d.legacyKey.tab === tab,
  )
}

export function descriptorForSimTab(
  catalog: DocumentTabDescriptor[],
  tab: SimDocumentStripTab,
): DocumentTabDescriptor | undefined {
  return catalog.find((d) => d.legacyKey?.type === 'sim' && d.legacyKey.tab === tab)
}

export function descriptorForIsolationTab(
  catalog: DocumentTabDescriptor[],
  tab: EditIsolationTabId,
): DocumentTabDescriptor | undefined {
  return catalog.find(
    (d) => d.legacyKey?.type === 'isolation' && d.legacyKey.tab === tab,
  )
}

/** Alternate client-script preset used by Interaction settings. */
export function cameraZoomClientScriptDocument(): ClientScriptDocument {
  return {
    tabLabel: CAMERA_ZOOM_SCRIPT_TAB_LABEL,
    tabPath: CAMERA_ZOOM_SCRIPT_TAB_PATH,
    source: CAMERA_ZOOM_SCRIPT_SOURCE,
  }
}
