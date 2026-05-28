import { useEffect, useState, type ReactNode } from 'react'
import { publicAssetUrl } from '../../publicAssetUrl'
import css from './DesktopEnvironment.module.css'

const STUDIO_TASKBAR_ICON = publicAssetUrl('assets/roblox-studio-taskbar-icon.png')

const DESKTOP_ICONS = [
  { glyph: '🗑️', label: 'Recycle Bin' },
  { glyph: '💻', label: 'This PC' },
  { glyph: '📁', label: 'Documents' },
] as const

function formatTaskbarClock(date: Date): string {
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  const day = date.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
  return `${time}\n${day}`
}

export type DesktopEnvironmentProps = {
  children: ReactNode
  /** Highlight the Studio taskbar pill (main prototype window focused). */
  studioTaskbarActive?: boolean
}

export default function DesktopEnvironment({
  children,
  studioTaskbarActive = true,
}: DesktopEnvironmentProps) {
  const [clock, setClock] = useState(() => formatTaskbarClock(new Date()))

  useEffect(() => {
    const tick = () => setClock(formatTaskbarClock(new Date()))
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className={css.desktopRoot}>
      <div className={css.monitor} role="presentation">
        <div className={css.screen}>
          <div className={css.wallpaper} aria-hidden />
          <div className={css.iconColumn} aria-hidden>
            {DESKTOP_ICONS.map(({ glyph, label }) => (
              <div key={label} className={css.desktopIcon}>
                <span className={css.iconGlyph}>{glyph}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className={css.windowLayer}>{children}</div>
          <footer className={css.taskbar} aria-label="Windows taskbar">
            <button type="button" className={css.taskbarStart} aria-label="Start">
              <span className={css.startMark} aria-hidden>
                <span />
                <span />
                <span />
                <span />
              </span>
            </button>
            <div className={css.taskbarSearch} aria-hidden>
              <span>🔍</span>
              <span>Search</span>
            </div>
            <div className={css.taskbarApps} aria-hidden>
              <div
                className={`${css.taskbarApp} ${studioTaskbarActive ? css.taskbarAppActive : ''}`}
                title="Roblox Studio"
              >
                <img
                  className={css.taskbarAppIcon}
                  src={STUDIO_TASKBAR_ICON}
                  alt=""
                  width={32}
                  height={32}
                  draggable={false}
                />
              </div>
            </div>
            <div className={css.taskbarTray}>
              <span className={css.trayIcons} aria-hidden>
                <span>⌁</span>
                <span>🔊</span>
                <span>📶</span>
              </span>
              <time className={css.clock} dateTime={new Date().toISOString()}>
                {clock}
              </time>
            </div>
          </footer>
        </div>
        <div className={css.monitorStand} aria-hidden />
      </div>
    </div>
  )
}
