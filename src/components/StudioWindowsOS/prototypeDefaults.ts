export type EditDocumentFocus = 'main' | 'isolation' | 'hoverScript'

import type { ToolSelectionColor } from './toolSelectionColor'
import type { RibbonIconSize } from './ribbonIconSize'
import type { UiScale } from './uiScale'

export type { ToolSelectionColor, UiScale }

export type MainDocumentEditorTab =
  | 'droneRacer'
  | 'scriptA'
  | 'scriptB'
  | 'clientScript'
  | 'serverScript'

export type SimViewportFocus = 'client' | 'server'

export type StudioColorTheme = 'dark' | 'light'

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
  /** When on, Client / Server / Drone hues follow theme color operators. */
  linkSemanticColors: false,
  /** When link is on, semantics follow hue only (not sat / lightness / contrast). */
  linkSemanticHueOnly: true,
  /** When semantic link is on, ribbon icon accent hues follow theme color operators. */
  linkIconAccents: false,
  /** Asset Manager panel visible in the left rail on launch. */
  assetManagerPanelOpen: true,
  /** When on, row-selection highlight washes follow theme color operators. */
  linkSelectionHighlight: false,
  /** Theme spectrum sliders — sat/contrast use named theme stops and tighter ranges. */
  themeSpectrumSliders: false,
  /** Tick marks on Studio Settings color sliders at each step (whole number or tenth). */
  themeSliderStopTicks: false,
  /** Ribbon panel toggles — off icons use content-default only; on uses emphasis + muted-blue fill. */
  panelTogglesUseFills: false,
  /** Toolbar icon stack size inside each ribbon tool button (px). */
  ribbonIconSize: 24 as RibbonIconSize,
  /** Figma Studio Surface Colors theme — dark or light token bases. */
  studioColorTheme: 'dark' as StudioColorTheme,
  /** App chrome scale — viewport game/sim media stays at 100%. */
  uiScale: 100 as UiScale,
  /** Ribbon toolbar selected-tool background + accent treatment. */
  toolSelectionColor: 'shift_300' as ToolSelectionColor,
  /** Blue highlight — remap neutral icon fills to the selection accent on active tools. */
  toolSelectionIncludeNeutrals: false,
} as const

export type PrototypeSettingsDefaults = typeof PROTOTYPE_SETTINGS_DEFAULTS
