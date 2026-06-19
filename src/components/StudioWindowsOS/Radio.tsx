import type { ReactNode } from 'react'
import css from './Radio.module.css'

export type RadioProps = {
  checked: boolean
  onSelect?: () => void
  label?: ReactNode
  labelMuted?: boolean
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export default function Radio({
  checked,
  onSelect,
  label,
  labelMuted = false,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: RadioProps) {
  const control = (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label == null ? ariaLabel : undefined}
      disabled={disabled}
      className={[css.control, checked ? css.controlChecked : ''].filter(Boolean).join(' ')}
      onClick={() => {
        if (disabled) return
        onSelect?.()
      }}
    >
      {checked ? <span className={css.knob} aria-hidden /> : null}
    </button>
  )

  if (label == null) {
    return control
  }

  return (
    <label className={[css.root, className].filter(Boolean).join(' ')}>
      {control}
      <span className={labelMuted ? `${css.label} ${css.labelMuted}` : css.label}>{label}</span>
    </label>
  )
}
