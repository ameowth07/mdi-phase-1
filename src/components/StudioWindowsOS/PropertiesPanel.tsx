import type { ReactNode } from 'react'
import { Anchor, Check, Lock, MoreHorizontal, Package2 } from 'lucide-react'
import css from './PropertiesPanel.module.css'

function ChevDownSm() {
  return (
    <svg width={10} height={6} viewBox="0 0 10 6" aria-hidden>
      <path d="M1 1.2L5 4.8L9 1.2" fill="none" stroke="#f7f7f8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PartLeadingIcon() {
  return (
    <div className={css.partIcon} aria-hidden>
      <Package2 size={14} strokeWidth={1.5} />
    </div>
  )
}

function LockIcon() {
  return (
    <button type="button" className={css.toggleIcon} aria-label="Lock">
      <Lock size={12} strokeWidth={1.75} aria-hidden />
    </button>
  )
}

function AnchorIcon() {
  return (
    <button type="button" className={css.toggleIcon} aria-label="Anchor">
      <Anchor size={12} strokeWidth={1.75} aria-hidden />
    </button>
  )
}

function MoreIcon() {
  return (
    <div className={css.moreDots} aria-hidden>
      <MoreHorizontal size={14} strokeWidth={1.75} />
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className={css.sectionHeader}>
      <div className={css.sectionChevron}>
        <ChevDownSm />
      </div>
      <h3 className={css.sectionTitle}>{title}</h3>
    </div>
  )
}

function PropRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className={css.row}>
      <div className={css.labelCol}>
        <div className={css.labelSpacer} />
        <span className={css.label}>{label}</span>
      </div>
      <div className={css.valueCol}>{children}</div>
    </div>
  )
}

type PropertiesPanelProps = {
  /** No Explorer selection — hide part inspector (client sim, etc.). */
  empty?: boolean
}

/** Figma node 3841:115199 — Properties “full” slot */
export default function PropertiesPanel({ empty }: PropertiesPanelProps) {
  if (empty) {
    return (
      <div className={css.root} data-node-id="3841:115199">
        <div className={css.emptyState}>
          <p className={css.emptyHint}>Select an instance in Explorer to edit properties.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={css.root} data-node-id="3841:115199">
      <div className={css.frontmatter}>
        <div className={css.titleRow}>
          <PartLeadingIcon />
          <p className={css.titleText}>Mypart</p>
        </div>
        <div className={css.toggles}>
          <LockIcon />
          <AnchorIcon />
          <MoreIcon />
        </div>
      </div>

      <div className={css.facets}>
        <div className={css.chips}>
          <button type="button" className={`${css.chip} ${css.chipActive}`}>
            General
          </button>
          <button type="button" className={`${css.chip} ${css.chipInactive}`}>
            Attributes &amp; Tags
          </button>
          <button type="button" className={`${css.chip} ${css.chipInactive}`}>
            All
          </button>
        </div>
      </div>

      <div className={css.scroll}>
        <SectionHeader title="Appearance" />

        <PropRow label="Material">
          <div className={`${css.inputShell} ${css.inputShellDropdown}`}>
            <div className={css.leadSwatch}>
              <div className={css.leadSwatchInner}>
                <div className={css.materialSwatchLucide} aria-hidden />
              </div>
            </div>
            <span className={css.inputText}>Plastic</span>
            <div className={css.trailChev}>
              <ChevDownSm />
            </div>
          </div>
        </PropRow>

        <PropRow label="Color">
          <div className={css.rgbRow}>
            <div className={css.colorSwatchSeg}>
              <div className={css.swatchSq} />
            </div>
            <div className={css.vDiv} />
            <div className={`${css.numCell} ${css.numCellFirst}`}>
              <span className={`${css.axisLine} ${css.axisX}`} />
              <span className={css.mono} style={{ marginLeft: 6 }}>
                163
              </span>
            </div>
            <div className={css.vDiv} />
            <div className={`${css.numCell} ${css.numCellMid}`}>
              <span className={`${css.axisLine} ${css.axisY}`} />
              <span className={css.mono} style={{ marginLeft: 6 }}>
                162
              </span>
            </div>
            <div className={css.vDiv} />
            <div className={`${css.numCell} ${css.numCellLast}`}>
              <span className={`${css.axisLine} ${css.axisZ}`} />
              <span className={css.mono} style={{ marginLeft: 6 }}>
                165
              </span>
            </div>
          </div>
        </PropRow>

        <PropRow label="Transparency">
          <div className={`${css.inputShell} ${css.inputShellTight}`}>
            <span className={`${css.mono} ${css.inputText}`}>0</span>
          </div>
        </PropRow>

        <PropRow label="Reflectance">
          <div className={`${css.inputShell} ${css.inputShellTight}`}>
            <span className={`${css.mono} ${css.inputText}`}>0</span>
          </div>
        </PropRow>

        <PropRow label="Shape">
          <div className={`${css.inputShell} ${css.inputShellDropdown}`}>
            <span className={css.inputText}>
              Block <span className={css.inputMuted}>(enabled)</span>
            </span>
            <div className={css.trailChev}>
              <ChevDownSm />
            </div>
          </div>
        </PropRow>

        <PropRow label="Cast Shadow">
          <div className={css.checkboxCell}>
            <div className={css.checkbox}>
              <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
            </div>
          </div>
        </PropRow>

        <div className={css.sectionRule} aria-hidden>
          <div className={css.sectionRuleLine} />
        </div>

        <div className={css.sectionHeader}>
          <div className={css.sectionChevron}>
            <ChevDownSm />
          </div>
          <h3 className={css.originTitle}>Origin</h3>
          <MoreIcon />
        </div>

        <PropRow label="Position">
          <div className={css.rgbRow}>
            <div className={`${css.numCell} ${css.numCellFirst}`}>
              <span className={`${css.axisLine} ${css.axisX}`} />
              <span className={css.mono} style={{ marginLeft: 6 }}>
                0
              </span>
            </div>
            <div className={`${css.numCell} ${css.numCellMid}`}>
              <span className={`${css.axisLine} ${css.axisY}`} />
              <span className={css.mono} style={{ marginLeft: 6 }}>
                0
              </span>
            </div>
            <div className={`${css.numCell} ${css.numCellLast}`}>
              <span className={`${css.axisLine} ${css.axisZ}`} />
              <span className={css.mono} style={{ marginLeft: 6 }}>
                0
              </span>
            </div>
          </div>
        </PropRow>

        <PropRow label="Orientation">
          <div className={css.rgbRow}>
            <div className={`${css.numCell} ${css.numCellFirst}`}>
              <span className={`${css.axisLine} ${css.axisX}`} />
              <span className={css.mono} style={{ marginLeft: 6 }}>
                0
              </span>
              <span className={css.inputMuted} style={{ fontSize: 11 }}>
                °
              </span>
            </div>
            <div className={`${css.numCell} ${css.numCellMid}`}>
              <span className={`${css.axisLine} ${css.axisY}`} />
              <span className={css.mono} style={{ marginLeft: 6 }}>
                0
              </span>
              <span className={css.inputMuted} style={{ fontSize: 11 }}>
                °
              </span>
            </div>
            <div className={`${css.numCell} ${css.numCellLast}`}>
              <span className={`${css.axisLine} ${css.axisZ}`} />
              <span className={css.mono} style={{ marginLeft: 6 }}>
                0
              </span>
              <span className={css.inputMuted} style={{ fontSize: 11 }}>
                °
              </span>
            </div>
          </div>
        </PropRow>
      </div>
    </div>
  )
}
