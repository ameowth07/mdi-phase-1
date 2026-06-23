import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import ColorOperatorSliders, { type ColorOperatorSlidersHandle } from './ColorOperatorSliders'
import ThemePresetDropdown from './ThemePresetDropdown'
import StudioTooltip from './StudioTooltip'
import css from './StudioSettingsPanel.module.css'
import { COLOR_OPERATOR_TOOLTIPS } from './colorOperatorTooltips'
import {
  applyStudioThemePreset,
  matchThemePresetFromSurfaceTarget,
  type StudioThemePresetId,
} from './studioThemePresets'
import type { StudioColorTheme } from './themeColorOperators'
import {
  isThemeSpectrumMode,
  matchThemePresetFromSpectrum,
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
}: StudioSettingsPanelProps) {
  const [selectedNav, setSelectedNav] = useState<NavItem>('Studio')
  const [searchQuery, setSearchQuery] = useState('')
  const [colorOpen, setColorOpen] = useState(true)
  const [themeModified, setThemeModified] = useState(false)
  const slidersRef = useRef<ColorOperatorSlidersHandle>(null)
  const themePresetRef = useRef(themePreset)
  themePresetRef.current = themePreset

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
    const elements = slidersRef.current?.getElements() ?? null
    const theme = applyStudioThemePreset(presetId, elements)
    onThemePresetChange(presetId)
    setThemeModified(false)
    if (theme !== studioColorTheme) onStudioColorThemeChange(theme)
  }

  const handleResetTheme = () => {
    const elements = slidersRef.current?.getElements() ?? null
    const theme = applyStudioThemePreset(themePreset, elements)
    setThemeModified(false)
    if (theme !== studioColorTheme) onStudioColorThemeChange(theme)
  }

  useLayoutEffect(() => {
    if (!colorOpen) return
    const elements = slidersRef.current?.getElements() ?? null
    if (elements == null) return
    applyStudioThemePreset(themePreset, elements)
    setThemeModified(false)
  }, [themePreset, colorOpen])

  useEffect(() => {
    if (!colorOpen) return undefined
    const elements = slidersRef.current?.getElements()
    if (elements == null) return undefined

    const onOperatorInput = () => {
      const hue = Number(elements.hueSlider.value)
      const sat = Number(elements.satSlider.value)
      const light = Number(elements.lightSlider.value)
      const contrast = Number(elements.contrastSlider.value)
      const matched = spectrumMode
        ? matchThemePresetFromSpectrum(sat, contrast, studioColorTheme)
        : matchThemePresetFromSurfaceTarget(hue, sat, light, contrast, studioColorTheme)

      if (matched == null) {
        setThemeModified(true)
        return
      }

      setThemeModified(false)
      if (matched !== themePresetRef.current) onThemePresetChange(matched)
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
  }, [spectrumMode, studioColorTheme, onThemePresetChange, colorOpen])

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
                            modified={themeModified}
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
