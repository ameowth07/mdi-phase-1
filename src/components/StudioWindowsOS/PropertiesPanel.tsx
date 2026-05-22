import type { ReactNode } from 'react'
import { Anchor, Check, Globe, Lock, MoreHorizontal, Package2, X } from 'lucide-react'
import type { DatamodelTintFocus } from './datamodelTint'
import css from './PropertiesPanel.module.css'

const FOCUSABLE_INPUT_PROPS = {
  tabIndex: 0,
  role: 'textbox' as const,
}

function ChevDownSm() {
  return (
    <svg width={10} height={6} viewBox="0 0 10 6" aria-hidden>
      <path
        d="M1 1.2L5 4.8L9 1.2"
        fill="none"
        stroke="#f7f7f8"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function SectionHeader({ title, trailing }: { title: string; trailing?: ReactNode }) {
  return (
    <div className={css.sectionHeader}>
      <div className={css.sectionChevron}>
        <ChevDownSm />
      </div>
      <h3 className={trailing ? css.originTitle : css.sectionTitle}>{title}</h3>
      {trailing ?? null}
    </div>
  )
}

function SectionDivider() {
  return (
    <div className={css.sectionRule} aria-hidden>
      <div className={css.sectionRuleLine} />
    </div>
  )
}

function PropRow({
  label,
  children,
  dimmed,
}: {
  label: string
  children: ReactNode
  dimmed?: boolean
}) {
  return (
    <div className={`${css.row} ${dimmed ? css.rowDimmed : ''}`}>
      <div className={css.labelCol}>
        <div className={css.labelSpacer} />
        <span className={css.label}>{label}</span>
      </div>
      <div className={css.valueCol}>{children}</div>
    </div>
  )
}

function CheckboxControl({ checked }: { checked: boolean }) {
  return (
    <div className={css.checkboxCell} tabIndex={0} role="checkbox" aria-checked={checked}>
      {checked ? (
        <div className={css.checkbox}>
          <Check size={10} strokeWidth={2.75} className={css.checkboxMark} aria-hidden />
        </div>
      ) : (
        <div className={css.checkboxUnchecked} aria-hidden />
      )}
    </div>
  )
}

function NumberValue({ value }: { value: string }) {
  return (
    <div className={`${css.inputShell} ${css.inputShellTight}`} {...FOCUSABLE_INPUT_PROPS}>
      <span className={`${css.mono} ${css.inputText}`}>{value}</span>
    </div>
  )
}

function DropdownValue({
  text,
  mutedSuffix,
  lead,
}: {
  text: string
  mutedSuffix?: string
  lead?: ReactNode
}) {
  return (
    <div className={`${css.inputShell} ${css.inputShellDropdown}`} {...FOCUSABLE_INPUT_PROPS}>
      {lead ?? null}
      <span className={css.inputText}>
        {text}
        {mutedSuffix ? <span className={css.inputMuted}> {mutedSuffix}</span> : null}
      </span>
      <div className={css.trailChev}>
        <ChevDownSm />
      </div>
    </div>
  )
}

const AXIS_LINE_CLASS = {
  X: css.axisX,
  Y: css.axisY,
  Z: css.axisZ,
} as const

function Vec3Values({ values }: { values: [string, string, string] }) {
  const axes = ['X', 'Y', 'Z'] as const
  return (
    <div className={css.vec3Row}>
      {values.map((value, index) => (
        <div
          key={axes[index]}
          className={`${css.numCell} ${
            index === 0 ? css.numCellFirst : index === 2 ? css.numCellLast : css.numCellMid
          }`}
          {...FOCUSABLE_INPUT_PROPS}
        >
          <span className={`${css.axisLine} ${AXIS_LINE_CLASS[axes[index]]}`} />
          <span className={css.mono}>{value}</span>
        </div>
      ))}
    </div>
  )
}

function Vec3DegValues({ values }: { values: [string, string, string] }) {
  const axes = ['X', 'Y', 'Z'] as const
  return (
    <div className={css.vec3Row}>
      {values.map((value, index) => (
        <div
          key={axes[index]}
          className={`${css.numCell} ${
            index === 0 ? css.numCellFirst : index === 2 ? css.numCellLast : css.numCellMid
          }`}
          {...FOCUSABLE_INPUT_PROPS}
        >
          <span className={`${css.axisLine} ${AXIS_LINE_CLASS[axes[index]]}`} />
          <span className={css.mono}>{value}</span>
          <span className={css.degSuffix}>°</span>
        </div>
      ))}
    </div>
  )
}

function ColorRgbRow() {
  return (
    <div className={css.rgbRow}>
      <div className={css.colorSwatchSeg} tabIndex={0} role="textbox" aria-label="Color swatch">
        <div className={css.swatchSq} />
      </div>
      <div className={css.vDiv} />
      <div className={`${css.numCell} ${css.numCellFirst}`} {...FOCUSABLE_INPUT_PROPS}>
        <span className={css.mono}>163</span>
      </div>
      <div className={css.vDiv} />
      <div className={`${css.numCell} ${css.numCellMid}`} {...FOCUSABLE_INPUT_PROPS}>
        <span className={css.mono}>162</span>
      </div>
      <div className={css.vDiv} />
      <div className={`${css.numCell} ${css.numCellLast}`} {...FOCUSABLE_INPUT_PROPS}>
        <span className={css.mono}>165</span>
      </div>
    </div>
  )
}

function ParentField() {
  return (
    <div className={`${css.inputShell} ${css.parentInputShell}`} {...FOCUSABLE_INPUT_PROPS}>
      <div className={css.parentLeadIcon} aria-hidden>
        <Globe size={12} strokeWidth={1.75} className={css.parentGlobeIcon} />
      </div>
      <span className={css.inputText}>Workspace</span>
      <button type="button" className={css.parentClearBtn} aria-label="Clear parent">
        <X size={12} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}

type PropertiesPanelProps = {
  /** No Explorer selection — hide part inspector (client sim, etc.). */
  empty?: boolean
  /** Explorer row display name for the title row (e.g. Shop, HoverScript). */
  objectLabel?: string
  /** Testing UI: Selection tint — input focus border follows focused datamodel inset. */
  selectionTintActive?: boolean
  datamodelTintFocus?: DatamodelTintFocus | null
}

/** Figma 4143:101971 — Properties panel (full slot). */
export default function PropertiesPanel({
  empty,
  objectLabel,
  selectionTintActive = false,
  datamodelTintFocus = null,
}: PropertiesPanelProps) {
  if (empty) {
    return (
      <div className={css.root} data-node-id="4143:101971">
        <div className={css.emptyState}>
          <p className={css.emptyHint}>Select an object in Explorer</p>
        </div>
      </div>
    )
  }

  const tintDataAttr =
    selectionTintActive && datamodelTintFocus != null
      ? ({ 'data-properties-tint': datamodelTintFocus } as const)
      : undefined

  return (
    <div className={css.root} data-node-id="4143:101971" {...tintDataAttr}>
      <div className={css.frontmatter}>
        <div className={css.titleRow}>
          <PartLeadingIcon />
          <p className={css.titleText}>{objectLabel ?? 'Mypart'}</p>
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
          <DropdownValue
            text="Plastic"
            lead={
              <div className={css.leadSwatch}>
                <div className={css.leadSwatchInner}>
                  <div className={css.materialSwatchLucide} aria-hidden />
                </div>
              </div>
            }
          />
        </PropRow>

        <PropRow label="Color">
          <ColorRgbRow />
        </PropRow>

        <PropRow label="Transparency">
          <NumberValue value="0" />
        </PropRow>

        <PropRow label="Reflectance">
          <NumberValue value="0" />
        </PropRow>

        <PropRow label="Shape">
          <DropdownValue text="Block" mutedSuffix="(enabled)" />
        </PropRow>

        <PropRow label="Cast Shadow">
          <CheckboxControl checked />
        </PropRow>

        <SectionDivider />
        <SectionHeader title="Origin" trailing={<MoreIcon />} />

        <PropRow label="Position">
          <Vec3Values values={['0', '0', '0']} />
        </PropRow>

        <PropRow label="Orientation">
          <Vec3DegValues values={['0', '0', '0']} />
        </PropRow>

        <PropRow label="Size">
          <Vec3Values values={['4', '1', '2']} />
        </PropRow>

        <SectionDivider />
        <SectionHeader title="Pivot Offset" />

        <PropRow label="Position">
          <Vec3Values values={['10', '-0.5', '10']} />
        </PropRow>

        <PropRow label="Orientation">
          <Vec3DegValues values={['10', '-90', '10']} />
        </PropRow>

        <SectionDivider />
        <SectionHeader title="Physics" />

        <PropRow label="Anchored">
          <CheckboxControl checked />
        </PropRow>

        <PropRow label="Fluid Forces">
          <CheckboxControl checked />
        </PropRow>

        <PropRow label="Massless">
          <CheckboxControl checked={false} />
        </PropRow>

        <PropRow label="Root Priority">
          <NumberValue value="0" />
        </PropRow>

        <SectionDivider />
        <SectionHeader title="Collision" />

        <PropRow label="Can Collide">
          <CheckboxControl checked />
        </PropRow>

        <PropRow label="Can Query" dimmed>
          <CheckboxControl checked />
        </PropRow>

        <PropRow label="Can Touch">
          <CheckboxControl checked />
        </PropRow>

        <PropRow label="Collision Group">
          <DropdownValue text="Default" mutedSuffix="(enabled)" />
        </PropRow>

        <SectionDivider />
        <SectionHeader title="Data" />

        <PropRow label="Locked">
          <CheckboxControl checked />
        </PropRow>

        <PropRow label="Parent">
          <ParentField />
        </PropRow>
      </div>
    </div>
  )
}
