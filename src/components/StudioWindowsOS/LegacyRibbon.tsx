import { Bell, CircleUser, Play, Plus, Share2, Sparkles, Square } from 'lucide-react'
import css from './ribbon.module.css'
import { RibbonToolbar } from './RibbonToolbar'

const RIBBON_TABS = ['Home', 'Model', 'Avatar', 'UI', 'Script'] as const

function PauseIcon() {
  return (
    <svg
      className={css.pauseSvg}
      width={16}
      height={16}
      viewBox="0 0 16 16"
      aria-hidden
    >
      <rect x="4.25" y="3.5" width="2.75" height="9" rx="0.35" />
      <rect x="9" y="3.5" width="2.75" height="9" rx="0.35" />
    </svg>
  )
}

function ChevSmSplit() {
  return (
    <svg
      className={css.pauseChevron}
      width={10}
      height={10}
      viewBox="0 0 10 10"
      aria-hidden
    >
      <path
        d="M2 3L5 6.2L8 3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Same stroke chevron as toolbar split drops (RibbonToolbar ChevSm) — avoids Unicode ▾ emoji substitution. */
function TestDropdownChevron() {
  return (
    <svg
      className={css.testDropdownChevIcon}
      width={10}
      height={10}
      viewBox="0 0 10 10"
      aria-hidden
    >
      <path
        d="M2 3L5 6.2L8 3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Mezzanine cloud — vector (MCP raster 404); matches common “cloud” glyph, not user-in-frame. */
function CloudIcon() {
  return (
    <svg
      className={css.cloudIcon}
      width={16}
      height={16}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 12.5A4.5 4.5 0 005.5 17H15a4 4 0 001.866-7.539 3.504 3.504 0 00-4.504-4.272A4.5 4.5 0 001 12.5z"
      />
    </svg>
  )
}

export type LegacyRibbonProps = {
  /** Simulation running — mezzanine playback matches active run (Figma 3841:113027). */
  simulating?: boolean
  onPlay?: () => void
  onStop?: () => void
  /** Asset-only frame (e.g. Bunny) — Test menu and playback controls are inert. */
  testPlaybackDisabled?: boolean
}

/** Assistant / Copilot — Lucide glyph; custom scaled paths were sub-pixel at 16×16. */
function AssistantIcon() {
  return <Sparkles className={css.assistantIcon} size={16} strokeWidth={1.5} aria-hidden />
}

/** Figma node 3841:115005 — [Legacy] Ribbon */
export default function LegacyRibbon({
  simulating,
  onPlay,
  onStop,
  testPlaybackDisabled,
}: LegacyRibbonProps) {
  const playbackLocked = !!testPlaybackDisabled
  const testDropdownDisabled = !!simulating || playbackLocked
  return (
    <div className={css.ribbonRoot} data-node-id="3841:115005">
      <div className={css.mezzanine} data-node-id="3841:115007">
        <div className={simulating ? `${css.mezzLeft} ${css.mezzLeftSim}` : css.mezzLeft}>
          <button type="button" className={css.testDropdown} disabled={testDropdownDisabled}>
            Test
            <TestDropdownChevron />
          </button>
          <div className={css.playback} data-node-id="3841:115016">
            <button
              type="button"
              className={`${css.iconBtnSm} ${css.playControlBtn}`}
              aria-label="Play"
              aria-pressed={simulating ? true : undefined}
              disabled={playbackLocked}
              onClick={onPlay}
            >
              <Play
                size={14}
                strokeWidth={1.75}
                fill="currentColor"
                aria-hidden
              />
            </button>
            <div
              className={simulating ? `${css.splitMuted} ${css.splitMutedSim}` : css.splitMuted}
              data-node-id="I3841:115016;2531:99353"
            >
              <div className={css.splitMutedInner}>
                <button
                  type="button"
                  className={css.splitMutedPart}
                  aria-label="Pause"
                  disabled={playbackLocked}
                >
                  <PauseIcon />
                </button>
                <button
                  type="button"
                  className={css.splitMutedPart}
                  aria-label="Playback menu"
                  disabled={playbackLocked}
                >
                  <ChevSmSplit />
                </button>
              </div>
            </div>
            <button
              type="button"
              className={`${css.iconBtnSm} ${css.stopControlBtn}`}
              aria-label="Stop"
              disabled={playbackLocked}
              onClick={onStop}
            >
              <Square
                size={11}
                strokeWidth={2}
                fill="currentColor"
                aria-hidden
              />
            </button>
          </div>
        </div>

        <div className={css.centerTabs} data-node-id="3841:115017">
          {RIBBON_TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`${css.ribbonTab} ${t === 'Home' ? css.ribbonTabActive : ''}`}
            >
              {t}
            </button>
          ))}
          <button type="button" className={css.tabPlusBtn} aria-label="Add tab">
            <Plus size={12} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className={css.mezzRight} data-node-id="3841:115018">
          <div className={css.userCluster}>
            <button type="button" className={css.iconBtnSm} aria-label="Share">
              <Share2 size={16} strokeWidth={1.5} aria-hidden />
            </button>
            <div className={css.dividerV} />
            <button type="button" className={css.iconBtnSm} aria-label="Assistant">
              <AssistantIcon />
            </button>
            <button type="button" className={css.iconBtnSm} aria-label="Cloud">
              <CloudIcon />
            </button>
            <div className={css.dividerV} />
            <button type="button" className={css.iconBtnSm} aria-label="Notifications">
              <Bell size={16} strokeWidth={1.5} aria-hidden />
            </button>
            <button type="button" className={css.avatar} aria-label="Account">
              <CircleUser size={22} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className={css.ribbonRule} data-node-id="3841:115042" />

      <RibbonToolbar />
    </div>
  )
}
