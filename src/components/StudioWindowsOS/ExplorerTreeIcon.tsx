import styles from './StudioWindowsOS.module.css'
import {
  explorerIconAssetUrl,
  resolveExplorerIconType,
  type ExplorerIconType,
} from './explorerIcons'
import type { StudioColorTheme } from './themeColorOperators'

export type ExplorerTreeIconProps = {
  rowId: string
  label: string
  className?: string
  iconType?: ExplorerIconType
  theme?: StudioColorTheme
}

export default function ExplorerTreeIcon({
  rowId,
  label,
  className,
  iconType: iconTypeProp,
  theme = 'dark',
}: ExplorerTreeIconProps) {
  const iconType = iconTypeProp ?? resolveExplorerIconType(rowId, label, className)
  return (
    <img
      src={explorerIconAssetUrl(iconType, theme)}
      alt=""
      className={styles.treeExplorerIcon}
      aria-hidden
    />
  )
}
