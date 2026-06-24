import { useMemo, useState } from 'react'
import { Search, SquareArrowOutUpRight } from 'lucide-react'
import amCss from './AssetManagerPanel.module.css'
import { PanelCloseIcon } from './documentTabIcons'
import { TOOLBOX_CATEGORIES, type ToolboxItem } from './toolboxCatalog'
import css from './ToolboxPanel.module.css'

export type ToolboxPanelProps = {
  fillDock?: boolean
  titleAlign?: 'left' | 'center'
  hideHeader?: boolean
  onClose?: () => void
  onHeaderPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
}

export default function ToolboxPanel({
  fillDock = false,
  titleAlign = 'center',
  hideHeader = false,
  onClose,
  onHeaderPointerDown,
}: ToolboxPanelProps) {
  const [query, setQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>('block')

  const categories = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return TOOLBOX_CATEGORIES
    return TOOLBOX_CATEGORIES.map((category) => ({
      ...category,
      items: category.items.filter((item) => item.name.toLowerCase().includes(normalized)),
    })).filter((category) => category.items.length > 0)
  }, [query])

  const renderItem = (item: ToolboxItem) => {
    const selected = selectedItemId === item.id
    return (
      <button
        key={item.id}
        type="button"
        className={`${css.itemBtn} ${selected ? css.itemBtnSelected : ''}`}
        aria-pressed={selected}
        onClick={() => setSelectedItemId(item.id)}
      >
        <span className={css.itemThumb} aria-hidden />
        <span>{item.name}</span>
      </button>
    )
  }

  return (
    <section
      className={`${amCss.root} ${fillDock ? amCss.rootFillDock : ''} ${hideHeader ? amCss.rootEmbedded : ''}`}
      data-name="Toolbox Panel"
      aria-label="Toolbox"
    >
      {hideHeader ? null : (
        <header
          className={`${amCss.header} ${onHeaderPointerDown ? amCss.headerDraggable : ''}`}
          onPointerDown={onHeaderPointerDown}
        >
          <p
            className={`${amCss.title} ${
              titleAlign === 'left' ? amCss.titleAlignLeft : amCss.titleAlignCenter
            }`}
          >
            Toolbox
          </p>
          <div className={amCss.headerActions}>
            <button type="button" className={amCss.headerBtn} aria-label="Pop out panel">
              <SquareArrowOutUpRight
                size={12}
                strokeWidth={1.35}
                className={amCss.headerPopoutIcon}
                aria-hidden
              />
            </button>
            <button
              type="button"
              className={amCss.headerBtn}
              aria-label="Close panel"
              onClick={onClose}
            >
              <PanelCloseIcon />
            </button>
          </div>
        </header>
      )}

      <div className={amCss.body}>
        <div className={css.searchRow}>
          <label className={css.searchField}>
            <Search size={14} strokeWidth={1.5} aria-hidden />
            <input
              type="search"
              className={css.searchInput}
              placeholder="Search toolbox"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className={amCss.content}>
          <div className={amCss.tableWrap}>
            <div className={css.scroll}>
              {categories.map((category) => (
                <section key={category.id} className={css.category} aria-label={category.label}>
                  <h3 className={css.categoryLabel}>{category.label}</h3>
                  <div className={css.itemGrid}>{category.items.map(renderItem)}</div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
