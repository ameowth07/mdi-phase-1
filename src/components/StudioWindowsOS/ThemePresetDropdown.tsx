import { useEffect, useId, useRef, useState } from 'react'
import css from './StudioSettingsPanel.module.css'
import {
  STUDIO_THEME_PRESET_OPTIONS,
  studioThemePresetLabel,
  type StudioThemePresetId,
} from './studioThemePresets'

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

export type ThemePresetDropdownProps = {
  value: StudioThemePresetId
  onChange: (presetId: StudioThemePresetId) => void
}

export default function ThemePresetDropdown({ value, onChange }: ThemePresetDropdownProps) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={css.themeMenuRoot} ref={rootRef}>
      <button
        type="button"
        className={`${css.themeSelect} ${open ? css.themeSelectOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={css.themeSelectLabel}>{studioThemePresetLabel(value)}</span>
        <span className={css.themeSelectChevron} aria-hidden>
          <ChevDownSm />
        </span>
      </button>
      {open ? (
        <ul
          id={menuId}
          className={css.themeMenu}
          role="listbox"
          aria-label="Theme"
          onClick={() => setOpen(false)}
        >
          {STUDIO_THEME_PRESET_OPTIONS.map((option) => {
            const selected = option.id === value
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`${css.themeMenuItem} ${selected ? css.themeMenuItemSelected : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(option.id)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
