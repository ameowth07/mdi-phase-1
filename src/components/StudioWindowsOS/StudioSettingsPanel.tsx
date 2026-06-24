import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import ColorOperatorSliders, { type ColorOperatorSlidersHandle } from './ColorOperatorSliders'
import ThemePresetDropdown from './ThemePresetDropdown'
import StudioTooltip from './StudioTooltip'
import css from './StudioSettingsPanel.module.css'
import { COLOR_OPERATOR_TOOLTIPS } from './colorOperatorTooltips'
import {
  applyThemePresetOperators,
  applyStudioThemePreset,
  isThemeModifiedFromPreset,
  type StudioThemePresetId,
  type ThemePresetOperatorOverrides,
} from './studioThemePresets'
import type { StudioColorTheme, ThemeOperatorPreset } from './themeColorOperators'
import { readThemeOperatorsFromDocument } from './themeColorOperators'
import {
  isThemeSpectrumMode,
  themeSpectrumContrastRange,
  themeSpectrumSatRange,
} from './themeOperatorMapping'

const NAV_ITEMS = [
  'Studio',
  'Selection',
  'Script Editor',
  'Diagnostic',
  'Networks',
  'Physics',
  'Rendering',
  'Task Scheduler',
] as const

type NavItem = (typeof NAV_ITEMS)[number]

export type StudioSettingsPanelProps = {
  studioColorTheme: StudioColorTheme
  onStudioColorThemeChange: (value: StudioColorTheme) => void
  themePreset: StudioThemePresetId
  onThemePresetChange: (value: StudioThemePresetId) => void
  themeModified: boolean
  onThemeModifiedChange: (value: boolean) => void
  themePresetOverrides: ThemePresetOperatorOverrides
  onThemePresetOverridesChange: (value: ThemePresetOperatorOverrides) => void
  themeSliderStopTicks?: boolean
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

export default function StudioSettingsPanel({
  studioColorTheme,
  onStudioColorThemeChange,
  themePreset,
  onThemePresetChange,
  themeModified,
  onThemeModifiedChange,
  themePresetOverrides,
  onThemePresetOverridesChange,
  themeSliderStopTicks = false,
}: StudioSettingsPanelProps) {
  const [selectedNav, setSelectedNav] = useState<NavItem>('Studio')
  const [searchQuery, setSearchQuery] = useState('')
  const [colorOpen, setColorOpen] = useState(true)
  const slidersRef = useRef<ColorOperatorSlidersHandle>(null)
  const themePresetRef = useRef(themePreset)
  const themePresetOverridesRef = useRef(themePresetOverrides)
  themePresetRef.current = themePreset
  themePresetOverridesRef.current = themePresetOverrides

  const persistPresetOverride = (
    presetId: StudioThemePresetId,
    operators: ThemeOperatorPreset,
    overrides: ThemePresetOperatorOverrides,
  ): ThemePresetOperatorOverrides => {
    if (isThemeModifiedFromPreset(operators, presetId)) {
      return { ...overrides, [presetId]: operators }
    }
    const next = { ...overrides }
    delete next[presetId]
    return next
  }

  const spectrumMode = isThemeSpectrumMode()
  const satRange = useMemo(
    () => (spectrumMode ? themeSpectrumSatRange() : { min: 0, max: 2 }),
    [spectrumMode],
  )
  const contrastRange = useMemo(
    () => (spectrumMode ? themeSpectrumContrastRange() : { min: 0.75, max: 1.25 }),
    [spectrumMode],
  )

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const navItems = NAV_ITEMS.filter((item) =>
    normalizedQuery === '' ? true : item.toLowerCase().includes(normalizedQuery),
  )

  const COLOR_SEARCH_TERMS = ['color', 'theme', 'hue', 'saturation', 'lightness', 'contrast']

  const showColorSection =
    selectedNav === 'Studio' &&
    (normalizedQuery === '' ||
      COLOR_SEARCH_TERMS.some(
        (term) => term.includes(normalizedQuery) || normalizedQuery.includes(term),
      ))

  const handleThemePresetChange = (presetId: StudioThemePresetId) => {
    if (presetId === themePreset) return
    const elements = slidersRef.current?.getElements() ?? null
    const leavingPreset = themePreset
    const currentOperators = readThemeOperatorsFromDocument()
    const nextOverrides = persistPresetOverride(
      leavingPreset,
      currentOperators,
      themePresetOverrides,
    )
    const savedOverride = nextOverrides[presetId]
    const theme = applyThemePresetOperators(presetId, elements, savedOverride)
    onThemePresetOverridesChange(nextOverrides)
    onThemePresetChange(presetId)
    onThemeModifiedChange(
      savedOverride != null && isThemeModifiedFromPreset(savedOverride, presetId),
    )
    if (theme !== studioColorTheme) onStudioColorThemeChange(theme)
  }

  const handleResetTheme = () => {
    const elements = slidersRef.current?.getElements() ?? null
    const nextOverrides = { ...themePresetOverrides }
    delete nextOverrides[themePreset]
    const theme = applyStudioThemePreset(themePreset, elements)
    onThemePresetOverridesChange(nextOverrides)
    onThemeModifiedChange(false)
    if (theme !== studioColorTheme) onStudioColorThemeChange(theme)
  }

  useEffect(() => {
    if (!colorOpen) return undefined
    const elements = slidersRef.current?.getElements()
    if (elements == null) return undefined

    const onOperatorInput = () => {
      const presetId = themePresetRef.current
      const current = readThemeOperatorsFromDocument()
      const modified = isThemeModifiedFromPreset(current, presetId)
      onThemeModifiedChange(modified)
      onThemePresetOverridesChange(
        persistPresetOverride(presetId, current, themePresetOverridesRef.current),
      )
    }

    elements.hueSlider.addEventListener('input', onOperatorInput)
    elements.satSlider.addEventListener('input', onOperatorInput)
    elements.lightSlider.addEventListener('input', onOperatorInput)
    elements.contrastSlider.addEventListener('input', onOperatorInput)
    return () => {
      elements.hueSlider.removeEventListener('input', onOperatorInput)
      elements.satSlider.removeEventListener('input', onOperatorInput)
      elements.lightSlider.removeEventListener('input', onOperatorInput)
      elements.contrastSlider.removeEventListener('input', onOperatorInput)
    }
  }, [themePreset, onThemeModifiedChange, colorOpen])

  return (
    <div className={css.root} data-name="Studio Settings Panel">
      <div className={css.searchRow}>
        <label className={css.searchInput}>
          <Search size={16} strokeWidth={1.75} className={css.searchIcon} aria-hidden />
          <input
            type="search"
            className={css.searchField}
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      <div className={css.body}>
        <nav className={css.nav} aria-label="Studio settings categories">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`${css.navItem} ${selectedNav === item ? css.navItemSelected : ''}`}
              aria-current={selectedNav === item ? 'page' : undefined}
              onClick={() => setSelectedNav(item)}
            >
              <span className={css.navItemLabel}>{item}</span>
            </button>
          ))}
        </nav>

        <div className={css.content}>
          {selectedNav === 'Studio' ? (
            showColorSection ? (
              <section className={css.accordion} aria-labelledby="studio-settings-color-heading">
                <button
                  type="button"
                  id="studio-settings-color-heading"
                  className={css.accordionHeader}
                  aria-expanded={colorOpen}
                  onClick={() => setColorOpen((open) => !open)}
                >
                  <span
                    className={`${css.accordionChevron} ${colorOpen ? '' : css.accordionChevronClosed}`}
                    aria-hidden
                  >
                    <ChevDownSm />
                  </span>
                  Color
                </button>
                {colorOpen ? (
                  <div className={css.accordionBody}>
                    <div className={css.settingRow}>
                      <StudioTooltip
                        title={COLOR_OPERATOR_TOOLTIPS.theme.title}
                        description={COLOR_OPERATOR_TOOLTIPS.theme.description}
                        className={css.settingLabelTooltipHost}
                      >
                        <div className={css.settingLabel}>Theme</div>
                      </StudioTooltip>
                      <div className={css.settingControl}>
                        <div className={css.themeControlRow}>
                          <ThemePresetDropdown
                            value={themePreset}
                            presetOverrides={themePresetOverrides}
                            onChange={handleThemePresetChange}
                          />
                          <StudioTooltip
                            title="Reset"
                            description="Restore the selected theme preset and undo slider changes"
                            align="center"
                            position="bottom"
                            className={css.themeResetTooltipHost}
                          >
                            <button
                              type="button"
                              className={css.themeResetBtn}
                              aria-label="Reset theme to preset"
                              disabled={!themeModified}
                              onClick={handleResetTheme}
                            >
                              <RefreshCw size={14} strokeWidth={2} aria-hidden />
                            </button>
                          </StudioTooltip>
                        </div>
                      </div>
                    </div>
                    <div className={css.colorOperatorSlidersWrap}>
                      <ColorOperatorSliders
                        ref={slidersRef}
                        idPrefix="studio-settings"
                        visibleOperators={['hue', 'saturation', 'lightness', 'contrast']}
                        satMin={satRange.min}
                        satMax={satRange.max}
                        contrastMin={contrastRange.min}
                        contrastMax={contrastRange.max}
                        showStopTicks={themeSliderStopTicks}
                      />
                    </div>
                  </div>
                ) : null}
              </section>
            ) : (
              <p className={css.emptyState}>No matching settings.</p>
            )
          ) : (
            <p className={css.emptyState}>Settings for {selectedNav} are not available yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
