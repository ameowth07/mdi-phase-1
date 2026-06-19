import type { ReactNode } from 'react'
import css from './NumberInput.module.css'
import { InlineSvg } from './icons/InlineSvg'
import { getRibbonSvg } from './icons/svgRegistry'

type NumberInputProps = {
  value: string
  unit: string
  leadingIcon: ReactNode
  decrementDisabled?: boolean
  incrementDisabled?: boolean
  onDecrement?: () => void
  onIncrement?: () => void
  'aria-label'?: string
}

function MinusIcon() {
  return (
    <svg className={css.incIcon} width={8} height={8} viewBox="0 0 8 8" aria-hidden>
      <path
        d="M1.25 4H6.75"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <span className={css.incIcon} aria-hidden>
      <InlineSvg svg={getRibbonSvg('imgVector')} />
    </span>
  )
}

/** Figma NumberInput with leading icon, value + unit, and +/- increment buttons. */
export default function NumberInput({
  value,
  unit,
  leadingIcon,
  decrementDisabled = true,
  incrementDisabled = false,
  onDecrement,
  onIncrement,
  'aria-label': ariaLabel,
}: NumberInputProps) {
  return (
    <div className={css.root} aria-label={ariaLabel}>
      <div className={css.contentArea}>
        <div className={css.leading}>{leadingIcon}</div>
        <div className={css.text}>
          <span className={css.value}>{value}</span>
          <span className={css.unit}>{unit}</span>
        </div>
      </div>
      <div className={css.increment}>
        <button
          type="button"
          className={css.incBtn}
          aria-label="Decrease"
          disabled={decrementDisabled}
          onClick={onDecrement}
        >
          <MinusIcon />
        </button>
        <button
          type="button"
          className={css.incBtn}
          aria-label="Increase"
          disabled={incrementDisabled}
          onClick={onIncrement}
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  )
}
