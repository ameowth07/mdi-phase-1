import {
  useLayoutEffect,
  useRef,
  type DependencyList,
  type RefObject,
} from 'react'

export type ConnectedTabGutterClassNames = {
  tabRow: string
  tabActiveTopStrokeClient: string
  tabActiveTopStrokeServer: string
  /** Isolation tab row — also sets stroke color on the column panel for inset ring. */
  assetIsolationTabRow?: string
  assetIsolationPanel?: string
}

type GutterVars = {
  leftWidth: number
  rightWidth: number
  color: string
}

function strokeColorForTab(
  tab: HTMLElement,
  classNames: ConnectedTabGutterClassNames,
): string {
  if (tab.classList.contains(classNames.tabActiveTopStrokeClient)) {
    return 'var(--semantic-client-stroke)'
  }
  if (tab.classList.contains(classNames.tabActiveTopStrokeServer)) {
    return 'var(--semantic-server-stroke)'
  }
  return 'var(--semantic-drone-stroke)'
}

function clearGutterVars(el: HTMLElement) {
  el.style.removeProperty('--tab-connected-gutter-left-width')
  el.style.removeProperty('--tab-connected-gutter-right-width')
  el.style.removeProperty('--tab-connected-stroke-color')
}

function clearIsolationPanelStroke(panel: HTMLElement | null) {
  if (panel) panel.style.removeProperty('--tab-connected-stroke-color')
}

function applyGutterVars(row: HTMLElement, vars: GutterVars) {
  row.style.setProperty('--tab-connected-gutter-left-width', `${vars.leftWidth}px`)
  row.style.setProperty('--tab-connected-gutter-right-width', `${vars.rightWidth}px`)
  row.style.setProperty('--tab-connected-stroke-color', vars.color)
}

function gutterVarsEqual(a: GutterVars, b: GutterVars): boolean {
  return a.leftWidth === b.leftWidth && a.rightWidth === b.rightWidth && a.color === b.color
}

function measureRowGutter(row: HTMLElement, tab: HTMLElement, classNames: ConnectedTabGutterClassNames): GutterVars | null {
  const rowRect = row.getBoundingClientRect()
  const tabRect = tab.getBoundingClientRect()
  const leftWidth = Math.max(0, tabRect.left - rowRect.left)
  const rightWidth = Math.max(0, rowRect.right - tabRect.right)

  if (leftWidth <= 0 && rightWidth <= 0) return null

  return {
    leftWidth,
    rightWidth,
    color: strokeColorForTab(tab, classNames),
  }
}

/** Sets gutter CSS variables on each tab row that has a selected tab (Tab stroke connected). */
export function useConnectedTabGutterMetrics(
  enabled: boolean,
  panelRef: RefObject<HTMLElement | null>,
  classNames: ConnectedTabGutterClassNames,
  deps: DependencyList,
): void {
  const trackedRowsRef = useRef<Set<HTMLElement>>(new Set())
  const lastVarsByRowRef = useRef<WeakMap<HTMLElement, GutterVars>>(new WeakMap())

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!enabled || !panel) {
      for (const row of trackedRowsRef.current) {
        clearGutterVars(row)
      }
      const root = panelRef.current
      if (classNames.assetIsolationPanel && root) {
        clearIsolationPanelStroke(root.querySelector<HTMLElement>(`.${classNames.assetIsolationPanel}`))
      }
      trackedRowsRef.current = new Set()
      lastVarsByRowRef.current = new WeakMap()
      return
    }

    const update = () => {
      const nextTracked = new Set<HTMLElement>()
      const rows = panel.querySelectorAll<HTMLElement>(`.${classNames.tabRow}`)

      rows.forEach((row) => {
        const tab = row.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
        if (!tab) {
          if (trackedRowsRef.current.has(row)) clearGutterVars(row)
          return
        }

        nextTracked.add(row)
        const isoRowClass = classNames.assetIsolationTabRow
        const isoPanelClass = classNames.assetIsolationPanel
        const isIsolationRow =
          isoRowClass != null && isoPanelClass != null && row.classList.contains(isoRowClass)
        const isoPanel = isIsolationRow
          ? panel.querySelector<HTMLElement>(`.${isoPanelClass}`)
          : null
        const isolationColumnFocused = isoPanel?.hasAttribute('data-isolation-column-focused') ?? false

        if (isIsolationRow && !isolationColumnFocused) {
          clearGutterVars(row)
          clearIsolationPanelStroke(isoPanel)
          lastVarsByRowRef.current.delete(row)
          return
        }

        const next = measureRowGutter(row, tab, classNames)
        if (!next) {
          clearGutterVars(row)
          lastVarsByRowRef.current.delete(row)
          return
        }

        const last = lastVarsByRowRef.current.get(row)
        if (last && gutterVarsEqual(last, next)) return

        lastVarsByRowRef.current.set(row, next)
        applyGutterVars(row, next)

        if (isIsolationRow && isoPanel != null && isolationColumnFocused) {
          isoPanel.style.setProperty('--tab-connected-stroke-color', next.color)
        }
      })

      for (const row of trackedRowsRef.current) {
        if (!nextTracked.has(row)) {
          clearGutterVars(row)
          const isoRowClass = classNames.assetIsolationTabRow
          const isoPanelClass = classNames.assetIsolationPanel
          if (isoRowClass && isoPanelClass && row.classList.contains(isoRowClass)) {
            clearIsolationPanelStroke(panel.querySelector<HTMLElement>(`.${isoPanelClass}`))
          }
        }
      }
      trackedRowsRef.current = nextTracked
    }

    update()

    const ro = new ResizeObserver(update)
    ro.observe(panel)

    const mo = new MutationObserver((records) => {
      if (
        records.some(
          (record) =>
            record.attributeName === 'aria-selected' ||
            record.attributeName === 'data-isolation-column-focused',
        )
      ) {
        update()
      }
    })
    mo.observe(panel, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-selected', 'data-isolation-column-focused'],
    })

    window.addEventListener('resize', update)

    return () => {
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener('resize', update)
      for (const row of trackedRowsRef.current) {
        clearGutterVars(row)
      }
      if (classNames.assetIsolationPanel) {
        clearIsolationPanelStroke(panel.querySelector<HTMLElement>(`.${classNames.assetIsolationPanel}`))
      }
      trackedRowsRef.current = new Set()
      lastVarsByRowRef.current = new WeakMap()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies semantic deps
  }, [
    enabled,
    panelRef,
    classNames.tabRow,
    classNames.tabActiveTopStrokeClient,
    classNames.tabActiveTopStrokeServer,
    classNames.assetIsolationTabRow,
    classNames.assetIsolationPanel,
    ...deps,
  ])
}
