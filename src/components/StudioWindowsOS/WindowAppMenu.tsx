import { useEffect, useId, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { isPlaceDockPanelId, placeDockPanelId } from './placeDockPanels'
import { panelDockLabel, type DockPanelId } from './panelDock'
import css from './TestAppMenu.module.css'

const WINDOW_PANEL_TOGGLES = [
  'studioSettings',
  'prototypeSettings',
  placeDockPanelId('level-1'),
  'assetManager',
  'output',
] as const satisfies readonly (DockPanelId | 'studioSettings')[]

export type WindowPanelToggleId = (typeof WINDOW_PANEL_TOGGLES)[number]

function windowPanelLabel(panelId: WindowPanelToggleId): string {
  if (panelId === 'studioSettings') return 'Studio Settings'
  return panelDockLabel(panelId)
}

export type WindowAppMenuProps = {
  triggerClassName?: string
  disabled?: boolean
  /** Phase 2 — bottom-dock place documents in the Window menu. */
  showPlaceDockPanels?: boolean
  assetManagerOpen: boolean
  studioSettingsOpen: boolean
  prototypeSettingsOpen: boolean
  placeLevel1Open: boolean
  outputOpen: boolean
  onTogglePanel: (panelId: WindowPanelToggleId) => void
}

export default function WindowAppMenu({
  triggerClassName,
  disabled = false,
  showPlaceDockPanels = true,
  assetManagerOpen,
  studioSettingsOpen,
  prototypeSettingsOpen,
  placeLevel1Open,
  outputOpen,
  onTogglePanel,
}: WindowAppMenuProps) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const level1DockPanel = placeDockPanelId('level-1')
  const menuPanels = showPlaceDockPanels
    ? WINDOW_PANEL_TOGGLES
    : WINDOW_PANEL_TOGGLES.filter((id) => !isPlaceDockPanelId(id))
  const panelOpen: Record<WindowPanelToggleId, boolean> = {
    studioSettings: studioSettingsOpen,
    prototypeSettings: prototypeSettingsOpen,
    [level1DockPanel]: placeLevel1Open,
    assetManager: assetManagerOpen,
    output: outputOpen,
  }

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
    <div className={css.root} ref={rootRef}>
      <button
        type="button"
        className={`${triggerClassName ?? ''} ${css.trigger} ${open ? css.triggerOpen : ''}`.trim()}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((v) => !v)
        }}
      >
        Window
      </button>
      {open ? (
        <div
          id={menuId}
          className={css.menu}
          role="menu"
          aria-label="Window"
          onClick={() => setOpen(false)}
        >
          {menuPanels.map((panelId) => {
            const checked = panelOpen[panelId]
            return (
              <button
                key={panelId}
                type="button"
                role="menuitemcheckbox"
                className={css.item}
                aria-checked={checked}
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePanel(panelId)
                }}
              >
                <span className={css.itemCheckGutter} aria-hidden>
                  {checked ? <Check size={12} strokeWidth={2.5} /> : null}
                </span>
                <span className={css.itemLabel}>{windowPanelLabel(panelId)}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
