import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import css from './InteractionSettingsPanel.module.css'
import Radio from './Radio'
import {
  applyGray150Preset,
  applyGray350Preset,
  applySurface0Preset,
  applySurfacePreset,
  bindThemeColorOperators,
  HUE_OPERATOR_MAX,
  HUE_OPERATOR_MIN,
  HUE_OPERATOR_TICKS,
  resetThemeColorOperators,
  type SurfacePresetId,
  type ThemeSliderElements,
} from './themeColorOperators'
import type { StudioPhase } from '../../studioPhase'
import { isColorPlayground, isPhase2 } from '../../studioPhase'
import { UI_SCALE_OPTIONS, type UiScale } from './uiScale'
import { RIBBON_ICON_SIZE_OPTIONS, type RibbonIconSize } from './ribbonIconSize'
import {
  TOOL_SELECTION_COLOR_LABELS,
  TOOL_SELECTION_COLOR_OPTIONS,
  type ToolSelectionColor,
} from './toolSelectionColor'
import { PROTOTYPE_SETTINGS_DEFAULTS } from './prototypeDefaults'

const SURFACE_PRESET_BUTTONS: { id: SurfacePresetId; label: string }[] = [
  { id: 200, label: 'Surface_200' },
  { id: 300, label: 'Surface_300' },
]

function PanelTogglesUseFillsRow({
  checked,
  onChange,
}: {
  checked: boolean
  onChange?: (value: boolean) => void
}) {
  return (
    <div className={css.row}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label="Panel toggles use fills"
        className={`${css.checkboxBtn} ${checked ? css.checkboxBtnChecked : ''}`}
        onClick={() => onChange?.(!checked)}
      >
        {checked ? (
          <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
        ) : null}
      </button>
      <span className={css.label}>Panel toggles use fills</span>
    </div>
  )
}

function ChevDownSm() {
  return (
    <svg width={10} height={6} viewBox="0 0 10 6" aria-hidden>
      <path
        d="M1 1.2L5 4.8L9 1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type InteractionSettingsPanelProps = {
  /** Play focus: brand-hue semantic stroke with color tinting (mutually exclusive with focus stroke). */
  hasStroke: boolean
  onHasStrokeChange: (value: boolean) => void
  /** Play focus: neutral white inset — no color tinting on focus (mutually exclusive with semantic stroke). */
  hasFocusStroke: boolean
  onHasFocusStrokeChange: (value: boolean) => void
  /** Active document tab — 1px top edge stroke (semantic hue when Has semantic stroke is on). */
  tabStroke: boolean
  onTabStrokeChange: (value: boolean) => void
  /** Active document tab — extend focus stroke to left and right (requires Tab stroke top edge). */
  tabStrokeAllEdges: boolean
  onTabStrokeAllEdgesChange: (value: boolean) => void
  /** Active tab — top/left/right stroke only; panel content connects below (requires Tab stroke top edge). */
  tabStrokeConnected: boolean
  onTabStrokeConnectedChange: (value: boolean) => void
  /** Explorer header: plain “Explorer” only — no pills, dots, or title suffixes. */
  explorerNoBadge: boolean
  onExplorerNoBadgeChange: (value: boolean) => void
  /** Explorer header pill (Client / Server) while simulating — Figma 3856:139983. */
  explorerFocusBadge: boolean
  onExplorerFocusBadgeChange: (value: boolean) => void
  /** Colored dot in Explorer title badge (only when Show focus badge is on). */
  explorerBadgeShowIndicator: boolean
  onExplorerBadgeShowIndicatorChange: (value: boolean) => void
  /** Light gray dot pill for edit / Bunny original datamodel in Explorer. */
  explorerOriginalDmBadge: boolean
  onExplorerOriginalDmBadgeChange: (value: boolean) => void
  /** Explorer title suffix for focused document (e.g. Explorer / Drone). */
  explorerShowBreadcrumb: boolean
  onExplorerShowBreadcrumbChange: (value: boolean) => void
  /** Full workspace path in breadcrumbs when Properties is floating; shorten in-window when on. */
  showFullBreadcrumbWhenDetached: boolean
  onShowFullBreadcrumbWhenDetachedChange: (value: boolean) => void
  /** Full-frame 5% tint by focused viewport while simulating. */
  fullTint: boolean
  onFullTintChange: (value: boolean) => void
  /** Explorer selected-row hues follow focused datamodel while simulating (not viewport wash). */
  selectionTint: boolean
  onSelectionTintChange: (value: boolean) => void
  /** Footer background uses focused datamodel hue (Explorer selection tint colors). */
  footerTint: boolean
  onFooterTintChange: (value: boolean) => void
  /** Active Client / Server document tab — filled background (#02223B / #032609). */
  tabTint: boolean
  onTabTintChange: (value: boolean) => void
  /** Test mode: Client and Server as two columns instead of one tabbed document. */
  splitView: boolean
  onSplitViewChange: (value: boolean) => void
  /** Ribbon toggle reopens closed Client/Server document tabs when switching focus. */
  toggleOpensDmIfClosed: boolean
  onToggleOpensDmIfClosedChange: (value: boolean) => void
  /** Asset isolation preview in the viewport (Theme settings → Misc). */
  showAssetInIsolation: boolean
  onShowAssetInIsolationChange: (value: boolean) => void
  /** Edit datamodel UI: stroke visibility. */
  editDatamodelShowStroke: boolean
  onEditDatamodelShowStrokeChange: (value: boolean) => void
  /** Edit datamodel UI: suppress Drone/asset Explorer and footer tint (Client/Server unchanged). */
  hideAssetTinting: boolean
  onHideAssetTintingChange: (value: boolean) => void
  /** Right-side panel headers: Explorer / Properties / Theme — title left-aligned vs centered. */
  panelTitlesLeftAligned: boolean
  onPanelTitlesLeftAlignedChange: (value: boolean) => void
  /** When set, shows control to spawn another full Studio frame (stacked in the app shell). */
  onOpenAssetWindow?: () => void
  /** When set, shows control to open Properties as an in-frame floating panel. */
  onOpenFloatingProperties?: () => void
  /** When set, shows control to open Explorer as an in-frame floating panel. */
  onOpenFloatingExplorer?: () => void
  /** When set, undocks Drone / HoverScript into a floating document window. */
  onUndockDocument?: () => void
  /** Focus the Drone isolation panel and close all place documents. */
  onExperienceAssetOnly?: () => void
  /** Opens a Client Script document tab in the main workspace. */
  onOpenClientScript?: () => void
  /** Opens a Server Script document tab in the main workspace. */
  onOpenServerScript?: () => void
  /** Test mode — opens Output and appends a sample error line. */
  onThrowError?: () => void
  /** Play / Testing mode — script tab actions are only enabled while simulating. */
  testingMode?: boolean
  /** Bunny asset window — hide isolation toggle (layout is fixed). */
  bunnyAssetWindow?: boolean
  /** Restore prototype settings and color operators to current defaults. */
  onReset?: () => void
  /** When on, place servers joined in test stay open as edit place documents after stop. */
  serversPersistIntoEdit?: boolean
  onServersPersistIntoEditChange?: (value: boolean) => void
  /** Asset Manager Open → dock asset as a bottom document tab instead of floating. */
  openAssetAsDockedDocument?: boolean
  onOpenAssetAsDockedDocumentChange?: (value: boolean) => void
  /** Test Server tab label uses place display name instead of `Server`. */
  serverTabUsesPlaceName?: boolean
  onServerTabUsesPlaceNameChange?: (value: boolean) => void
  /** Test Client tab label uses `Client / {place}` instead of `Client`. */
  clientTabUsesPlaceName?: boolean
  onClientTabUsesPlaceNameChange?: (value: boolean) => void
  /** Phase 2 workspace experiments (hidden in Phase 1 baseline). */
  studioPhase?: StudioPhase
  /** When on, Client / Server / Drone hues follow theme color operators. */
  linkSemanticColors?: boolean
  onLinkSemanticColorsChange?: (value: boolean) => void
  /** When link is on, semantics follow hue only (not sat / lightness / contrast). */
  linkSemanticHueOnly?: boolean
  onLinkSemanticHueOnlyChange?: (value: boolean) => void
  /** When semantic link is on, ribbon icon accent hues follow theme color operators. */
  linkIconAccents?: boolean
  onLinkIconAccentsChange?: (value: boolean) => void
  /** Ribbon panel toggles — off icons use content-default only; on uses emphasis + muted-blue fill. */
  panelTogglesUseFills?: boolean
  onPanelTogglesUseFillsChange?: (value: boolean) => void
  /** Toolbar icon size inside each ribbon tool button (px). */
  ribbonIconSize?: RibbonIconSize
  onRibbonIconSizeChange?: (value: RibbonIconSize) => void
  /** Figma Studio Surface Colors — dark or light token bases. */
  studioColorTheme?: 'dark' | 'light'
  onStudioColorThemeChange?: (value: 'dark' | 'light') => void
  /** App chrome scale — viewport game/sim media stays at 100%. */
  uiScale?: UiScale
  onUiScaleChange?: (value: UiScale) => void
  /** Ribbon toolbar selected-tool background + accent treatment. */
  toolSelectionColor?: ToolSelectionColor
  onToolSelectionColorChange?: (value: ToolSelectionColor) => void
  /** Blue highlight — treat neutral icon fills as accents on active ribbon tools. */
  toolSelectionIncludeNeutrals?: boolean
  onToolSelectionIncludeNeutralsChange?: (value: boolean) => void
}

const SLIDER_TICK_VALUES = {
  hue: HUE_OPERATOR_TICKS,
  sat: [0, 0.4, 0.8, 1.2, 1.6, 2],
  light: [-10, -6, -2, 2, 6, 10],
  contrast: [0.5, 0.7, 0.9, 1.1, 1.3, 1.5],
} as const

function SliderTickMarks({
  values,
  sliderRef,
  getLabel,
}: {
  values: readonly number[]
  sliderRef: RefObject<HTMLInputElement | null>
  getLabel?: (value: number) => string
}) {
  const setSliderValue = (value: number) => {
    const slider = sliderRef.current
    if (!slider) return
    slider.value = String(value)
    slider.dispatchEvent(new Event('input', { bubbles: true }))
  }

  return (
    <div className={css.sliderTicks} role="group">
      {values.map((value) => {
        const label = getLabel?.(value) ?? String(value)
        return (
          <button
            key={value}
            type="button"
            className={css.sliderTick}
            aria-label={label}
            onClick={() => setSliderValue(value)}
          />
        )
      })}
    </div>
  )
}

export default function InteractionSettingsPanel({
  hasStroke,
  onHasStrokeChange,
  hasFocusStroke,
  onHasFocusStrokeChange,
  tabStroke,
  onTabStrokeChange,
  tabStrokeAllEdges,
  onTabStrokeAllEdgesChange,
  tabStrokeConnected,
  onTabStrokeConnectedChange,
  explorerNoBadge,
  onExplorerNoBadgeChange,
  explorerFocusBadge,
  onExplorerFocusBadgeChange,
  explorerBadgeShowIndicator,
  onExplorerBadgeShowIndicatorChange,
  explorerOriginalDmBadge,
  onExplorerOriginalDmBadgeChange,
  explorerShowBreadcrumb,
  onExplorerShowBreadcrumbChange,
  showFullBreadcrumbWhenDetached,
  onShowFullBreadcrumbWhenDetachedChange,
  fullTint,
  onFullTintChange,
  selectionTint,
  onSelectionTintChange,
  footerTint,
  onFooterTintChange,
  tabTint,
  onTabTintChange,
  splitView,
  onSplitViewChange,
  toggleOpensDmIfClosed,
  onToggleOpensDmIfClosedChange,
  showAssetInIsolation,
  onShowAssetInIsolationChange,
  editDatamodelShowStroke,
  onEditDatamodelShowStrokeChange,
  hideAssetTinting,
  onHideAssetTintingChange,
  panelTitlesLeftAligned,
  onPanelTitlesLeftAlignedChange,
  onOpenAssetWindow,
  onOpenFloatingProperties,
  onOpenFloatingExplorer,
  onUndockDocument,
  onExperienceAssetOnly,
  onOpenClientScript,
  onOpenServerScript,
  onThrowError,
  testingMode = false,
  bunnyAssetWindow,
  onReset,
  serversPersistIntoEdit = true,
  onServersPersistIntoEditChange,
  openAssetAsDockedDocument = true,
  onOpenAssetAsDockedDocumentChange,
  serverTabUsesPlaceName = true,
  onServerTabUsesPlaceNameChange,
  clientTabUsesPlaceName = false,
  onClientTabUsesPlaceNameChange,
  studioPhase = 2,
  linkSemanticColors = false,
  onLinkSemanticColorsChange,
  linkSemanticHueOnly = true,
  onLinkSemanticHueOnlyChange,
  linkIconAccents = false,
  onLinkIconAccentsChange,
  panelTogglesUseFills = false,
  onPanelTogglesUseFillsChange,
  ribbonIconSize = 24,
  onRibbonIconSizeChange,
  studioColorTheme = 'dark',
  onStudioColorThemeChange,
  uiScale = 100,
  onUiScaleChange,
  toolSelectionColor = 'shift_300',
  onToolSelectionColorChange,
  toolSelectionIncludeNeutrals = false,
  onToolSelectionIncludeNeutralsChange,
}: InteractionSettingsPanelProps) {
  const phase2 = isPhase2(studioPhase)
  const colorPlayground = isColorPlayground(studioPhase)
  const [gameEditorExperimentsOpen, setGameEditorExperimentsOpen] = useState(!colorPlayground)
  const [colorOperatorsOpen, setColorOperatorsOpen] = useState(colorPlayground)
  const [toolSelectionColorOpen, setToolSelectionColorOpen] = useState(colorPlayground)
  const [uiScaleOpen, setUiScaleOpen] = useState(colorPlayground)
  const [ribbonSettingsOpen, setRibbonSettingsOpen] = useState(colorPlayground)
  const [miscOpen, setMiscOpen] = useState(!colorPlayground)
  const badgeOptionsDisabled = explorerNoBadge

  const hueSliderRef = useRef<HTMLInputElement>(null)
  const satSliderRef = useRef<HTMLInputElement>(null)
  const lightSliderRef = useRef<HTMLInputElement>(null)
  const contrastSliderRef = useRef<HTMLInputElement>(null)
  const hueReadoutRef = useRef<HTMLSpanElement>(null)
  const satReadoutRef = useRef<HTMLSpanElement>(null)
  const lightReadoutRef = useRef<HTMLSpanElement>(null)
  const contrastReadoutRef = useRef<HTMLSpanElement>(null)

  const getSliderElements = useCallback((): ThemeSliderElements | null => {
    const hueSlider = hueSliderRef.current
    const satSlider = satSliderRef.current
    const lightSlider = lightSliderRef.current
    const contrastSlider = contrastSliderRef.current
    if (!hueSlider || !satSlider || !lightSlider || !contrastSlider) return null
    return {
      hueSlider,
      satSlider,
      lightSlider,
      contrastSlider,
      hueReadout: hueReadoutRef.current,
      satReadout: satReadoutRef.current,
      lightReadout: lightReadoutRef.current,
      contrastReadout: contrastReadoutRef.current,
    }
  }, [])

  useEffect(() => {
    if (!colorOperatorsOpen) return undefined
    const elements = getSliderElements()
    if (!elements) return undefined
    return bindThemeColorOperators(elements)
  }, [getSliderElements, colorOperatorsOpen])

  const handleResetTheme = useCallback(() => {
    resetThemeColorOperators(getSliderElements())
  }, [getSliderElements])

  const handleResetColorOperators = useCallback(() => {
    resetThemeColorOperators(getSliderElements())
  }, [getSliderElements])

  const handleResetUiScale = useCallback(() => {
    onUiScaleChange?.(PROTOTYPE_SETTINGS_DEFAULTS.uiScale)
  }, [onUiScaleChange])

  const handleResetRibbonSettings = useCallback(() => {
    onPanelTogglesUseFillsChange?.(PROTOTYPE_SETTINGS_DEFAULTS.panelTogglesUseFills)
    onRibbonIconSizeChange?.(PROTOTYPE_SETTINGS_DEFAULTS.ribbonIconSize)
  }, [onPanelTogglesUseFillsChange, onRibbonIconSizeChange])

  const handleResetToolSelectionColor = useCallback(() => {
    onToolSelectionColorChange?.(PROTOTYPE_SETTINGS_DEFAULTS.toolSelectionColor)
    onToolSelectionIncludeNeutralsChange?.(PROTOTYPE_SETTINGS_DEFAULTS.toolSelectionIncludeNeutrals)
  }, [onToolSelectionColorChange, onToolSelectionIncludeNeutralsChange])

  const handleReset = useCallback(() => {
    const elements = getSliderElements()
    if (elements) resetThemeColorOperators(elements)
    onReset?.()
  }, [getSliderElements, onReset])

  const handleSurfacePreset = useCallback(
    (id: SurfacePresetId) => {
      const elements = getSliderElements()
      if (elements) applySurfacePreset(elements, id)
    },
    [getSliderElements],
  )

  const handleSurface0Preset = useCallback(() => {
    const elements = getSliderElements()
    if (elements) applySurface0Preset(elements, studioColorTheme)
  }, [getSliderElements, studioColorTheme])

  const handleGray350Preset = useCallback(() => {
    const elements = getSliderElements()
    if (elements) applyGray350Preset(elements)
  }, [getSliderElements])

  const handleGray150Preset = useCallback(() => {
    const elements = getSliderElements()
    if (elements) applyGray150Preset(elements)
  }, [getSliderElements])

  return (
    <div
      className={`${css.root} ${colorPlayground ? css.colorPlaygroundRoot : ''}`.trim()}
      data-name="ThemeSettings"
    >
      {phase2 && !colorPlayground ? (
        <section className={`${css.collapsible} ${css.gameEditorExperimentsSection}`}>
          <button
            type="button"
            className={css.collapsibleHeader}
            aria-expanded={gameEditorExperimentsOpen}
            aria-controls="prototype-settings-game-editor-experiments"
            id="prototype-game-editor-experiments-heading"
            onClick={() => setGameEditorExperimentsOpen((open) => !open)}
          >
            <div
              className={`${css.collapsibleChevron} ${gameEditorExperimentsOpen ? '' : css.collapsibleChevronClosed}`}
            >
              <ChevDownSm />
            </div>
            <span className={css.collapsibleTitle}>Game editor experiments</span>
          </button>
          {gameEditorExperimentsOpen ? (
            <div
              id="prototype-settings-game-editor-experiments"
              className={css.collapsibleBody}
              role="region"
              aria-labelledby="prototype-game-editor-experiments-heading"
            >
              <section className={css.group} aria-labelledby="game-editor-experiments-heading">
                <h2 id="game-editor-experiments-heading" className={css.groupLabel}>
                  Test → edit
                </h2>
                <div className={css.options}>
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={serversPersistIntoEdit}
                      aria-label="Servers persist into edit"
                      className={`${css.checkboxBtn} ${serversPersistIntoEdit ? css.checkboxBtnChecked : ''}`}
                      onClick={() =>
                        onServersPersistIntoEditChange?.(!serversPersistIntoEdit)
                      }
                    >
                      {serversPersistIntoEdit ? (
                        <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                      ) : null}
                    </button>
                    <span className={css.label}>Servers persist into edit</span>
                  </div>
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={serverTabUsesPlaceName}
                      aria-label="Server tab = place name"
                      className={`${css.checkboxBtn} ${serverTabUsesPlaceName ? css.checkboxBtnChecked : ''}`}
                      onClick={() =>
                        onServerTabUsesPlaceNameChange?.(!serverTabUsesPlaceName)
                      }
                    >
                      {serverTabUsesPlaceName ? (
                        <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                      ) : null}
                    </button>
                    <span className={css.label}>Server tab = place name</span>
                  </div>
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={clientTabUsesPlaceName}
                      aria-label="Client tab = Client / place name"
                      className={`${css.checkboxBtn} ${clientTabUsesPlaceName ? css.checkboxBtnChecked : ''}`}
                      onClick={() =>
                        onClientTabUsesPlaceNameChange?.(!clientTabUsesPlaceName)
                      }
                    >
                      {clientTabUsesPlaceName ? (
                        <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                      ) : null}
                    </button>
                    <span className={css.label}>Client tab = Client / {'{place name}'}</span>
                  </div>
                </div>
              </section>
              {onExperienceAssetOnly ? (
                <section
                  className={css.group}
                  aria-labelledby="game-editor-experiments-layout-heading"
                >
                  <h2 id="game-editor-experiments-layout-heading" className={css.groupLabel}>
                    Layout
                  </h2>
                  <div className={css.layoutActions}>
                    <button
                      type="button"
                      className={css.openAssetBtn}
                      disabled={testingMode}
                      aria-disabled={testingMode}
                      onClick={onExperienceAssetOnly}
                    >
                      Experience asset view
                    </button>
                  </div>
                </section>
              ) : null}
              <section
                className={css.group}
                aria-labelledby="game-editor-experiments-auxiliary-panel-heading"
              >
                <h2
                  id="game-editor-experiments-auxiliary-panel-heading"
                  className={css.groupLabel}
                >
                  Asset interactions
                </h2>
                <div className={css.options}>
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={openAssetAsDockedDocument}
                      aria-label="Open asset as docked document"
                      className={`${css.checkboxBtn} ${openAssetAsDockedDocument ? css.checkboxBtnChecked : ''}`}
                      onClick={() =>
                        onOpenAssetAsDockedDocumentChange?.(!openAssetAsDockedDocument)
                      }
                    >
                      {openAssetAsDockedDocument ? (
                        <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                      ) : null}
                    </button>
                    <span className={css.label}>Open asset as docked document</span>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </section>
      ) : null}

      {phase2 ? (
        <section className={`${css.collapsible} ${css.ribbonSettingsSection}`}>
          <div className={css.collapsibleHeaderRow}>
            <button
              type="button"
              className={css.collapsibleHeader}
              aria-expanded={ribbonSettingsOpen}
              aria-controls="theme-settings-ribbon"
              id="theme-ribbon-heading"
              onClick={() => setRibbonSettingsOpen((open) => !open)}
            >
              <div
                className={`${css.collapsibleChevron} ${ribbonSettingsOpen ? '' : css.collapsibleChevronClosed}`}
              >
                <ChevDownSm />
              </div>
              <span className={css.collapsibleTitle}>Ribbon</span>
            </button>
            <button
              type="button"
              className={css.collapsibleHeaderAction}
              aria-label="Reset ribbon settings"
              onClick={handleResetRibbonSettings}
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden />
            </button>
          </div>
          {ribbonSettingsOpen ? (
            <div
              id="theme-settings-ribbon"
              className={css.collapsibleBody}
              role="region"
              aria-labelledby="theme-ribbon-heading"
            >
              <div className={css.options}>
                <PanelTogglesUseFillsRow
                  checked={panelTogglesUseFills}
                  onChange={onPanelTogglesUseFillsChange}
                />
              </div>
              <div
                className={css.options}
                role="radiogroup"
                aria-label="Ribbon icon size"
              >
                {RIBBON_ICON_SIZE_OPTIONS.map((option) => (
                  <Radio
                    key={option}
                    checked={ribbonIconSize === option}
                    label={`${option}px`}
                    onSelect={() => onRibbonIconSizeChange?.(option)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={`${css.collapsible} ${css.colorOperatorsSection}`}>
        <div className={css.collapsibleHeaderRow}>
          <button
            type="button"
            className={css.collapsibleHeader}
            aria-expanded={colorOperatorsOpen}
            aria-controls="theme-settings-color-operators"
            id="theme-color-operators-heading"
            onClick={() => setColorOperatorsOpen((open) => !open)}
          >
            <div
              className={`${css.collapsibleChevron} ${colorOperatorsOpen ? '' : css.collapsibleChevronClosed}`}
            >
              <ChevDownSm />
            </div>
            <span className={css.collapsibleTitle}>Color operators</span>
          </button>
          <button
            type="button"
            className={css.collapsibleHeaderAction}
            aria-label="Reset color operators"
            onClick={handleResetColorOperators}
          >
            <RefreshCw size={14} strokeWidth={2} aria-hidden />
          </button>
        </div>
        {colorOperatorsOpen ? (
          <div
            id="theme-settings-color-operators"
            className={css.collapsibleBody}
            role="region"
            aria-labelledby="theme-color-operators-heading"
          >
        <div className={css.options}>
          <div className={css.row}>
            <button
              type="button"
              role="checkbox"
              aria-checked={studioColorTheme === 'light'}
              aria-label="Light theme"
              className={`${css.checkboxBtn} ${studioColorTheme === 'light' ? css.checkboxBtnChecked : ''}`}
              onClick={() => onStudioColorThemeChange?.(studioColorTheme === 'light' ? 'dark' : 'light')}
            >
              {studioColorTheme === 'light' ? (
                <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
              ) : null}
            </button>
            <span className={css.label}>Light theme</span>
          </div>
          <div className={css.row}>
            <button
              type="button"
              role="checkbox"
              aria-checked={linkSemanticColors}
              aria-label="Link semantic colors"
              className={`${css.checkboxBtn} ${linkSemanticColors ? css.checkboxBtnChecked : ''}`}
              onClick={() => onLinkSemanticColorsChange?.(!linkSemanticColors)}
            >
              {linkSemanticColors ? (
                <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
              ) : null}
            </button>
            <span className={css.label}>Link semantic colors</span>
          </div>
          {linkSemanticColors ? (
            <>
              <div className={`${css.row} ${css.rowNested}`}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={linkSemanticHueOnly}
                  aria-label="Hue only"
                  className={`${css.checkboxBtn} ${linkSemanticHueOnly ? css.checkboxBtnChecked : ''}`}
                  onClick={() => onLinkSemanticHueOnlyChange?.(!linkSemanticHueOnly)}
                >
                  {linkSemanticHueOnly ? (
                    <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                  ) : null}
                </button>
                <span className={css.label}>Hue only</span>
              </div>
              <div className={`${css.row} ${css.rowNested}`}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={linkIconAccents}
                  aria-label="Link icon accents"
                  className={`${css.checkboxBtn} ${linkIconAccents ? css.checkboxBtnChecked : ''}`}
                  onClick={() => onLinkIconAccentsChange?.(!linkIconAccents)}
                >
                  {linkIconAccents ? (
                    <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                  ) : null}
                </button>
                <span className={css.label}>Link icon accents</span>
              </div>
            </>
          ) : null}
        </div>
        <div className={css.sliders}>
          <div className={css.sliderRow}>
            <label className={css.sliderLabel} htmlFor="hueSlider">
              Hue
            </label>
            <div className={css.sliderControl}>
              <input
                ref={hueSliderRef}
                type="range"
                id="hueSlider"
                className={css.slider}
                min={HUE_OPERATOR_MIN}
                max={HUE_OPERATOR_MAX}
                step={1}
                defaultValue={0}
              />
              <SliderTickMarks
                values={SLIDER_TICK_VALUES.hue}
                sliderRef={hueSliderRef}
                getLabel={(v) => `${v > 0 ? '+' : ''}${v}°`}
              />
            </div>
            <span ref={hueReadoutRef} id="hueReadout" className={css.sliderReadout}>
              0°
            </span>
          </div>
          <div className={css.sliderRow}>
            <label className={css.sliderLabel} htmlFor="satSlider">
              Saturation
            </label>
            <div className={css.sliderControl}>
              <input
                ref={satSliderRef}
                type="range"
                id="satSlider"
                className={css.slider}
                min={0}
                max={2}
                step={0.1}
                defaultValue={1}
              />
              <SliderTickMarks values={SLIDER_TICK_VALUES.sat} sliderRef={satSliderRef} getLabel={(v) => `${v}x`} />
            </div>
            <span ref={satReadoutRef} id="satReadout" className={css.sliderReadout}>
              1x
            </span>
          </div>
          <div className={css.sliderRow}>
            <label className={css.sliderLabel} htmlFor="lightSlider">
              Lightness
            </label>
            <div className={css.sliderControl}>
              <input
                ref={lightSliderRef}
                type="range"
                id="lightSlider"
                className={css.slider}
                min={-10}
                max={10}
                step={1}
                defaultValue={0}
              />
              <SliderTickMarks
                values={SLIDER_TICK_VALUES.light}
                sliderRef={lightSliderRef}
                getLabel={(v) => `${v > 0 ? '+' : ''}${v}%`}
              />
            </div>
            <span ref={lightReadoutRef} id="lightReadout" className={css.sliderReadout}>
              0%
            </span>
          </div>
          <div className={css.sliderRow}>
            <label className={css.sliderLabel} htmlFor="contrastSlider">
              Contrast
            </label>
            <div className={css.sliderControl}>
              <input
                ref={contrastSliderRef}
                type="range"
                id="contrastSlider"
                className={css.slider}
                min={0.5}
                max={1.5}
                step={0.01}
                defaultValue={1}
              />
              <SliderTickMarks values={SLIDER_TICK_VALUES.contrast} sliderRef={contrastSliderRef} getLabel={(v) => `${v}x`} />
            </div>
            <span ref={contrastReadoutRef} id="contrastReadout" className={css.sliderReadout}>
              1x
            </span>
          </div>
          <div className={css.presetRow}>
            {studioColorTheme === 'dark' ? (
              <button type="button" className={css.presetBtn} onClick={handleGray350Preset}>
                Gray 350 (new)
              </button>
            ) : (
              <button type="button" className={css.presetBtn} onClick={handleGray150Preset}>
                Gray 150 (new)
              </button>
            )}
            {SURFACE_PRESET_BUTTONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={css.presetBtn}
                onClick={() => handleSurfacePreset(id)}
              >
                {label}
              </button>
            ))}
            <button type="button" className={css.presetBtn} onClick={handleResetTheme}>
              Surface 100
            </button>
            <button type="button" className={css.presetBtn} onClick={handleSurface0Preset}>
              Surface 0
            </button>
            {onReset ? (
              <button type="button" className={css.presetBtn} onClick={handleReset}>
                Reset
              </button>
            ) : null}
          </div>
        </div>
          </div>
        ) : null}
      </section>

      <section className={`${css.collapsible} ${css.toolSelectionColorSection}`}>
        <div className={css.collapsibleHeaderRow}>
          <button
            type="button"
            className={css.collapsibleHeader}
            aria-expanded={toolSelectionColorOpen}
            aria-controls="theme-settings-tool-selection-color"
            id="theme-tool-selection-color-heading"
            onClick={() => setToolSelectionColorOpen((open) => !open)}
          >
            <div
              className={`${css.collapsibleChevron} ${toolSelectionColorOpen ? '' : css.collapsibleChevronClosed}`}
            >
              <ChevDownSm />
            </div>
            <span className={css.collapsibleTitle}>Tool selection color</span>
          </button>
          <button
            type="button"
            className={css.collapsibleHeaderAction}
            aria-label="Reset tool selection color"
            onClick={handleResetToolSelectionColor}
          >
            <RefreshCw size={14} strokeWidth={2} aria-hidden />
          </button>
        </div>
        {toolSelectionColorOpen ? (
          <div
            id="theme-settings-tool-selection-color"
            className={css.collapsibleBody}
            role="region"
            aria-labelledby="theme-tool-selection-color-heading"
          >
            <div
              className={css.options}
              role="radiogroup"
              aria-labelledby="theme-tool-selection-color-heading"
            >
              {TOOL_SELECTION_COLOR_OPTIONS.map((option) => (
                <Radio
                  key={option}
                  checked={toolSelectionColor === option}
                  label={TOOL_SELECTION_COLOR_LABELS[option]}
                  onSelect={() => onToolSelectionColorChange?.(option)}
                />
              ))}
              {toolSelectionColor === 'blue_highlight' ? (
                <div className={`${css.row} ${css.rowNested}`}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={toolSelectionIncludeNeutrals}
                    aria-label="Include neutrals"
                    className={`${css.checkboxBtn} ${
                      toolSelectionIncludeNeutrals ? css.checkboxBtnChecked : ''
                    }`}
                    onClick={() =>
                      onToolSelectionIncludeNeutralsChange?.(!toolSelectionIncludeNeutrals)
                    }
                  >
                    {toolSelectionIncludeNeutrals ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Include neutrals</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className={`${css.collapsible} ${css.uiScaleSection}`}>
        <div className={css.collapsibleHeaderRow}>
          <button
            type="button"
            className={css.collapsibleHeader}
            aria-expanded={uiScaleOpen}
            aria-controls="theme-settings-ui-scale"
            id="theme-ui-scale-heading"
            onClick={() => setUiScaleOpen((open) => !open)}
          >
            <div
              className={`${css.collapsibleChevron} ${uiScaleOpen ? '' : css.collapsibleChevronClosed}`}
            >
              <ChevDownSm />
            </div>
            <span className={css.collapsibleTitle}>UI scale</span>
          </button>
          <button
            type="button"
            className={css.collapsibleHeaderAction}
            aria-label="Reset UI scale"
            onClick={handleResetUiScale}
          >
            <RefreshCw size={14} strokeWidth={2} aria-hidden />
          </button>
        </div>
        {uiScaleOpen ? (
          <div
            id="theme-settings-ui-scale"
            className={css.collapsibleBody}
            role="region"
            aria-labelledby="theme-ui-scale-heading"
          >
            <div className={css.options} role="radiogroup" aria-labelledby="theme-ui-scale-heading">
              {UI_SCALE_OPTIONS.map((option) => (
                <Radio
                  key={option}
                  checked={uiScale === option}
                  label={`${option}%`}
                  onSelect={() => onUiScaleChange?.(option)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {!colorPlayground ? (
      <section className={`${css.collapsible} ${css.focusSettingsSection}`}>
        <button
          type="button"
          className={css.collapsibleHeader}
          aria-expanded={miscOpen}
          aria-controls="theme-settings-misc"
          id="theme-settings-misc-heading"
          onClick={() => setMiscOpen((open) => !open)}
        >
          <div
            className={`${css.collapsibleChevron} ${miscOpen ? '' : css.collapsibleChevronClosed}`}
          >
            <ChevDownSm />
          </div>
          <span className={css.collapsibleTitle}>Focus interaction settings</span>
        </button>
        {miscOpen ? (
          <div
            id="theme-settings-misc"
            className={css.collapsibleBody}
            role="region"
            aria-labelledby="theme-settings-misc-heading"
          >
            <section className={css.group} aria-labelledby="interaction-testing-interactions-heading">
              <h2 id="interaction-testing-interactions-heading" className={css.groupLabel}>
                Testing interactions
              </h2>
              <div className={css.options}>
                <div className={css.row}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={toggleOpensDmIfClosed}
                    aria-label="Toggle opens DM if closed"
                    className={`${css.checkboxBtn} ${toggleOpensDmIfClosed ? css.checkboxBtnChecked : ''}`}
                    onClick={() => onToggleOpensDmIfClosedChange(!toggleOpensDmIfClosed)}
                  >
                    {toggleOpensDmIfClosed ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Toggle opens DM if closed</span>
                </div>
              </div>
            </section>

            <section className={css.group} aria-labelledby="interaction-edit-datamodel-heading">
              <h2 id="interaction-edit-datamodel-heading" className={css.groupLabel}>
                Edit datamodel UI
              </h2>
              <div className={css.options}>
                {!bunnyAssetWindow ? (
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={showAssetInIsolation}
                      aria-label="Show asset in isolation"
                      className={`${css.checkboxBtn} ${showAssetInIsolation ? css.checkboxBtnChecked : ''}`}
                      onClick={() => onShowAssetInIsolationChange(!showAssetInIsolation)}
                    >
                      {showAssetInIsolation ? (
                        <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                      ) : null}
                    </button>
                    <span className={css.label}>Show asset in isolation</span>
                  </div>
                ) : null}
                <div className={css.row}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={editDatamodelShowStroke}
                    aria-label="Show Stroke"
                    className={`${css.checkboxBtn} ${editDatamodelShowStroke ? css.checkboxBtnChecked : ''}`}
                    onClick={() => onEditDatamodelShowStrokeChange(!editDatamodelShowStroke)}
                  >
                    {editDatamodelShowStroke ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Show Stroke</span>
                </div>
                <div className={css.row}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={hideAssetTinting}
                    aria-label="Hide Asset tinting"
                    className={`${css.checkboxBtn} ${hideAssetTinting ? css.checkboxBtnChecked : ''}`}
                    onClick={() => onHideAssetTintingChange(!hideAssetTinting)}
                  >
                    {hideAssetTinting ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Hide Asset tinting</span>
                </div>
              </div>
            </section>

            {onOpenAssetWindow ||
            onOpenFloatingProperties ||
            onOpenFloatingExplorer ||
            onUndockDocument ? (
              <section className={css.group} aria-labelledby="interaction-layout-actions-heading">
                <h2 id="interaction-layout-actions-heading" className={css.groupLabel}>
                  Layout actions
                </h2>
                <div className={css.layoutActions}>
                  {onOpenAssetWindow ? (
                    <button type="button" className={css.openAssetBtn} onClick={onOpenAssetWindow}>
                      Open asset window
                    </button>
                  ) : null}
                  {onUndockDocument ? (
                    <button type="button" className={css.openAssetBtn} onClick={onUndockDocument}>
                      Undock document
                    </button>
                  ) : null}
                  {onOpenFloatingProperties ? (
                    <button
                      type="button"
                      className={css.openAssetBtn}
                      onClick={onOpenFloatingProperties}
                    >
                      Undock Properties
                    </button>
                  ) : null}
                  {onOpenFloatingExplorer ? (
                    <button
                      type="button"
                      className={css.openAssetBtn}
                      onClick={onOpenFloatingExplorer}
                    >
                      Undock Explorer
                    </button>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className={css.group} aria-labelledby="interaction-testing-ui-heading">
              <h2 id="interaction-testing-ui-heading" className={css.groupLabel}>
                Focus stroke
              </h2>
              <div
                className={css.options}
                role="radiogroup"
                aria-labelledby="interaction-testing-ui-heading"
              >
                <Radio
                  checked={hasStroke && !hasFocusStroke}
                  label="Has semantic stroke"
                  onSelect={() => {
                    onHasStrokeChange(true)
                    onHasFocusStrokeChange(false)
                  }}
                />
                <Radio
                  checked={hasFocusStroke && !hasStroke}
                  label="Has focus stroke"
                  onSelect={() => {
                    onHasStrokeChange(false)
                    onHasFocusStrokeChange(true)
                  }}
                />
                <div className={css.row}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={tabStroke}
                    aria-label="Tab stroke top edge"
                    className={`${css.checkboxBtn} ${tabStroke ? css.checkboxBtnChecked : ''}`}
                    onClick={() => onTabStrokeChange(!tabStroke)}
                  >
                    {tabStroke ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Tab stroke top edge</span>
                </div>
                <div className={css.row}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={tabStrokeAllEdges}
                    aria-label="Tab stroke all edges"
                    aria-disabled={!tabStroke}
                    disabled={!tabStroke}
                    className={`${css.checkboxBtn} ${
                      tabStrokeAllEdges ? css.checkboxBtnChecked : ''
                    }`}
                    onClick={() => onTabStrokeAllEdgesChange(!tabStrokeAllEdges)}
                  >
                    {tabStrokeAllEdges ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Tab stroke all edges</span>
                </div>
                <div className={css.row}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={tabStrokeConnected}
                    aria-label="Tab stroke connected"
                    aria-disabled={!tabStroke}
                    disabled={!tabStroke}
                    className={`${css.checkboxBtn} ${
                      tabStrokeConnected ? css.checkboxBtnChecked : ''
                    }`}
                    onClick={() => onTabStrokeConnectedChange(!tabStrokeConnected)}
                  >
                    {tabStrokeConnected ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Tab stroke connected</span>
                </div>
              </div>
              <section className={css.subgroup} aria-labelledby="interaction-tints-heading">
                <h3 id="interaction-tints-heading" className={css.subgroupLabel}>
                  Tints
                </h3>
                <div className={css.options}>
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={fullTint}
                      aria-label="Full tint"
                      className={`${css.checkboxBtn} ${fullTint ? css.checkboxBtnChecked : ''}`}
                      onClick={() => onFullTintChange(!fullTint)}
                    >
                      {fullTint ? (
                        <Check
                          size={10}
                          strokeWidth={2.75}
                          className={css.checkboxMark}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    <span className={css.label}>Full tint</span>
                  </div>
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={selectionTint}
                      aria-label="Selection tint"
                      className={`${css.checkboxBtn} ${selectionTint ? css.checkboxBtnChecked : ''}`}
                      onClick={() => onSelectionTintChange(!selectionTint)}
                    >
                      {selectionTint ? (
                        <Check
                          size={10}
                          strokeWidth={2.75}
                          className={css.checkboxMark}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    <span className={css.label}>Selection tint</span>
                  </div>
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={footerTint}
                      aria-label="Footer tint"
                      className={`${css.checkboxBtn} ${footerTint ? css.checkboxBtnChecked : ''}`}
                      onClick={() => onFooterTintChange(!footerTint)}
                    >
                      {footerTint ? (
                        <Check
                          size={10}
                          strokeWidth={2.75}
                          className={css.checkboxMark}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    <span className={css.label}>Footer tint</span>
                  </div>
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={tabTint}
                      aria-label="Tab tint"
                      className={`${css.checkboxBtn} ${tabTint ? css.checkboxBtnChecked : ''}`}
                      onClick={() => onTabTintChange(!tabTint)}
                    >
                      {tabTint ? (
                        <Check
                          size={10}
                          strokeWidth={2.75}
                          className={css.checkboxMark}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    <span className={css.label}>Tab tint</span>
                  </div>
                </div>
              </section>
              <section className={css.subgroup} aria-labelledby="interaction-view-heading">
                <h3 id="interaction-view-heading" className={css.subgroupLabel}>
                  View
                </h3>
                <div className={css.options}>
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={splitView}
                      aria-label="Split view"
                      className={`${css.checkboxBtn} ${splitView ? css.checkboxBtnChecked : ''}`}
                      onClick={() => onSplitViewChange(!splitView)}
                    >
                      {splitView ? (
                        <Check
                          size={10}
                          strokeWidth={2.75}
                          className={css.checkboxMark}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    <span className={css.label}>Split view</span>
                  </div>
                </div>
              </section>
            </section>

            <section className={css.group} aria-labelledby="interaction-panel-chrome-heading">
              <h2 id="interaction-panel-chrome-heading" className={css.groupLabel}>
                Panel chrome
              </h2>
              <div className={css.options}>
                <div className={css.row}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={panelTitlesLeftAligned}
                    aria-label="Left-align panel titles"
                    className={`${css.checkboxBtn} ${panelTitlesLeftAligned ? css.checkboxBtnChecked : ''}`}
                    onClick={() => onPanelTitlesLeftAlignedChange(!panelTitlesLeftAligned)}
                  >
                    {panelTitlesLeftAligned ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Left-align panel titles</span>
                </div>
              </div>
              <section className={css.subgroup} aria-labelledby="interaction-breadcrumb-heading">
                <h3 id="interaction-breadcrumb-heading" className={css.subgroupLabel}>
                  Breadcrumb
                </h3>
                <div
                  className={css.options}
                  role="radiogroup"
                  aria-labelledby="interaction-breadcrumb-heading"
                >
                  <Radio
                    checked={explorerShowBreadcrumb && !showFullBreadcrumbWhenDetached}
                    label="Show full breadcrumb"
                    onSelect={() => {
                      onExplorerShowBreadcrumbChange(true)
                      onShowFullBreadcrumbWhenDetachedChange(false)
                    }}
                  />
                  <Radio
                    checked={explorerShowBreadcrumb && showFullBreadcrumbWhenDetached}
                    label="Show full breadcrumb when detached"
                    onSelect={() => {
                      onExplorerShowBreadcrumbChange(true)
                      onShowFullBreadcrumbWhenDetachedChange(true)
                    }}
                  />
                </div>
              </section>
              <section className={css.subgroup} aria-labelledby="interaction-badge-heading">
                <h3 id="interaction-badge-heading" className={css.subgroupLabel}>
                  Badge
                </h3>
                <div className={css.options}>
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={explorerNoBadge}
                      aria-label="No badge"
                      className={`${css.checkboxBtn} ${explorerNoBadge ? css.checkboxBtnChecked : ''}`}
                      onClick={() => onExplorerNoBadgeChange(!explorerNoBadge)}
                    >
                      {explorerNoBadge ? (
                        <Check
                          size={10}
                          strokeWidth={2.75}
                          className={css.checkboxMark}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    <span className={css.label}>No badge</span>
                  </div>
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={explorerFocusBadge}
                      aria-label="Show focus badge"
                      aria-disabled={badgeOptionsDisabled}
                      disabled={badgeOptionsDisabled}
                      className={`${css.checkboxBtn} ${explorerFocusBadge ? css.checkboxBtnChecked : ''}`}
                      onClick={() => onExplorerFocusBadgeChange(!explorerFocusBadge)}
                    >
                      {explorerFocusBadge ? (
                        <Check
                          size={10}
                          strokeWidth={2.75}
                          className={css.checkboxMark}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    <span
                      className={`${css.label} ${badgeOptionsDisabled ? css.labelMuted : ''}`}
                    >
                      Show focus badge
                    </span>
                  </div>
                  {explorerFocusBadge && !badgeOptionsDisabled ? (
                    <div className={`${css.row} ${css.rowNested}`}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={explorerBadgeShowIndicator}
                        aria-label="Show indicator in badge"
                        className={`${css.checkboxBtn} ${explorerBadgeShowIndicator ? css.checkboxBtnChecked : ''}`}
                        onClick={() =>
                          onExplorerBadgeShowIndicatorChange(!explorerBadgeShowIndicator)
                        }
                      >
                        {explorerBadgeShowIndicator ? (
                          <Check
                            size={10}
                            strokeWidth={2.75}
                            className={css.checkboxMark}
                            aria-hidden
                          />
                        ) : null}
                      </button>
                      <span className={css.label}>Show indicator in badge</span>
                    </div>
                  ) : null}
                  <div className={css.row}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={explorerOriginalDmBadge}
                      aria-label="Show original DM badge"
                      aria-disabled={badgeOptionsDisabled}
                      disabled={badgeOptionsDisabled}
                      className={`${css.checkboxBtn} ${explorerOriginalDmBadge ? css.checkboxBtnChecked : ''}`}
                      onClick={() => onExplorerOriginalDmBadgeChange(!explorerOriginalDmBadge)}
                    >
                      {explorerOriginalDmBadge ? (
                        <Check
                          size={10}
                          strokeWidth={2.75}
                          className={css.checkboxMark}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    <span
                      className={`${css.label} ${badgeOptionsDisabled ? css.labelMuted : ''}`}
                    >
                      Show original DM badge
                    </span>
                  </div>
                </div>
              </section>
            </section>

            {onOpenClientScript || onOpenServerScript || onThrowError ? (
              <div className={css.scriptTabActions}>
                {onOpenClientScript ? (
                  <button
                    type="button"
                    className={css.openAssetBtn}
                    disabled={!testingMode}
                    aria-disabled={!testingMode}
                    onClick={onOpenClientScript}
                  >
                    Open Client Script
                  </button>
                ) : null}
                {onOpenServerScript ? (
                  <button
                    type="button"
                    className={css.openAssetBtn}
                    disabled={!testingMode}
                    aria-disabled={!testingMode}
                    onClick={onOpenServerScript}
                  >
                    Open Server Script
                  </button>
                ) : null}
                {onThrowError ? (
                  <button
                    type="button"
                    className={css.openAssetBtn}
                    disabled={!testingMode}
                    aria-disabled={!testingMode}
                    onClick={onThrowError}
                  >
                    Throw Error
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
      ) : null}
    </div>
  )
}
