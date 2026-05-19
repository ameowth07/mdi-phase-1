import { ChevronDown, Search, SquareArrowOutUpRight } from 'lucide-react'
import { publicAssetUrl } from '../../publicAssetUrl'
import css from './OutputPanel.module.css'

export type OutputLogVariant = 'default' | 'error'

export type OutputLogEntry = {
  id: string
  timestamp: string
  message: string
  variant?: OutputLogVariant
}

export type OutputPanelProps = {
  entries: OutputLogEntry[]
  onClose?: () => void
  titleAlign?: 'left' | 'center'
  onErrorRowClick?: (entry: OutputLogEntry) => void
}

export default function OutputPanel({
  entries,
  onClose,
  titleAlign = 'left',
  onErrorRowClick,
}: OutputPanelProps) {
  return (
    <section
      className={css.root}
      data-name="Output Panel"
      data-node-id="4032:63343"
      aria-label="Output"
    >
      <header className={css.header} data-node-id="4032:63344">
        <p
          className={`${css.title} ${
            titleAlign === 'left' ? css.titleAlignLeft : css.titleAlignCenter
          }`}
        >
          Output
        </p>
        <div className={css.headerActions}>
          <button type="button" className={css.headerBtn} aria-label="Pop out panel">
            <SquareArrowOutUpRight
              size={12}
              strokeWidth={1.35}
              className={css.headerPopoutIcon}
              aria-hidden
            />
          </button>
          <button
            type="button"
            className={css.headerBtn}
            aria-label="Close panel"
            onClick={onClose}
          >
            <img src={publicAssetUrl('assets/panel-close.svg')} alt="" />
          </button>
        </div>
      </header>

      <div className={css.body} data-node-id="4032:63352">
        <div className={css.toolbar} data-node-id="4032:64171">
          <div className={css.toolbarFilters}>
            <button type="button" className={css.dropdown} aria-label="Message filter">
              <span className={css.dropdownLabel}>All Messages</span>
              <ChevronDown size={12} strokeWidth={2} aria-hidden />
            </button>
            <button type="button" className={css.dropdown} aria-label="Context filter">
              <span className={css.dropdownLabel}>All Contexts</span>
              <ChevronDown size={12} strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className={css.toolbarTools}>
            <div className={css.searchField} aria-hidden>
              <Search size={14} strokeWidth={1.5} aria-hidden />
              <span className={css.searchPlaceholder}>Filter</span>
            </div>
            <button type="button" className={css.iconBtn} aria-label="Pop out panel">
              <SquareArrowOutUpRight size={12} strokeWidth={1.35} aria-hidden />
            </button>
          </div>
        </div>

        <div className={css.log} role="log" aria-live="polite" aria-relevant="additions">
          {entries.map((entry) => {
            const isError = entry.variant === 'error'
            return (
              <div
                key={entry.id}
                className={isError ? `${css.logRow} ${css.logRowError}` : css.logRow}
                data-name=".OutputRow"
                data-node-id="4032:64179"
                role={isError && onErrorRowClick ? 'button' : undefined}
                tabIndex={isError && onErrorRowClick ? 0 : undefined}
                onClick={
                  isError && onErrorRowClick ? () => onErrorRowClick(entry) : undefined
                }
                onKeyDown={
                  isError && onErrorRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onErrorRowClick(entry)
                        }
                      }
                    : undefined
                }
              >
                <span className={css.logIndicator} aria-hidden />
                <p className={isError ? `${css.logLine} ${css.logLineError}` : css.logLine}>
                  <span className={css.logTimestamp}>{entry.timestamp}</span>
                  {'  '}
                  {entry.message}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
