import type { CSSProperties, RefObject } from 'react'
import { TabCloseIcon } from './documentTabIcons'
import type { FloatingDocumentPosition } from './floatingDocument'
import { useFloatingDocumentDrag } from './useFloatingDocumentDrag'
import {
  useFloatingWindowResize,
  type FloatingWindowSize,
} from './useFloatingWindowResize'
import StudioSettingsPanel, { type StudioSettingsPanelProps } from './StudioSettingsPanel'
import styles from './StudioWindowsOS.module.css'

export type FloatingStudioSettingsWindowProps = StudioSettingsPanelProps & {
  frameRef: RefObject<HTMLDivElement | null>
  position: FloatingDocumentPosition | null
  onPositionChange: (position: FloatingDocumentPosition) => void
  size: FloatingWindowSize
  onSizeChange: (size: FloatingWindowSize) => void
  onClose: () => void
}

export default function FloatingStudioSettingsWindow({
  frameRef,
  position,
  onPositionChange,
  size,
  onSizeChange,
  onClose,
  studioColorTheme,
  onStudioColorThemeChange,
  themePreset,
  onThemePresetChange,
  themeModified,
  onThemeModifiedChange,
  themePresetOverrides,
  onThemePresetOverridesChange,
  themeSliderStopTicks,
}: FloatingStudioSettingsWindowProps) {
  const { positionStyle, onDragHandlePointerDown } = useFloatingDocumentDrag({
    frameRef,
    position,
    onPositionChange,
    hostSelector: '[data-floating-studio-settings]',
  })

  const { onResizePointerDown } = useFloatingWindowResize({
    frameRef,
    hostSelector: '[data-floating-studio-settings]',
    size,
    onSizeChange,
  })

  const mergedPositionStyle: CSSProperties = {
    ...positionStyle,
    width: size.width,
    height: size.height,
    zIndex: 96,
    ...(position != null ? { transform: 'none' } : {}),
  }

  return (
    <div
      className={styles.floatingStudioSettingsHost}
      data-floating-studio-settings
      data-name="Floating Studio Settings"
      style={mergedPositionStyle}
    >
      <div className={styles.panel}>
        <div
          className={styles.floatingPanelChromeDrag}
          onPointerDown={onDragHandlePointerDown}
        >
          <header className={styles.panelHeader}>
            <span className={`${styles.panelTitle} ${styles.panelTitleAlignCenter}`}>
              Studio Settings
            </span>
            <div className={styles.panelActions}>
              <button
                type="button"
                className={styles.panelAction}
                aria-label="Close Studio Settings"
                onClick={onClose}
              >
                <TabCloseIcon />
              </button>
            </div>
          </header>
        </div>
        <div className={styles.floatingStudioSettingsBody}>
          <StudioSettingsPanel
            studioColorTheme={studioColorTheme}
            onStudioColorThemeChange={onStudioColorThemeChange}
            themePreset={themePreset}
            onThemePresetChange={onThemePresetChange}
            themeModified={themeModified}
            onThemeModifiedChange={onThemeModifiedChange}
            themePresetOverrides={themePresetOverrides}
            onThemePresetOverridesChange={onThemePresetOverridesChange}
            themeSliderStopTicks={themeSliderStopTicks}
          />
        </div>
        <div
          className={styles.floatingWindowResizeHandle}
          aria-hidden
          onPointerDown={onResizePointerDown}
        />
      </div>
    </div>
  )
}
