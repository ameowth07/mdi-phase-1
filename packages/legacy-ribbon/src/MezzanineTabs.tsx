import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import css from './ribbon.module.css'
import { RibbonOverflowIcon, RibbonPlusIcon } from './icons/mezzanineIcons'

const RIBBON_TABS = ['Home', 'Model', 'Avatar', 'UI', 'Script'] as const
export type RibbonTabId = (typeof RIBBON_TABS)[number]

const TAB_WIDTH = 80
const TAB_GAP = 4
const OVERFLOW_BTN_WIDTH = 28

type MezzanineTabsProps = {
  onMenuOpenChange?: (open: boolean) => void
}

function computeTabLayout(centerWidth: number, activeTab: RibbonTabId) {
  const tabs = [...RIBBON_TABS]
  let visible = [...tabs]
  const overflow: RibbonTabId[] = []

  const rowWidth = (count: number) =>
    count > 0 ? count * TAB_WIDTH + (count - 1) * TAB_GAP : 0

  const fits = (visibleCount: number, overflowCount: number) => {
    const reserved =
      TAB_WIDTH +
      TAB_GAP +
      (overflowCount > 0 ? OVERFLOW_BTN_WIDTH + TAB_GAP : 0)
    return rowWidth(visibleCount) + reserved <= centerWidth
  }

  while (!fits(visible.length, overflow.length)) {
    if (visible.length <= 1) break

    let removeIndex = -1
    for (let i = visible.length - 1; i >= 0; i -= 1) {
      if (visible[i] !== activeTab) {
        removeIndex = i
        break
      }
    }
    if (removeIndex === -1) break

    const [removed] = visible.splice(removeIndex, 1)
    overflow.unshift(removed)
  }

  return { visible, overflow }
}

export default function MezzanineTabs({ onMenuOpenChange }: MezzanineTabsProps) {
  const overflowMenuId = useId()
  const centerRef = useRef<HTMLDivElement>(null)
  const overflowWrapRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<RibbonTabId>('Home')
  const [visibleTabs, setVisibleTabs] = useState<RibbonTabId[]>([...RIBBON_TABS])
  const [overflowTabs, setOverflowTabs] = useState<RibbonTabId[]>([])
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false)

  const recomputeLayout = useCallback(() => {
    const center = centerRef.current
    if (!center) return

    const { visible, overflow } = computeTabLayout(center.clientWidth, activeTab)
    setVisibleTabs(visible)
    setOverflowTabs(overflow)
    if (overflow.length === 0) setOverflowMenuOpen(false)
  }, [activeTab])

  useLayoutEffect(() => {
    recomputeLayout()
    const center = centerRef.current
    if (!center) return undefined

    const ro = new ResizeObserver(() => recomputeLayout())
    ro.observe(center)
    return () => ro.disconnect()
  }, [recomputeLayout])

  useEffect(() => {
    onMenuOpenChange?.(overflowMenuOpen)
  }, [overflowMenuOpen, onMenuOpenChange])

  useEffect(() => {
    if (!overflowMenuOpen) return undefined

    const onPointerDown = (event: PointerEvent) => {
      if (!overflowWrapRef.current?.contains(event.target as Node)) {
        setOverflowMenuOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOverflowMenuOpen(false)
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [overflowMenuOpen])

  const renderTab = (tab: RibbonTabId, inOverflowMenu = false) => {
    const active = tab === activeTab
    return (
      <button
        key={tab}
        type="button"
        role={inOverflowMenu ? 'menuitem' : 'tab'}
        aria-selected={inOverflowMenu ? undefined : active}
        className={`${css.ribbonTab} ${active ? css.ribbonTabActive : ''} ${
          inOverflowMenu ? css.ribbonTabOverflowOption : ''
        }`}
        onClick={() => {
          setActiveTab(tab)
          if (inOverflowMenu) setOverflowMenuOpen(false)
        }}
      >
        {tab}
      </button>
    )
  }

  return (
    <div ref={centerRef} className={css.mezzCenter} data-node-id="3841:115017">
      <div className={css.centerTabsScroll} role="tablist" aria-label="Ribbon tabs">
        <div className={css.centerTabsInner}>
          {visibleTabs.map((tab) => renderTab(tab))}
          <button
            type="button"
            role="tab"
            aria-selected={false}
            className={`${css.ribbonTab} ${css.ribbonTabAdd}`}
            aria-label="Add tab"
          >
            <RibbonPlusIcon />
          </button>
        </div>
      </div>

      {overflowTabs.length > 0 ? (
        <div className={css.tabOverflowWrap} ref={overflowWrapRef}>
          <div className={css.tabOverflowAnchor}>
            <button
              type="button"
              className={`${css.tabOverflowBtn} ${overflowMenuOpen ? css.tabOverflowBtnOpen : ''}`}
              aria-haspopup="menu"
              aria-expanded={overflowMenuOpen}
              aria-controls={overflowMenuOpen ? overflowMenuId : undefined}
              aria-label="More ribbon tabs"
              onClick={() => setOverflowMenuOpen((open) => !open)}
            >
              <RibbonOverflowIcon />
            </button>
            {overflowMenuOpen ? (
              <div
                id={overflowMenuId}
                className={css.tabOverflowMenu}
                role="menu"
                aria-label="Overflow ribbon tabs"
              >
                {overflowTabs.map((tab) => renderTab(tab, true))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
