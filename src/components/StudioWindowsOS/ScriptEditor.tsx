import styles from './ScriptEditor.module.css'

type ScriptEditorProps = {
  source: string
  className?: string
}

export default function ScriptEditor({ source, className }: ScriptEditorProps) {
  const lines = source.split('\n')

  return (
    <div
      className={[styles.scriptEditor, className].filter(Boolean).join(' ')}
      spellCheck={false}
    >
      {lines.map((line, index) => (
        <div key={index} className={styles.scriptLine}>
          <span className={styles.lineNumber} aria-hidden>
            {index + 1}
          </span>
          <span className={styles.lineContent}>{line === '' ? '\u00A0' : line}</span>
        </div>
      ))}
    </div>
  )
}
