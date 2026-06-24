import type { MouseEvent } from 'react'
import { Server } from 'lucide-react'
import { publicAssetUrl } from '../../publicAssetUrl'
import styles from './StudioWindowsOS.module.css'

type TabBitmapIconProps = {
  assetPath: string
  /** 16px tab script/workspace icons vs 12px compact model icon. */
  size?: 'md' | 'sm'
}

/** Monochrome tab bitmap — tinted with content tokens (not semantic brand hues). */
export function TabBitmapIcon({ assetPath, size = 'md' }: TabBitmapIconProps) {
  const url = publicAssetUrl(assetPath)
  return (
    <span
      className={`${styles.tabDiamond} ${size === 'md' ? styles.tabScriptEditIcon : ''} ${styles.tabContentIconMask}`}
      style={{
        maskImage: `url("${url}")`,
        WebkitMaskImage: `url("${url}")`,
      }}
      aria-hidden
    />
  )
}

/** Place root document tab — globe icon (4× asset, 16×16 in tab). */
export function TabPlaceWorkspaceIcon() {
  return <TabBitmapIcon assetPath="assets/tab-workspace-drone-racer.png" />
}

/** Edit-mode ModuleScript tab — document icon (4× asset, shown at 16×16). */
export function TabScriptEditIcon() {
  return <TabBitmapIcon assetPath="assets/tab-script-edit.png" />
}

/** Edit-mode LocalScript (client copy) — document icon (4× asset, 16×16 in tab). */
export function TabLocalScriptEditIcon() {
  return <TabBitmapIcon assetPath="assets/tab-localscript-edit.png" />
}

/** Generic model glyph in document tabs (4× asset, 12×12 in tab). */
export function TabModelIcon() {
  return <TabBitmapIcon assetPath="assets/Model.png" size="sm" />
}

/** Test mode Server place document tab — matches main-strip Server tab icon. */
export function TabServerSimDocumentIcon() {
  return (
    <Server
      size={12}
      strokeWidth={1.5}
      className={`${styles.tabDiamond} ${styles.tabDiamondBrand} ${styles.iconSemanticServer}`}
      aria-hidden
    />
  )
}

/** Tab close glyph — inherits tab `color` (content-default / content-muted). */
export function TabCloseIcon() {
  const url = publicAssetUrl('assets/tab-close.svg')
  return (
    <span
      className={styles.tabCloseIconMask}
      style={{
        maskImage: `url("${url}")`,
        WebkitMaskImage: `url("${url}")`,
      }}
      aria-hidden
    />
  )
}

/** Panel chrome close glyph — inherits header button `color` (theme-aware). */
export function PanelCloseIcon() {
  const url = publicAssetUrl('assets/panel-close.svg')
  return (
    <span
      className={styles.tabCloseIconMask}
      style={{
        maskImage: `url("${url}")`,
        WebkitMaskImage: `url("${url}")`,
      }}
      aria-hidden
    />
  )
}

export function TabCloseButton({ onClose }: { onClose: (e: MouseEvent) => void }) {
  return (
    <button
      type="button"
      className={styles.tabClose}
      aria-label="Close tab"
      onPointerDown={(e) => {
        e.stopPropagation()
        onClose(e)
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClose(e)
      }}
    >
      <TabCloseIcon />
    </button>
  )
}
