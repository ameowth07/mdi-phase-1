import { useCallback, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import DesktopEnvironment from './components/DesktopEnvironment/DesktopEnvironment'
import StudioWindowsOS from './components/StudioWindowsOS/StudioWindowsOS'
import styles from './App.module.css'

const MAIN_SLOT = 'main' as const
const DRAG_THRESHOLD_PX = 6

type WindowOffset = {
  x: number
  y: number
}

export default function App() {
  const [assetWindowIds, setAssetWindowIds] = useState<string[]>([])
  const [foregroundKey, setForegroundKey] = useState<typeof MAIN_SLOT | string>(MAIN_SLOT)
  const [windowOffsets, setWindowOffsets] = useState<Record<string, WindowOffset>>({
    [MAIN_SLOT]: { x: 0, y: 0 },
  })
  const windowOffsetsRef = useRef(windowOffsets)
  windowOffsetsRef.current = windowOffsets

  const openAssetWindow = () => {
    const id = crypto.randomUUID()
    setAssetWindowIds((ids) => {
      const next = [...ids, id]
      const layer = next.length
      setWindowOffsets((prev) => ({
        ...prev,
        [id]: { x: layer * 24, y: layer * -20 },
      }))
      return next
    })
    setForegroundKey(id)
  }

  const closeAssetWindow = (id: string) => {
    setAssetWindowIds((ids) => ids.filter((x) => x !== id))
    setWindowOffsets((prev) => {
      if (!(id in prev)) return prev
      const { [id]: _removed, ...rest } = prev
      return rest
    })
    setForegroundKey((fk) => (fk === id ? MAIN_SLOT : fk))
  }

  const zIndexForSlot = (key: typeof MAIN_SLOT | string) => {
    if (key === foregroundKey) return 1000
    if (key === MAIN_SLOT) return 1
    const idx = assetWindowIds.indexOf(key)
    return 2 + Math.max(0, idx)
  }

  const startWindowDrag = useCallback(
    (key: typeof MAIN_SLOT | string) => (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      if ((e.target as HTMLElement).closest('button, input, select, textarea, a')) return

      setForegroundKey(key)
      const startPointerX = e.clientX
      const startPointerY = e.clientY
      const startOffset = windowOffsetsRef.current[key] ?? { x: 0, y: 0 }
      let dragging = false

      const onPointerMove = (ev: PointerEvent) => {
        if (!dragging) {
          const dx = ev.clientX - startPointerX
          const dy = ev.clientY - startPointerY
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
          dragging = true
        }
        ev.preventDefault()
        setWindowOffsets((prev) => ({
          ...prev,
          [key]: {
            x: startOffset.x + (ev.clientX - startPointerX),
            y: startOffset.y + (ev.clientY - startPointerY),
          },
        }))
      }

      const finish = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', finish)
        window.removeEventListener('pointercancel', finish)
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', finish)
      window.addEventListener('pointercancel', finish)
    },
    [],
  )
  const mainOffset = windowOffsets[MAIN_SLOT] ?? { x: 0, y: 0 }

  return (
    <DesktopEnvironment studioTaskbarActive={foregroundKey === MAIN_SLOT}>
      <div className={styles.appShell}>
        <div className={styles.windowLayer}>
          <div
            className={styles.slot}
            style={{
              zIndex: zIndexForSlot(MAIN_SLOT),
              transform: `translate(calc(-50% + ${mainOffset.x}px), ${mainOffset.y}px)`,
            }}
            onPointerDownCapture={() => setForegroundKey(MAIN_SLOT)}
          >
            <StudioWindowsOS
              onOpenAssetWindow={openAssetWindow}
              onWindowChromePointerDown={startWindowDrag(MAIN_SLOT)}
              windowDragOffset={mainOffset}
            />
          </div>
          {assetWindowIds.map((id, i) => {
            const offset = windowOffsets[id] ?? { x: (i + 1) * 24, y: (i + 1) * -20 }
            return (
              <div
                key={id}
                className={styles.slot}
                style={{
                  zIndex: zIndexForSlot(id),
                  transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)`,
                }}
                onPointerDownCapture={() => setForegroundKey(id)}
              >
                <StudioWindowsOS
                  frameVariant="bunny"
                  onCloseFrame={() => closeAssetWindow(id)}
                  onWindowChromePointerDown={startWindowDrag(id)}
                  windowDragOffset={offset}
                />
              </div>
            )
          })}
        </div>
      </div>
    </DesktopEnvironment>
  )
}
