import { useState } from 'react'
import type { Level1ExplorerTreeData } from './level1ExplorerData'
import styles from './StudioWindowsOS.module.css'

function TreeChevron({ mode }: { mode: 'open' | 'closed' | 'spacer' }) {
  return (
    <span
      className={
        mode === 'closed'
          ? `${styles.treeChevron} ${styles.treeChevronClosed}`
          : styles.treeChevron
      }
      aria-hidden
    >
      {mode !== 'spacer' && (
        <svg className={styles.treeChevronSvg} width={10} height={10} viewBox="0 0 10 10">
          <path
            d="M2 3L5 6.2L8 3"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}

export type Level1ExplorerTreeProps = {
  tree: Level1ExplorerTreeData
  selectedRowId: string | null
  onSelectRow: (rowId: string) => void
  selectionTintActive: boolean
}

export default function Level1ExplorerTree({
  tree,
  selectedRowId,
  onSelectRow,
  selectionTintActive,
}: Level1ExplorerTreeProps) {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  const explorerTreeProps = selectionTintActive
    ? ({ 'data-explorer-tint': 'drone' } as const)
    : undefined

  const rowClass = (rowId: string) => {
    const hovered = hoveredRowId === rowId
    const selected = selectedRowId !== null && selectedRowId === rowId
    const childOfSelected =
      selectedRowId !== null && tree.parentMap[rowId] === selectedRowId
    if (selected) {
      return [styles.treeRow, styles.treeRowInteractive, styles.selected].filter(Boolean).join(' ')
    }
    if (hovered) {
      return [styles.treeRow, styles.treeRowInteractive, styles.treeRowHover].filter(Boolean).join(' ')
    }
    if (childOfSelected) {
      return [styles.treeRow, styles.treeRowInteractive, styles.treeRowChildOfSelected]
        .filter(Boolean)
        .join(' ')
    }
    return [styles.treeRow, styles.treeRowInteractive].join(' ')
  }

  return (
    <div className={styles.tree} {...explorerTreeProps}>
      {tree.display.map((node) => (
        <div
          key={node.id}
          className={rowClass(node.id)}
          style={{ paddingLeft: 22 * node.depth }}
          onMouseEnter={() => setHoveredRowId(node.id)}
          onMouseLeave={() => setHoveredRowId(null)}
          onClick={() => onSelectRow(node.id)}
        >
          <TreeChevron mode={node.chevron} />
          <span
            className={styles.treeIcon}
            style={node.iconColor ? { color: node.iconColor } : undefined}
          >
            {node.iconGlyph}
          </span>
          <span className={styles.treeLabel}>{node.label}</span>
        </div>
      ))}
    </div>
  )
}
