import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { publicAssetUrl } from '../../publicAssetUrl'
import css from './ClientDeviceFrame.module.css'

/** Sizing reference — same asset as lobby ClientSim (includes device bezel). */
const CLIENT_DEVICE_REFERENCE_ASSET = 'assets/ClientSim.jpg'

export type ClientDeviceFrameProps = {
  children: ReactNode
  onScreenPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void
}

/** Wraps client place viewport content in the same phone frame as lobby ClientSim. */
export default function ClientDeviceFrame({
  children,
  onScreenPointerDown,
}: ClientDeviceFrameProps) {
  return (
    <div className={css.root} data-client-device-frame>
      <img
        src={publicAssetUrl(CLIENT_DEVICE_REFERENCE_ASSET)}
        alt=""
        className={css.sizeReference}
        aria-hidden
      />
      <div className={css.chrome}>
        <div className={css.bezel} aria-hidden />
        <div className={css.notch} aria-hidden />
        <div className={css.screen} onPointerDown={onScreenPointerDown}>
          {children}
        </div>
      </div>
    </div>
  )
}
