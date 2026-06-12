import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { publicAssetUrl } from '../../publicAssetUrl'
import ClientDeviceFrame from './ClientDeviceFrame'
import deviceCss from './ClientDeviceFrame.module.css'
import css from './ClientSim.module.css'

export type ClientSimProps = {
  /** Lobby spawn vs joined place (same placeholder art for all non-lobby places). */
  variant?: 'lobby' | 'level-1'
  /** Transition overlay while teleporting to another place. */
  loading?: boolean
  loadingLabel?: string
  /** Triple-click on the viewport to join the next server place from Lobby. */
  onJoinNextPlace?: () => void
  /** When false, triple-click is ignored (e.g. all places joined). */
  canJoinNextPlace?: boolean
}

const CLIENT_SIM_ASSET: Record<NonNullable<ClientSimProps['variant']>, string> = {
  lobby: 'assets/ClientSim.jpg',
  'level-1': 'assets/level-1-client.png',
}

const TRIPLE_CLICK_WINDOW_MS = 900

export default function ClientSim({
  variant = 'lobby',
  loading = false,
  loadingLabel = 'Joining…',
  onJoinNextPlace,
  canJoinNextPlace = true,
}: ClientSimProps) {
  const clickBurstRef = useRef({ count: 0, lastAt: 0 })

  const registerTripleClick = useCallback(() => {
    if (!onJoinNextPlace || loading || !canJoinNextPlace) return
    const now = Date.now()
    if (now - clickBurstRef.current.lastAt > TRIPLE_CLICK_WINDOW_MS) {
      clickBurstRef.current.count = 0
    }
    clickBurstRef.current.lastAt = now
    clickBurstRef.current.count += 1
    if (clickBurstRef.current.count >= 3) {
      clickBurstRef.current.count = 0
      onJoinNextPlace()
    }
  }, [canJoinNextPlace, loading, onJoinNextPlace])

  const onTripleClickPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      if ((e.target as HTMLElement).closest('button')) return
      e.stopPropagation()
      registerTripleClick()
    },
    [registerTripleClick],
  )

  const onDeviceScreenPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      onTripleClickPointerDown(e)
    },
    [onTripleClickPointerDown],
  )

  const simImage = (
    <img
      src={publicAssetUrl(CLIENT_SIM_ASSET[variant])}
      alt="Client simulation"
      data-name={variant === 'level-1' ? 'Level1ClientSim' : 'ClientSim'}
      className={variant === 'level-1' ? deviceCss.screenContent : css.image}
      draggable={false}
    />
  )

  return (
    <div
      className={css.root}
      onPointerDown={variant === 'lobby' ? onTripleClickPointerDown : undefined}
    >
      {variant === 'level-1' ? (
        <ClientDeviceFrame onScreenPointerDown={onDeviceScreenPointerDown}>
          {simImage}
        </ClientDeviceFrame>
      ) : (
        simImage
      )}
      {loading ? (
        <div className={css.loadingOverlay} aria-live="polite" aria-busy="true">
          <div className={css.spinner} aria-hidden />
          <span>{loadingLabel}</span>
        </div>
      ) : null}
    </div>
  )
}
