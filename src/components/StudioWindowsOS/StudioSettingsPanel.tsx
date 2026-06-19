import { useRef, useState } from 'react'
import { Search } from 'lucide-react'
import ColorOperatorSliders, { type ColorOperatorSlidersHandle } from './ColorOperatorSliders'
import ThemePresetDropdown from './ThemePresetDropdown'
import css from './StudioSettingsPanel.module.css'
import {
  applyStudioThemePreset,
  type StudioThemePresetId,
} from './studioThemePresets'
import type { StudioColorTheme } from './themeColorOperators'

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
  const slidersRef = useRef<ColorOperatorSlidersHandle>(null)

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
    if (theme !== studioColorTheme) onStudioColorThemeChange(theme)
  }

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
                      <div className={css.settingLabel}>Theme</div>
                      <div className={css.settingControl}>
                        <ThemePresetDropdown
                          value={themePreset}
                          onChange={handleThemePresetChange}
                        />
                      </div>
                    </div>
                    <div className={css.colorOperatorSlidersWrap}>
                      <ColorOperatorSliders
                        ref={slidersRef}
                        idPrefix="studio-settings"
                        visibleOperators={['saturation', 'contrast']}
                        contrastMin={0.75}
                        contrastMax={1.25}
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
