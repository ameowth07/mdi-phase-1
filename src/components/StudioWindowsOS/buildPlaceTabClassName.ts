import styles from './StudioWindowsOS.module.css'

export type PlaceTabStrokeOptions = {
  active?: boolean
  tabStroke?: boolean
  /** Same gate as main-strip `buildTabClass` (Testing UI: Tab stroke). */
  tabStrokeOn?: boolean
  tabStrokeAllEdges?: boolean
  tabStrokeConnected?: boolean
  /** Testing UI: Has semantic stroke — brand hue on tab top edge. */
  strokeOn?: boolean
  /** Testing UI: Tab tint — filled Server tab background. */
  tabTintOn?: boolean
  /** Test mode: server place documents use Server brand stroke. */
  datamodel?: 'drone' | 'server'
  /** Edit mode: focused tab stroke uses bg/system-contrast (not sim/test). */
  editMode?: boolean
}

/** Match main document strip place-tab chrome (Lobby / Level 1 / persisted server places). */
export function buildPlaceTabClassName({
  active = true,
  tabStroke = true,
  tabStrokeOn = true,
  tabStrokeAllEdges = false,
  tabStrokeConnected = false,
  strokeOn = false,
  tabTintOn = false,
  datamodel = 'drone',
  editMode = false,
}: PlaceTabStrokeOptions = {}): string {
  const parts = [styles.tab, active ? styles.tabActive : styles.tabInactive]
  if (tabStroke && active && tabStrokeOn) {
    parts.push(styles.tabActiveTopStroke)
    if (editMode) parts.push(styles.tabActiveTopStrokeEdit)
    if (tabStrokeConnected) {
      parts.push(styles.tabActiveStrokeConnected)
      parts.push(styles.tabActiveTabConnected)
    } else if (tabStrokeAllEdges) {
      parts.push(styles.tabActiveAllEdgesStroke)
    }
    if (strokeOn) {
      parts.push(
        datamodel === 'server'
          ? styles.tabActiveTopStrokeServer
          : styles.tabActiveTopStrokeDrone,
      )
    }
    if (tabTintOn && datamodel === 'server') {
      parts.push(styles.tabActiveTintServer)
    }
  }
  return parts.filter(Boolean).join(' ')
}
