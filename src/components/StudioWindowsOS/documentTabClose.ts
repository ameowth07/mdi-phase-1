import type { MainDocumentEditorTab } from './prototypeDefaults'

/** Ordered closable tabs after the primary document tab in a strip. */
export const MAIN_SCRIPT_TAB_ORDER = [
  'scriptA',
  'scriptB',
  'clientScript',
  'serverScript',
] as const satisfies readonly MainDocumentEditorTab[]

export type MainScriptTabId = (typeof MAIN_SCRIPT_TAB_ORDER)[number]

export type EditIsolationTabId = 'isolation' | 'hoverScript'

export const EDIT_ISOLATION_TAB_ORDER = ['isolation', 'hoverScript'] as const

export function isMainScriptTabOpen(
  tab: MainScriptTabId,
  open: {
    scriptA: boolean
    scriptB: boolean
    clientScript: boolean
    serverScript: boolean
  },
): boolean {
  return open[tab]
}

/** Hide a tab and, if it was active, activate the visible tab immediately to its left. */
export function closeTabFocusLeft<T extends string, A extends string>(
  order: readonly T[],
  isOpen: (tab: T) => boolean,
  closing: T,
  active: A,
  setActive: (tab: A) => void,
  setOpen: (tab: T, open: boolean) => void,
  fallbackActive: A,
): void {
  const visibleBefore = order.filter(isOpen)
  const idx = visibleBefore.indexOf(closing)
  if (idx < 0) return

  setOpen(closing, false)

  if (active !== (closing as unknown as A)) return

  const left: A =
    idx > 0
      ? (visibleBefore[idx - 1]! as unknown as A)
      : ((order.find((t) => t !== closing && isOpen(t)) as unknown as A | undefined) ??
        fallbackActive)
  setActive(left)
}
