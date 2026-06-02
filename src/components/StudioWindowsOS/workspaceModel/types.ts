import type { MainDocumentEditorTab } from '../prototypeDefaults'
import type { EditIsolationTabId, SimDocumentStripTab } from '../documentTabClose'

export type StudioFrameVariant = 'studio' | 'bunny'

/** Window chrome — shown in app bar `<h1>`. */
export type Game = {
  id: string
  displayName: string
  places: Place[]
  defaultPlaceId: string
}

/** One place inside a game (main viewport + related documents). */
export type Place = {
  id: string
  displayName: string
  /** Existing Phase 1 main-document tab id for this place's root viewport. */
  rootTabId: MainDocumentEditorTab
  /** When true, place document lives only in a dock panel (not the main tab strip). */
  dockOnly?: boolean
}

export type TabStripId = 'main' | 'isolation' | 'floating'

export type DatamodelChrome = 'drone' | 'client' | 'server'

export type DocumentTabKind =
  | 'place-root'
  | 'place-script'
  | 'sim-client'
  | 'sim-server'
  | 'sim-client-instance'
  | 'client-script'
  | 'server-script'
  | 'isolated-asset'
  | 'isolated-script'

export type DocumentTabContent =
  | 'main-viewport'
  | 'script-editor'
  | 'isolation-preview'
  | 'hover-script'
  | 'client-sim'
  | 'server-sim'

/**
 * Phase 2 unified tab row entry. Legacy ids stay on `legacyKey` until render
 * paths read descriptors directly.
 */
export type DocumentTabDescriptor = {
  id: string
  label: string
  strip: TabStripId
  kind: DocumentTabKind
  pathTooltip: string
  closable: boolean
  content: DocumentTabContent
  datamodel?: DatamodelChrome
  placeId?: string
  legacyKey?:
    | { type: 'main'; tab: MainDocumentEditorTab }
    | { type: 'sim'; tab: SimDocumentStripTab }
    | { type: 'isolation'; tab: EditIsolationTabId }
}

export type ResolvedWorkspace = {
  game: Game
  defaultPlace: Place
}
