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
  explorerNoBadge: false,
  explorerFocusBadge: false,
  explorerBadgeShowIndicator: false,
  explorerOriginalDmBadge: false,
  explorerShowBreadcrumb: true,
  playModeFullTint: false,
  playModeSelectionTint: true,
  playModeFooterTint: true,
  playModeSplitView: false,
  showAssetInIsolation: true,
  editDatamodelShowStroke: false,
  hideAssetTinting: true,
  editWorkspaceDocumentFocus: 'main' as EditDocumentFocus,
  panelTitlesLeftAligned: true,
  propertiesShowBreadcrumb: true,
  mainDocumentEditorTab: 'droneRacer' as MainDocumentEditorTab,
  splitClientDocumentTab: 'droneRacer' as MainDocumentEditorTab,
  splitServerDocumentTab: 'droneRacer' as MainDocumentEditorTab,
  scriptATabOpen: true,
  scriptBTabOpen: true,
  clientScriptTabOpen: false,
  serverScriptTabOpen: false,
  isolationTabOpen: true,
  hoverScriptTabOpen: true,
} as const

export type PrototypeSettingsDefaults = typeof PROTOTYPE_SETTINGS_DEFAULTS
