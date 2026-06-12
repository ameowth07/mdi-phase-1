import type { Game, Place, ResolvedWorkspace, StudioFrameVariant } from './types'

/**
 * Phase 2: game title in the app bar; place `displayName` is the root document tab label.
 */
export const droneRacerGame: Game = {
  id: 'skyline-drift',
  displayName: 'Skyline Drift',
  defaultPlaceId: 'drone-racer',
  places: [
    {
      id: 'drone-racer',
      displayName: 'Lobby',
      rootTabId: 'droneRacer',
    },
    {
      id: 'level-1',
      displayName: 'Level 1',
      rootTabId: 'droneRacer',
      dockOnly: true,
    },
    {
      id: 'level-2',
      displayName: 'Level 2',
      rootTabId: 'droneRacer',
      dockOnly: true,
    },
    {
      id: 'level-3',
      displayName: 'Level 3',
      rootTabId: 'droneRacer',
      dockOnly: true,
    },
    {
      id: 'level-4',
      displayName: 'Level 4',
      rootTabId: 'droneRacer',
      dockOnly: true,
    },
    {
      id: 'final-challenge',
      displayName: 'Final Challenge',
      rootTabId: 'droneRacer',
      dockOnly: true,
    },
  ],
}

export const bunnyGame: Game = {
  id: 'bunny',
  displayName: 'Bunny',
  defaultPlaceId: 'bunny',
  places: [
    {
      id: 'bunny',
      displayName: 'Bunny',
      rootTabId: 'droneRacer',
    },
  ],
}

export function resolveWorkspace(frameVariant: StudioFrameVariant): ResolvedWorkspace {
  const game = frameVariant === 'bunny' ? bunnyGame : droneRacerGame
  const defaultPlace =
    game.places.find((p) => p.id === game.defaultPlaceId) ?? game.places[0]!
  return { game, defaultPlace }
}

export function placeById(game: Game, placeId: string) {
  return game.places.find((p) => p.id === placeId)
}

/** Path tooltip for a place root document tab (`Lobby/Lobby`). */
export function placeRootPathTooltip(place: Pick<Place, 'displayName'>): string {
  return `${place.displayName}/${place.displayName}`
}

/** Main-strip Script tab path tooltip (`Lobby/Script`). */
export function placeScriptPathTooltip(placeName: string): string {
  return `${placeName}/Script`
}

/** Client datamodel prefix for tab path tooltips (`Lobby (Client)/…`). */
export function placeClientDatamodelPrefix(placeName: string): string {
  return `${placeName} (Client)`
}

/** Server datamodel prefix for tab path tooltips (`Lobby (Server)/…`). */
export function placeServerDatamodelPrefix(placeName: string): string {
  return `${placeName} (Server)`
}

/** Test mode: default place → Client view; other open place documents → Server view. */
export function placeTestDatamodelRole(
  place: Pick<Place, 'id'>,
  game: Pick<Game, 'defaultPlaceId'>,
): 'client' | 'server' {
  return place.id === game.defaultPlaceId ? 'client' : 'server'
}

/** Place root tab path in test Server view (`Level 1 (Server)/Level 1`). */
export function placeServerRootPathTooltip(place: Pick<Place, 'displayName'>): string {
  return `${placeServerDatamodelPrefix(place.displayName)}/${place.displayName}`
}

/** Test Client tab label — `Client` or `Client / {place}`. */
export function simClientTabLabel(placeName: string, usePlaceInLabel: boolean): string {
  return usePlaceInLabel ? `Client / ${placeName}` : 'Client'
}

/** Test Client tab path tooltip (place name when label is generic). */
export function simClientTabPathTooltip(placeName: string): string {
  return placeClientDatamodelPrefix(placeName)
}

/** Test Server tab label — `Server` or place display name. */
export function simServerTabLabel(placeName: string, usePlaceInLabel: boolean): string {
  return usePlaceInLabel ? placeName : 'Server'
}

/** Test Server tab path tooltip (always includes place). */
export function simServerTabPathTooltip(place: Pick<Place, 'displayName'>): string {
  return placeServerRootPathTooltip(place)
}
