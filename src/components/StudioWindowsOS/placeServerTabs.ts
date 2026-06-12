import type { Game, Place } from './workspaceModel/types'
import type { SimDocumentStripTab } from './documentTabClose'

export type SimPlaceServerTabId = `place-server:${string}`

export function isSimPlaceServerTab(tab: SimDocumentStripTab): tab is SimPlaceServerTabId {
  return typeof tab === 'string' && tab.startsWith('place-server:')
}

export function simPlaceServerTabId(placeId: string): SimPlaceServerTabId {
  return `place-server:${placeId}`
}

export function placeIdFromPlaceServerTab(tab: SimPlaceServerTabId): string {
  return tab.slice('place-server:'.length)
}

/** Non-default places (server documents in test) in game order. */
export function serverPlacesForGame(game: Game): Place[] {
  return game.places.filter((p) => p.id !== game.defaultPlaceId)
}

/** Level 1 Server lives in the bottom dock — no main-strip `place-server` tab. */
export const DOCKED_TEST_SERVER_PLACE_ID = 'level-1'

export function placeServerUsesMainStripTab(placeId: string): boolean {
  return placeId !== DOCKED_TEST_SERVER_PLACE_ID
}

/**
 * Level-1 server art with avatars only while the client is still in that place.
 * Once the client teleports on (e.g. to Level 2), show the empty server placeholder.
 */
export function level1ServerShowsJoinedClient(
  placeId: string,
  clientSimActive: boolean,
  clientViewPlaceId: string,
  joinedPlaceIds: readonly string[],
): boolean {
  if (clientSimActive) return clientViewPlaceId === placeId
  return joinedPlaceIds.includes(placeId)
}

/** Lobby → first server place; otherwise the next place in game order. */
export function nextServerPlaceAfterClientView(
  serverPlaces: readonly Place[],
  clientViewPlaceId: string,
  defaultPlaceId: string,
): Place | undefined {
  if (serverPlaces.length === 0) return undefined
  if (clientViewPlaceId === defaultPlaceId) return serverPlaces[0]
  const idx = serverPlaces.findIndex((p) => p.id === clientViewPlaceId)
  if (idx < 0) return serverPlaces[0]
  return serverPlaces[idx + 1]
}

export function canAdvanceClientToNextPlace(
  serverPlaces: readonly Place[],
  clientViewPlaceId: string,
  defaultPlaceId: string,
): boolean {
  return nextServerPlaceAfterClientView(serverPlaces, clientViewPlaceId, defaultPlaceId) != null
}

function lastClientStripIndex(order: readonly SimDocumentStripTab[]): number {
  let last = -1
  for (let i = 0; i < order.length; i++) {
    const t = order[i]!
    if (t === 'client' || /^client-\d+$/.test(t)) last = i
  }
  return last
}

export function insertPlaceServerTabAfterClient(
  order: SimDocumentStripTab[],
  placeId: string,
): SimDocumentStripTab[] {
  const tab = simPlaceServerTabId(placeId)
  const next = order.filter((t) => t !== tab)
  const clientIdx = lastClientStripIndex(next)
  if (clientIdx < 0) return [...next, tab]
  let insertAt = clientIdx + 1
  while (insertAt < next.length && isSimPlaceServerTab(next[insertAt]!)) {
    insertAt += 1
  }
  return [...next.slice(0, insertAt), tab, ...next.slice(insertAt)]
}

/** Open each place as a main-strip Server tab (after Client) in strip order. */
export function insertPlaceServerTabsAfterClient(
  order: SimDocumentStripTab[],
  placeIds: readonly string[],
): SimDocumentStripTab[] {
  let next = order
  for (const placeId of placeIds) {
    if (!placeServerUsesMainStripTab(placeId)) continue
    next = insertPlaceServerTabAfterClient(next, placeId)
  }
  return next
}

export function joinedPlaceIdsFromSimOrder(
  order: readonly SimDocumentStripTab[],
): string[] {
  return order.filter(isSimPlaceServerTab).map(placeIdFromPlaceServerTab)
}

/** Map test strip focus to the edit place document to select after Stop. */
export function editPlaceIdAfterTestStop(
  simFocusedStripTab: SimDocumentStripTab,
  activeEditPlaceId: string,
  defaultPlaceId: string,
): string {
  if (isSimPlaceServerTab(simFocusedStripTab)) {
    return placeIdFromPlaceServerTab(simFocusedStripTab)
  }
  if (activeEditPlaceId !== defaultPlaceId) {
    return activeEditPlaceId
  }
  return defaultPlaceId
}
