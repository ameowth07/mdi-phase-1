import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import css from './Checkbox.module.css'

export type CheckboxProps = {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: ReactNode
  labelMuted?: boolean
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export default function Checkbox({
  checked,
  onCheckedChange,
  label,
  labelMuted = false,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  const control = (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label == null ? ariaLabel : undefined}
      disabled={disabled}
      className={[css.control, checked ? css.controlChecked : ''].filter(Boolean).join(' ')}
      onClick={() => {
        if (disabled) return
        onCheckedChange?.(!checked)
      }}
    >
      {checked ? (
        <Check size={10} strokeWidth={2.75} className={css.mark} aria-hidden />
      ) : null}
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
