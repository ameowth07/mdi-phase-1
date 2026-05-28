import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import type { SimDocumentStripTab } from './documentTabClose'
import { simClientInstanceId, simClientInstanceLabel } from './simMultiClient'
import css from './TestAppMenu.module.css'

type TestMenuEntry =
  | { kind: 'separator' }
  | {
      kind: 'item'
      label: string
      disabled?: boolean
      shortcut?: string
      hasSubmenu?: boolean
    }

const TEST_MENU_ENTRIES: TestMenuEntry[] = [
  { kind: 'item', label: 'Start Test Session', hasSubmenu: true },
  { kind: 'separator' },
  { kind: 'item', label: 'Device Emulator' },
  { kind: 'item', label: 'Controller Emulator' },
  { kind: 'item', label: 'Player Emulator' },
  { kind: 'separator' },
  { kind: 'item', label: 'Debug Error', hasSubmenu: true },
  { kind: 'item', label: 'Reload Script', disabled: true, shortcut: '⌘ R' },
  { kind: 'separator' },
  { kind: 'item', label: 'Pause', disabled: true },
  { kind: 'item', label: 'Pause Client/Server', disabled: true },
  { kind: 'separator' },
  { kind: 'item', label: 'Stop', disabled: true, shortcut: '⇧ F5' },
  { kind: 'item', label: 'End Session', disabled: true },
  { kind: 'item', label: 'Exit Team Test', disabled: true },
  { kind: 'item', label: 'Exit Client', disabled: true },
]

export type TestAppMenuFocusTarget = 'server' | 'client' | { clientIndex: number }

export type TestAppMenuProps = {
  /** Match app bar menu labels (e.g. StudioWindowsOS `menuItem`). */
  triggerClassName?: string
  disabled?: boolean
  /** Active play session — focus targets appear at the end of the menu. */
  simulating?: boolean
  simMultiClientMode?: boolean
  simClientInstanceCount?: number
  /** Whether Client / Server datamodel tabs are open in the document strip. */
  simClientTabOpen?: boolean
  simServerTabOpen?: boolean
  simDocumentTabOrder?: readonly SimDocumentStripTab[]
  onToggleView?: (target: TestAppMenuFocusTarget) => void
}

function isViewActiveInWindow(
  target: TestAppMenuFocusTarget,
  simClientTabOpen: boolean,
  simServerTabOpen: boolean,
  simDocumentTabOrder: readonly SimDocumentStripTab[],
): boolean {
  if (target === 'server') {
    return simServerTabOpen
  }
  if (target === 'client') {
    return simClientTabOpen
  }
  return simClientTabOpen && simDocumentTabOrder.includes(simClientInstanceId(target.clientIndex))
}

export default function TestAppMenu({
  triggerClassName,
  disabled = false,
  simulating = false,
  simMultiClientMode = false,
  simClientInstanceCount = 1,
  simClientTabOpen = true,
  simServerTabOpen = true,
  simDocumentTabOrder = [],
  onToggleView,
}: TestAppMenuProps) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const showFocusTargets = simulating && !disabled && onToggleView != null

  const focusTargets: TestMenuMenuFocusRow[] = showFocusTargets
    ? simMultiClientMode
      ? [
          { target: 'server' as const, label: 'Server' },
          ...Array.from({ length: simClientInstanceCount }, (_, i) => ({
            target: { clientIndex: i + 1 } as const,
            label: simClientInstanceLabel(i + 1),
          })),
        ]
      : [
          { target: 'server' as const, label: 'Server' },
          { target: 'client' as const, label: 'Client' },
        ]
    : []

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
        Test
      </button>
      {open ? (
        <div
          id={menuId}
          className={css.menu}
          role="menu"
          aria-label="Test"
          onClick={() => setOpen(false)}
        >
          {TEST_MENU_ENTRIES.map((entry, index) => {
            if (entry.kind === 'separator') {
              return <div key={`sep-${index}`} className={css.separator} role="separator" />
            }

            return (
              <button
                key={entry.label}
                type="button"
                role="menuitem"
                className={css.item}
                disabled={entry.disabled}
                aria-haspopup={entry.hasSubmenu ? 'menu' : undefined}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!entry.disabled) setOpen(false)
                }}
              >
                <span className={css.itemCheckGutter} aria-hidden />
                <span className={css.itemLabel}>{entry.label}</span>
                {entry.shortcut ? (
                  <span className={css.itemShortcut} aria-hidden>
                    {entry.shortcut}
                  </span>
                ) : null}
                {entry.hasSubmenu ? (
                  <span className={css.itemSubmenu} aria-hidden>
                    <ChevronRight size={12} strokeWidth={2} />
                  </span>
                ) : null}
              </button>
            )
          })}
          {showFocusTargets ? (
            <>
              <div className={css.separator} role="separator" />
              {focusTargets.map(({ target, label }) => {
                const checked = isViewActiveInWindow(
                  target,
                  simClientTabOpen,
                  simServerTabOpen,
                  simDocumentTabOrder,
                )
                return (
                  <button
                    key={typeof target === 'string' ? target : `client-${target.clientIndex}`}
                    type="button"
                    role="menuitemcheckbox"
                    className={css.item}
                    aria-checked={checked}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleView?.(target)
                    }}
                  >
                    <span className={css.itemCheckGutter} aria-hidden>
                      {checked ? <Check size={12} strokeWidth={2.5} /> : null}
                    </span>
                    <span className={css.itemLabel}>{label}</span>
                  </button>
                )
              })}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

type TestMenuMenuFocusRow = {
  target: TestAppMenuFocusTarget
  label: string
}
