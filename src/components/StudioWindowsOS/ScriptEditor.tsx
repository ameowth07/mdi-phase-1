import { highlightLuaLine } from './highlightLuaLine'
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
          <code className={styles.lineContent}>
            {line === ''
              ? '\u00A0'
              : highlightLuaLine(line).map((token, tokenIndex) => (
                  <span key={tokenIndex} className={styles[token.kind]}>
                    {token.text}
                  </span>
                ))}
          </code>
        </div>
      ))}
    </div>
  )
}
