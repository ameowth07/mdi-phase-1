import { useState } from 'react'
import DesktopEnvironment from './components/DesktopEnvironment/DesktopEnvironment'
import StudioWindowsOS from './components/StudioWindowsOS/StudioWindowsOS'
import styles from './App.module.css'

const MAIN_SLOT = 'main' as const

export default function App() {
  const [assetWindowIds, setAssetWindowIds] = useState<string[]>([])
  const [foregroundKey, setForegroundKey] = useState<typeof MAIN_SLOT | string>(MAIN_SLOT)

  const openAssetWindow = () => {
    const id = crypto.randomUUID()
    setAssetWindowIds((ids) => [...ids, id])
    setForegroundKey(id)
  }

  const closeAssetWindow = (id: string) => {
    setAssetWindowIds((ids) => ids.filter((x) => x !== id))
    setForegroundKey((fk) => (fk === id ? MAIN_SLOT : fk))
  }

  const zIndexForSlot = (key: typeof MAIN_SLOT | string) => {
    if (key === foregroundKey) return 1000
    if (key === MAIN_SLOT) return 1
    const idx = assetWindowIds.indexOf(key)
    return 2 + Math.max(0, idx)
  }

  return (
    <DesktopEnvironment studioTaskbarActive={foregroundKey === MAIN_SLOT}>
      <div className={styles.appShell}>
        <div className={styles.windowLayer}>
          <div
            className={styles.slot}
            style={{ zIndex: zIndexForSlot(MAIN_SLOT), transform: 'translate(-50%, 0)' }}
            onPointerDownCapture={() => setForegroundKey(MAIN_SLOT)}
          >
            <StudioWindowsOS onOpenAssetWindow={openAssetWindow} />
          </div>
          {assetWindowIds.map((id, i) => {
            const layer = i + 1
            return (
              <div
                key={id}
                className={styles.slot}
                style={{
                  zIndex: zIndexForSlot(id),
                  transform: `translate(calc(-50% + ${layer * 24}px), ${layer * -20}px)`,
                }}
                onPointerDownCapture={() => setForegroundKey(id)}
              >
                <StudioWindowsOS
                  frameVariant="bunny"
                  onCloseFrame={() => closeAssetWindow(id)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </DesktopEnvironment>
  )
}
