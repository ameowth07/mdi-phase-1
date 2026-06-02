import { Server } from 'lucide-react'
import { publicAssetUrl } from '../../publicAssetUrl'
import { DATAMODEL_INSET_FOCUS_BORDER } from './datamodelTint'
import styles from './StudioWindowsOS.module.css'

/** Place root document tab — globe icon (4× asset, 16×16 in tab). */
export function TabPlaceWorkspaceIcon() {
  return (
    <img
      src={publicAssetUrl('assets/tab-workspace-drone-racer.png')}
      alt=""
      className={`${styles.tabDiamond} ${styles.tabScriptEditIcon}`}
      aria-hidden
    />
  )
}

/** Test mode Server place document tab — matches main-strip Server tab icon. */
export function TabServerSimDocumentIcon() {
  return (
    <Server
      size={12}
      strokeWidth={1.5}
      className={`${styles.tabDiamond} ${styles.tabDiamondBrand}`}
      color={DATAMODEL_INSET_FOCUS_BORDER.server}
      aria-hidden
    />
  )
}
