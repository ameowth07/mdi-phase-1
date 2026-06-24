import { useCallback, useState } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import css from './InteractionSettingsPanel.module.css'
import Radio from './Radio'
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
  /** When on, row-selection highlight washes follow theme color operators. */
  linkSelectionHighlight?: boolean
  onLinkSelectionHighlightChange?: (value: boolean) => void
  /** Theme spectrum sliders — sat/contrast use named theme stops and tighter ranges. */
  themeSpectrumSliders?: boolean
  onThemeSpectrumSlidersChange?: (value: boolean) => void
  /** Tick marks on Studio Settings color sliders at each step (whole number or tenth). */
  themeSliderStopTicks?: boolean
  onThemeSliderStopTicksChange?: (value: boolean) => void
  /** Ribbon panel toggles — off icons use content-default only; on uses emphasis + muted-blue fill. */
  panelTogglesUseFills?: boolean
  onPanelTogglesUseFillsChange?: (value: boolean) => void
  /** Toolbar icon size inside each ribbon tool button (px). */
  ribbonIconSize?: RibbonIconSize
  onRibbonIconSizeChange?: (value: RibbonIconSize) => void
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
  linkSelectionHighlight = false,
  onLinkSelectionHighlightChange,
  themeSpectrumSliders = false,
  onThemeSpectrumSlidersChange,
  themeSliderStopTicks = false,
  onThemeSliderStopTicksChange,
  panelTogglesUseFills = false,
  onPanelTogglesUseFillsChange,
  ribbonIconSize = 24,
  onRibbonIconSizeChange,
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
              aria-checked={linkSelectionHighlight}
              aria-label="Link selection highlight"
              className={`${css.checkboxBtn} ${linkSelectionHighlight ? css.checkboxBtnChecked : ''}`}
              onClick={() => onLinkSelectionHighlightChange?.(!linkSelectionHighlight)}
            >
              {linkSelectionHighlight ? (
                <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
              ) : null}
            </button>
            <span className={css.label}>Link selection highlight</span>
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
          <div className={css.row}>
            <button
              type="button"
              role="checkbox"
              aria-checked={themeSpectrumSliders}
              aria-label="Theme spectrum sliders"
              className={`${css.checkboxBtn} ${themeSpectrumSliders ? css.checkboxBtnChecked : ''}`}
              onClick={() => onThemeSpectrumSlidersChange?.(!themeSpectrumSliders)}
            >
              {themeSpectrumSliders ? (
                <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
              ) : null}
            </button>
            <span className={css.label}>Theme spectrum sliders</span>
          </div>
          <div className={css.row}>
            <button
              type="button"
              role="checkbox"
              aria-checked={themeSliderStopTicks}
              aria-label="Slider stop ticks"
              className={`${css.checkboxBtn} ${themeSliderStopTicks ? css.checkboxBtnChecked : ''}`}
              onClick={() => onThemeSliderStopTicksChange?.(!themeSliderStopTicks)}
            >
              {themeSliderStopTicks ? (
                <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
              ) : null}
            </button>
            <span className={css.label}>Slider stop ticks</span>
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
