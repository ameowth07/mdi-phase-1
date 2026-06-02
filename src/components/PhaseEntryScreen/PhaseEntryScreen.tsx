import { PHASE_ENTRY_OPTIONS, type StudioPhase } from '../../studioPhase'
import css from './PhaseEntryScreen.module.css'

export type PhaseEntryScreenProps = {
  onSelect: (phase: StudioPhase) => void
}

export default function PhaseEntryScreen({ onSelect }: PhaseEntryScreenProps) {
  return (
    <div className={css.host} role="dialog" aria-labelledby="phase-entry-heading">
      <div className={css.panel}>
        <h1 id="phase-entry-heading" className={css.heading}>
          Open Studio prototype
        </h1>
        <p className={css.subheading}>
          Choose which interaction baseline to load. Reopen this screen anytime from the Documents
          folder on the desktop.
        </p>
        <div className={css.options} role="list">
          {PHASE_ENTRY_OPTIONS.map(({ phase, title, description }) => (
            <button
              key={phase}
              type="button"
              role="listitem"
              className={css.option}
              onClick={() => onSelect(phase)}
            >
              <span className={css.optionTitle}>{title}</span>
              <span className={css.optionDescription}>{description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
