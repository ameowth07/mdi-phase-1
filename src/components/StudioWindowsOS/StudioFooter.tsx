import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DatamodelTintFocus } from './datamodelTint'
import { publicAssetUrl } from '../../publicAssetUrl'
import css from './StudioFooter.module.css'

export type StudioFooterProps = {
  /** Footer “Questions” overlay — add strings to populate the list. */
  questions?: readonly string[]
  questionsOpen?: boolean
  onQuestionsOpenChange?: (open: boolean) => void
  /** Testing UI: footer background matches Explorer selected-row hue for focused datamodel. */
  datamodelTintFocus?: DatamodelTintFocus | null
}

export default function StudioFooter({
  questions = [],
  questionsOpen: questionsOpenProp,
  onQuestionsOpenChange,
  datamodelTintFocus = null,
}: StudioFooterProps) {
  const [historyToggleActive, setHistoryToggleActive] = useState(false)
  const [questionsOpenUncontrolled, setQuestionsOpenUncontrolled] = useState(false)

  const questionsOpen = questionsOpenProp ?? questionsOpenUncontrolled
  const setQuestionsOpen = onQuestionsOpenChange ?? setQuestionsOpenUncontrolled

  useEffect(() => {
    if (!questionsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuestionsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [questionsOpen, setQuestionsOpen])

  return (
    <>
      <footer
        className={css.footer}
        data-node-id="4057:75458"
        data-name="[TEMP] Footer"
        {...(datamodelTintFocus ? { 'data-footer-tint': datamodelTintFocus } : {})}
      >
        <div className={css.paneDivider} aria-hidden data-name=".Helper/PaneDivider" />
        <div className={css.footerRow}>
          <div className={css.commandSection} data-name="Command bar">
            <div className={css.commandInputRow} data-name="Input">
              <button
                type="button"
                className={`${css.iconBtn} ${historyToggleActive ? css.iconBtnActive : ''}`}
                aria-label="Command history"
                aria-pressed={historyToggleActive}
                onClick={() => setHistoryToggleActive((a) => !a)}
              >
                <img src={publicAssetUrl('assets/footer-cmd-history-toggle.svg')} alt="" />
              </button>
              <button type="button" className={css.localSelect} aria-label="Run context">
                <span>Local</span>
                <ChevronDown
                  size={12}
                  strokeWidth={2}
                  className={css.localSelectChevron}
                  aria-hidden
                />
              </button>
              <div className={css.commandField} data-name="TextInput">
                <input
                  type="text"
                  className={css.commandFieldInput}
                  placeholder="Type a command, use Cmd+↑↓ for history, Cmd+Enter to run"
                  spellCheck={false}
                  aria-label="Command"
                />
              </div>
            </div>
          </div>
          <div className={css.appBarRight} data-name="AppBarRight">
            <div className={css.appBarActions} data-name="ButtonGroup">
              <button
                type="button"
                className={css.appBarIconBtn}
                aria-label="Add comment"
                aria-expanded={questionsOpen}
                aria-controls="footer-questions-overlay"
                onClick={() => setQuestionsOpen(!questionsOpen)}
              >
                <img src={publicAssetUrl('assets/footer-cmd-comment.svg')} alt="" />
              </button>
              <button type="button" className={css.appBarIconBtn} aria-label="Cloud sync">
                <img src={publicAssetUrl('assets/footer-cmd-cloud.svg')} alt="" />
              </button>
            </div>
            <div className={css.verticalDivider} aria-hidden />
            <button type="button" className={css.historyUtilityBtn} aria-label="History">
              <img src={publicAssetUrl('assets/cmd-diamond.svg')} alt="" />
              <span>History</span>
            </button>
          </div>
        </div>
        <div className={css.paneDivider} aria-hidden />
      </footer>

      {questionsOpen ? (
        <>
          <div
            className={css.questionsOverlayBackdrop}
            aria-hidden
            onClick={() => setQuestionsOpen(false)}
          />
          <div
            id="footer-questions-overlay"
            className={css.questionsOverlayPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-questions-title"
          >
            <div className={css.questionsOverlayHeader}>
              <h2 id="footer-questions-title" className={css.questionsOverlayTitle}>
                Questions
              </h2>
              <button
                type="button"
                className={css.questionsOverlayClose}
                aria-label="Close"
                onClick={() => setQuestionsOpen(false)}
              >
                ×
              </button>
            </div>
            {questions.length > 0 ? (
              <ul className={css.questionsOverlayList}>
                {questions.map((q, i) => (
                  <li key={i} className={css.questionsOverlayItem}>
                    {q}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={css.questionsOverlayEmpty}>
                Add entries to{' '}
                <code className={css.questionsOverlayCode}>FOOTER_QUESTIONS</code> in{' '}
                <code className={css.questionsOverlayCode}>StudioWindowsOS.tsx</code>.
              </p>
            )}
          </div>
        </>
      ) : null}
    </>
  )
}
