import type { Place } from './workspaceModel/types'
import { placeServerUsesMainStripTab } from './placeServerTabs'

export const PLACE_DOCK_PANEL_PREFIX = 'place:' as const

export type PlaceDockPanelId = `${typeof PLACE_DOCK_PANEL_PREFIX}${string}`

/** Bottom-dock place documents open by default in edit (Level 1). */
export const DEFAULT_OPEN_PLACE_DOCK_PLACE_IDS = ['level-1'] as const

export function placeDockPanelId(placeId: string): PlaceDockPanelId {
  return `${PLACE_DOCK_PANEL_PREFIX}${placeId}`
}

export function isPlaceDockPanelId(panelId: string): panelId is PlaceDockPanelId {
  return panelId.startsWith(PLACE_DOCK_PANEL_PREFIX)
}

export function placeIdFromDockPanel(panelId: PlaceDockPanelId): string {
  return panelId.slice(PLACE_DOCK_PANEL_PREFIX.length)
}

export function placeDockPanelLabel(place: Pick<Place, 'displayName'>): string {
  return place.displayName
}

/** Stable bottom-dock tab order for joined / persisted places. */
export function placeIdsInServerOrder(
  placeIds: readonly string[],
  serverPlaces: readonly Place[],
): string[] {
  const open = new Set(placeIds)
  return serverPlaces.filter((p) => open.has(p.id)).map((p) => p.id)
}

export function placeDockPanelIdsInServerOrder(
  openPlaceIds: readonly string[],
  serverPlaces: readonly Place[],
): PlaceDockPanelId[] {
  return placeIdsInServerOrder(openPlaceIds, serverPlaces).map(placeDockPanelId)
}

/** Lobby server (Level 1) stays in the bottom dock; merge with any joined / persisted places. */
export function mergeOpenPlaceDockPlaceIds(openIds: readonly string[]): string[] {
  const merged = new Set<string>(DEFAULT_OPEN_PLACE_DOCK_PLACE_IDS)
  for (const id of openIds) merged.add(id)
  return [...merged]
}

/** Level 2–4 joined in test → main document tab row (not bottom dock). */
export function openMainStripPlaceIdsFromJoined(
  joinedIds: readonly string[],
  serverPlaces: readonly Place[],
): string[] {
  return placeIdsInServerOrder(
    joinedIds.filter(placeServerUsesMainStripTab),
    serverPlaces,
  )
}
