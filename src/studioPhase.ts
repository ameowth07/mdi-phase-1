import { PROTOTYPE_SETTINGS_DEFAULTS } from './components/StudioWindowsOS/prototypeDefaults'
import { DEFAULT_OPEN_PLACE_DOCK_PLACE_IDS } from './components/StudioWindowsOS/placeDockPanels'

export type StudioPhase = 1 | 2

export type PhaseEntryOption = {
  phase: StudioPhase
  title: string
  description: string
}

export const PHASE_ENTRY_OPTIONS: readonly PhaseEntryOption[] = [
  {
    phase: 1,
    title: 'Phase 1',
    description:
      'Frozen MDI prototype: place name in the title bar, Drone Racer document tabs, and Test mode without multi-place join or bottom-dock place documents.',
  },
  {
    phase: 2,
    title: 'Phase 2',
    description:
      'Game and place workspace: game title in the app bar, Lobby and joined places, Level 1 in the bottom dock, and triple-click Client to join more places.',
  },
] as const

export function isPhase2(phase: StudioPhase): boolean {
  return phase === 2
}

/** Runtime defaults; Phase 1 overrides a subset of boolean experiment flags. */
export function prototypeDefaultsForPhase(phase: StudioPhase) {
  const base = { ...PROTOTYPE_SETTINGS_DEFAULTS }
  if (phase === 2) return base
  return {
    ...base,
    serversPersistIntoEdit: false,
    serverTabUsesPlaceName: false,
    clientTabUsesPlaceName: false,
  }
}

export function initialOpenPlaceDockPlaceIds(phase: StudioPhase): string[] {
  return phase === 2 ? [...DEFAULT_OPEN_PLACE_DOCK_PLACE_IDS] : []
}

/** Phase 1 app bar title (see docs/phase-1/window-and-naming.md). */
export const PHASE_1_APP_BAR_TITLE = 'Drone Racer'

/** Phase 1 main document root tab label. */
export const PHASE_1_MAIN_PLACE_TAB_LABEL = 'Drone Racer'
