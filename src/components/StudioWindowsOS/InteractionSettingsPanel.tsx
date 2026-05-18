import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import css from './InteractionSettingsPanel.module.css'
import {
  bindThemeColorOperators,
  resetThemeColorOperators,
  type ThemeSliderElements,
} from './themeColorOperators'

export type InteractionSettingsPanelProps = {
  /** Inset focus ring on client / server viewports while simulating. */
  hasStroke: boolean
  onHasStrokeChange: (value: boolean) => void
  /** Sim focus ring uses the same white inset stroke as edit Drone Racer / asset isolation (not brand blue/green). */
  hasFocusStroke: boolean
  onHasFocusStrokeChange: (value: boolean) => void
  /** Explorer header pill (Client / Server) while simulating — Figma 3856:139983. */
  explorerFocusBadge: boolean
  onExplorerFocusBadgeChange: (value: boolean) => void
  /** Colored dot in Explorer title badge (only when Show focus badge is on). */
  explorerBadgeShowIndicator: boolean
  onExplorerBadgeShowIndicatorChange: (value: boolean) => void
  /** Full-frame 5% tint by focused viewport while simulating. */
  fullTint: boolean
  onFullTintChange: (value: boolean) => void
  /** Subtle tint on the focused client/server sim viewport while simulating. */
  selectionTint: boolean
  onSelectionTintChange: (value: boolean) => void
  /** Test mode: Client and Server as two columns instead of one tabbed document. */
  splitView: boolean
  onSplitViewChange: (value: boolean) => void
  /** Asset isolation preview in the viewport (Theme settings → Misc). */
  showAssetInIsolation: boolean
  onShowAssetInIsolationChange: (value: boolean) => void
  /** Edit datamodel UI: stroke visibility. */
  editDatamodelShowStroke: boolean
  onEditDatamodelShowStrokeChange: (value: boolean) => void
  /** Right-side panel headers: Explorer / Properties / Theme — title left-aligned vs centered. */
  panelTitlesLeftAligned: boolean
  onPanelTitlesLeftAlignedChange: (value: boolean) => void
  /** When set, shows control to spawn another full Studio frame (stacked in the app shell). */
  onOpenAssetWindow?: () => void
  /** Bunny asset window — hide isolation toggle (layout is fixed). */
  bunnyAssetWindow?: boolean
}

function SliderTickMarks() {
  return (
    <div className={css.sliderTicks} aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className={css.sliderTick} />
      ))}
    </div>
  )
}

export default function InteractionSettingsPanel({
  hasStroke,
  onHasStrokeChange,
  hasFocusStroke,
  onHasFocusStrokeChange,
  explorerFocusBadge,
  onExplorerFocusBadgeChange,
  explorerBadgeShowIndicator,
  onExplorerBadgeShowIndicatorChange,
  fullTint,
  onFullTintChange,
  selectionTint,
  onSelectionTintChange,
  splitView,
  onSplitViewChange,
  showAssetInIsolation,
  onShowAssetInIsolationChange,
  editDatamodelShowStroke,
  onEditDatamodelShowStrokeChange,
  panelTitlesLeftAligned,
  onPanelTitlesLeftAlignedChange,
  onOpenAssetWindow,
  bunnyAssetWindow,
}: InteractionSettingsPanelProps) {
  const [miscOpen, setMiscOpen] = useState(false)
  const indicatorRowDisabled = !explorerFocusBadge

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
    const elements = getSliderElements()
    if (!elements) return undefined
    return bindThemeColorOperators(elements)
  }, [getSliderElements])

  const handleResetTheme = useCallback(() => {
    const elements = getSliderElements()
    if (elements) resetThemeColorOperators(elements)
  }, [getSliderElements])

  return (
    <div className={css.root} data-name="ThemeSettings">
      <section className={css.group} aria-labelledby="theme-color-operators-heading">
        <h2 id="theme-color-operators-heading" className={css.groupLabel}>
          Color operators
        </h2>
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
                list="hue-ticks"
                min={-180}
                max={180}
                step={1}
                defaultValue={0}
              />
              <datalist id="hue-ticks">
                <option value="-180" />
                <option value="-108" />
                <option value="-36" />
                <option value="36" />
                <option value="108" />
                <option value="180" />
              </datalist>
              <SliderTickMarks />
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
                list="sat-ticks"
                min={0}
                max={2}
                step={0.1}
                defaultValue={1}
              />
              <datalist id="sat-ticks">
                <option value="0" />
                <option value="0.4" />
                <option value="0.8" />
                <option value="1.2" />
                <option value="1.6" />
                <option value="2.0" />
              </datalist>
              <SliderTickMarks />
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
                list="light-ticks"
                min={-10}
                max={10}
                step={1}
                defaultValue={0}
              />
              <datalist id="light-ticks">
                <option value="-10" />
                <option value="-6" />
                <option value="-2" />
                <option value="2" />
                <option value="6" />
                <option value="10" />
              </datalist>
              <SliderTickMarks />
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
                list="contrast-ticks"
                min={0.5}
                max={1.5}
                step={0.01}
                defaultValue={1}
              />
              <datalist id="contrast-ticks">
                <option value="0.5" />
                <option value="0.7" />
                <option value="0.9" />
                <option value="1.1" />
                <option value="1.3" />
                <option value="1.5" />
              </datalist>
              <SliderTickMarks />
            </div>
            <span ref={contrastReadoutRef} id="contrastReadout" className={css.sliderReadout}>
              1x
            </span>
          </div>
          <button type="button" className={css.resetBtn} onClick={handleResetTheme}>
            Reset
          </button>
        </div>
      </section>

      <section className={css.collapsible}>
        <button
          type="button"
          className={css.collapsibleHeader}
          aria-expanded={miscOpen}
          aria-controls="theme-settings-misc"
          id="theme-settings-misc-heading"
          onClick={() => setMiscOpen((open) => !open)}
        >
          <ChevronRight
            size={12}
            strokeWidth={2}
            className={`${css.collapsibleChevron} ${miscOpen ? css.collapsibleChevronOpen : ''}`}
            aria-hidden
          />
          <span className={css.collapsibleTitle}>Misc</span>
        </button>
        {miscOpen ? (
          <div
            id="theme-settings-misc"
            className={css.collapsibleBody}
            role="region"
            aria-labelledby="theme-settings-misc-heading"
          >
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
                {onOpenAssetWindow ? (
                  <div className={css.openAssetRow}>
                    <button type="button" className={css.openAssetBtn} onClick={onOpenAssetWindow}>
                      Open asset window
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <section className={css.group} aria-labelledby="interaction-testing-ui-heading">
              <h2 id="interaction-testing-ui-heading" className={css.groupLabel}>
                Testing UI
              </h2>
              <div className={css.options}>
                <div className={css.row}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={hasStroke}
                    aria-label="Has semantic stroke"
                    className={`${css.checkboxBtn} ${hasStroke ? css.checkboxBtnChecked : ''}`}
                    onClick={() => onHasStrokeChange(!hasStroke)}
                  >
                    {hasStroke ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Has semantic stroke</span>
                </div>
                <div className={css.row}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={hasFocusStroke}
                    aria-label="Has focus stroke"
                    className={`${css.checkboxBtn} ${hasFocusStroke ? css.checkboxBtnChecked : ''}`}
                    onClick={() => onHasFocusStrokeChange(!hasFocusStroke)}
                  >
                    {hasFocusStroke ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Has focus stroke</span>
                </div>
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
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
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
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Selection tint</span>
                </div>
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
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Split view</span>
                </div>
              </div>
            </section>

            <section className={css.group} aria-labelledby="interaction-badge-heading">
              <h2 id="interaction-badge-heading" className={css.groupLabel}>
                Badge
              </h2>
              <div className={css.options}>
                <div className={css.row}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={explorerFocusBadge}
                    aria-label="Show focus badge"
                    className={`${css.checkboxBtn} ${explorerFocusBadge ? css.checkboxBtnChecked : ''}`}
                    onClick={() => onExplorerFocusBadgeChange(!explorerFocusBadge)}
                  >
                    {explorerFocusBadge ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span className={css.label}>Show focus badge</span>
                </div>
                <div className={css.row}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={explorerBadgeShowIndicator}
                    aria-label="Show indicator in badge"
                    aria-disabled={indicatorRowDisabled}
                    disabled={indicatorRowDisabled}
                    className={`${css.checkboxBtn} ${explorerBadgeShowIndicator ? css.checkboxBtnChecked : ''}`}
                    onClick={() =>
                      onExplorerBadgeShowIndicatorChange(!explorerBadgeShowIndicator)
                    }
                  >
                    {explorerBadgeShowIndicator ? (
                      <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
                    ) : null}
                  </button>
                  <span
                    className={`${css.label} ${indicatorRowDisabled ? css.labelMuted : ''}`}
                  >
                    Show indicator in badge
                  </span>
                </div>
              </div>
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
            </section>
          </div>
        ) : null}
      </section>
    </div>
  )
}
