export type EditDocumentFocus = 'main' | 'isolation' | 'hoverScript'

export type MainDocumentEditorTab =
  | 'droneRacer'
  | 'scriptA'
  | 'scriptB'
  | 'clientScript'
  | 'serverScript'

export type SimViewportFocus = 'client' | 'server'

/** Current prototype defaults — Reset restores these values. */
export const PROTOTYPE_SETTINGS_DEFAULTS = {
  clientSimActive: false,
  simViewportFocus: 'client' as SimViewportFocus,
  playModeHasStroke: true,
  playModeHasFocusStroke: false,
  playModeTabStroke: true,
  playModeTabStrokeAllEdges: false,
  playModeTabStrokeConnected: false,
  explorerNoBadge: false,
  explorerFocusBadge: false,
  explorerBadgeShowIndicator: false,
  explorerOriginalDmBadge: false,
  explorerShowBreadcrumb: true,
  /** Shorten in-window breadcrumbs; full workspace path when Properties is floating. */
  showFullBreadcrumbWhenDetached: true,
  playModeFullTint: false,
  playModeSelectionTint: false,
  playModeFooterTint: true,
  playModeTabTint: false,
  playModeSplitView: false,
  showAssetInIsolation: true,
  editDatamodelShowStroke: false,
  hideAssetTinting: true,
  editWorkspaceDocumentFocus: 'main' as EditDocumentFocus,
  panelTitlesLeftAligned: true,
  floatingPropertiesOpen: false,
  floatingExplorerOpen: false,
  floatingDocumentOpen: false,
  mainDocumentEditorTab: 'droneRacer' as MainDocumentEditorTab,
  splitClientDocumentTab: 'droneRacer' as MainDocumentEditorTab,
  splitServerDocumentTab: 'droneRacer' as MainDocumentEditorTab,
  scriptATabOpen: true,
  scriptBTabOpen: true,
  clientScriptTabOpen: false,
  serverScriptTabOpen: false,
  simClientTabOpen: true,
  /** Lobby Server tab in the main test document strip (next to Client). */
  simServerTabOpen: true,
  /** Ribbon Client/Server toggle reopens closed datamodel tabs when switching focus. */
  toggleOpensDmIfClosed: true,
  /** After test, joined place server views open as bottom-dock place documents in edit. */
  serversPersistIntoEdit: true,
  /** Test Server tab label is the place name (`Lobby`) instead of `Server`. */
  serverTabUsesPlaceName: true,
  /** Test Client tab label is `Client / {place}` instead of `Client`. */
  clientTabUsesPlaceName: false,
  isolationTabOpen: true,
  hoverScriptTabOpen: true,
  /** Asset Manager Open → dock as a bottom document tab instead of a floating window. */
  openAssetAsDockedDocument: true,
} as const

export type PrototypeSettingsDefaults = typeof PROTOTYPE_SETTINGS_DEFAULTS
