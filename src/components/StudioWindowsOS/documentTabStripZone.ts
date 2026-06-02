import type { EditIsolationTabId, MainScriptTabId, SimDocumentStripTab } from './documentTabClose'
import {
  isSimPlaceServerTab,
  placeIdFromPlaceServerTab,
  simPlaceServerTabId,
} from './placeServerTabs'
import { isSimClientInstanceId } from './simMultiClient'
import { reorderVisibleTabs } from './documentTabReorder'

export type CombinedTabStripZone = 'main' | 'iso'

/** Mode-specific keys used when rendering tabs. */
export type CombinedTabKey =
  | `sim:${SimDocumentStripTab}`
  | `iso:${EditIsolationTabId}`
  | `main:${MainScriptTabId}`

/**
 * Mode-neutral tab identity — stored in React state so test/edit share order and zone placement.
 */
export type PersistentTabKey =
  | `dm:${SimViewportFocus}`
  | `dm:client-${number}`
  | `dm:place-server:${string}`
  | `script:${MainScriptTabId}`
  | `iso:${EditIsolationTabId}`

type SimViewportFocus = 'client' | 'server'

export function simTabKey(id: SimDocumentStripTab): CombinedTabKey {
  return `sim:${id}`
}

export function isoTabKey(id: EditIsolationTabId): CombinedTabKey {
  return `iso:${id}`
}

export function mainScriptTabKey(id: MainScriptTabId): CombinedTabKey {
  return `main:${id}`
}

export function dmPersistentKey(id: SimViewportFocus): PersistentTabKey {
  return `dm:${id}`
}

export function scriptPersistentKey(id: MainScriptTabId): PersistentTabKey {
  return `script:${id}`
}

export function isoPersistentKey(id: EditIsolationTabId): PersistentTabKey {
  return `iso:${id}`
}

export function simStripTabToPersistent(tab: SimDocumentStripTab): PersistentTabKey {
  if (tab === 'client' || tab === 'server') return dmPersistentKey(tab)
  if (isSimClientInstanceId(tab)) return `dm:${tab}`
  if (isSimPlaceServerTab(tab)) {
    return `dm:place-server:${placeIdFromPlaceServerTab(tab)}`
  }
  return scriptPersistentKey(tab)
}

/** Insert joined-place Server tab key immediately after Client in combined-zone order. */
export function insertPlaceServerPersistentKeyAfterClient(
  keys: readonly PersistentTabKey[],
  placeId: string,
): PersistentTabKey[] {
  const key = `dm:place-server:${placeId}` as PersistentTabKey
  const next = keys.filter((k) => k !== key)
  const clientIdx = next.indexOf('dm:client')
  const anchorIdx =
    clientIdx >= 0
      ? clientIdx
      : (() => {
          let last = -1
          for (let i = 0; i < next.length; i++) {
            if (/^dm:client-\d+$/.test(next[i]!)) last = i
          }
          return last
        })()
  if (anchorIdx < 0) return [...next, key]
  let insertAt = anchorIdx + 1
  while (insertAt < next.length && next[insertAt]!.startsWith('dm:place-server:')) {
    insertAt += 1
  }
  return [...next.slice(0, insertAt), key, ...next.slice(insertAt)]
}

export function isPersistentTabKey(value: string): value is PersistentTabKey {
  return value.startsWith('dm:') || value.startsWith('script:') || value.startsWith('iso:')
}

export function combinedKeyToPersistent(key: CombinedTabKey | PersistentTabKey): PersistentTabKey | null {
  if (isPersistentTabKey(key)) return key
  if (key.startsWith('sim:')) {
    const id = key.slice(4) as SimDocumentStripTab
    return simStripTabToPersistent(id)
  }
  if (key.startsWith('main:')) {
    return scriptPersistentKey(key.slice(5) as MainScriptTabId)
  }
  if (key.startsWith('iso:')) {
    return isoPersistentKey(key.slice(4) as EditIsolationTabId)
  }
  return null
}

export function persistentToCombined(
  key: PersistentTabKey,
  mode: 'sim' | 'edit',
): CombinedTabKey | null {
  if (key.startsWith('dm:')) {
    if (mode !== 'sim') return null
    const dmId = key.slice(3)
    if (dmId === 'client' || dmId === 'server') return simTabKey(dmId)
    if (isSimClientInstanceId(dmId)) return simTabKey(dmId)
    if (dmId.startsWith('place-server:')) {
      return simTabKey(simPlaceServerTabId(dmId.slice('place-server:'.length)))
    }
    return null
  }
  if (key.startsWith('script:')) {
    const id = key.slice(7) as MainScriptTabId
    return mode === 'sim' ? simTabKey(id) : mainScriptTabKey(id)
  }
  if (key.startsWith('iso:')) {
    return isoTabKey(key.slice(4) as EditIsolationTabId)
  }
  return null
}

export function normalizePersistentZoneKeys(
  keys: readonly (CombinedTabKey | PersistentTabKey)[] | null | undefined,
): PersistentTabKey[] | null {
  if (keys == null) return null
  const result: PersistentTabKey[] = []
  for (const key of keys) {
    const persistent = combinedKeyToPersistent(key)
    if (persistent != null) result.push(persistent)
  }
  return result
}

export function defaultPersistentTabZone(key: PersistentTabKey): CombinedTabStripZone {
  return key.startsWith('iso:') ? 'iso' : 'main'
}

export function defaultTabZone(key: CombinedTabKey): CombinedTabStripZone {
  const persistent = combinedKeyToPersistent(key)
  return persistent != null ? defaultPersistentTabZone(persistent) : 'main'
}

export function buildDefaultPersistentZoneKeys(
  zone: CombinedTabStripZone,
  simOrder: readonly SimDocumentStripTab[],
  scriptOrder: readonly MainScriptTabId[],
  isoOrder: readonly EditIsolationTabId[],
  isOpen: (key: PersistentTabKey) => boolean,
): PersistentTabKey[] {
  const keys: PersistentTabKey[] = []

  if (zone === 'main') {
    for (const id of simOrder) {
      const key = simStripTabToPersistent(id)
      if (isOpen(key) && defaultPersistentTabZone(key) === zone && !keys.includes(key)) {
        keys.push(key)
      }
    }
    for (const id of scriptOrder) {
      const key = scriptPersistentKey(id)
      if (isOpen(key) && defaultPersistentTabZone(key) === zone && !keys.includes(key)) {
        keys.push(key)
      }
    }
  } else {
    for (const id of isoOrder) {
      const key = isoPersistentKey(id)
      if (isOpen(key)) keys.push(key)
    }
  }

  return keys
}

/** @deprecated Use buildDefaultPersistentZoneKeys — kept for any external imports. */
export function buildDefaultZoneTabKeys(
  zone: CombinedTabStripZone,
  mode: 'sim' | 'edit',
  simOrder: readonly SimDocumentStripTab[],
  isoOrder: readonly EditIsolationTabId[],
  scriptOrder: readonly MainScriptTabId[],
  isOpen: (key: CombinedTabKey) => boolean,
): CombinedTabKey[] {
  const persistentOpen = (pk: PersistentTabKey) => {
    const combined = persistentToCombined(pk, mode)
    return combined != null && isOpen(combined)
  }
  return buildDefaultPersistentZoneKeys(zone, simOrder, scriptOrder, isoOrder, persistentOpen)
    .map((pk) => persistentToCombined(pk, mode))
    .filter((k): k is CombinedTabKey => k != null)
}

export function persistentKeysToCombined(
  keys: readonly PersistentTabKey[],
  mode: 'sim' | 'edit',
): CombinedTabKey[] {
  return keys
    .map((k) => persistentToCombined(k, mode))
    .filter((k): k is CombinedTabKey => k != null)
}

export function reorderZoneTabKeys(
  keys: readonly PersistentTabKey[],
  from: number,
  to: number,
): PersistentTabKey[] {
  return reorderVisibleTabs(keys, from, to)
}

export function moveTabBetweenZones(
  mainKeys: readonly PersistentTabKey[],
  isoKeys: readonly PersistentTabKey[],
  fromZone: CombinedTabStripZone,
  fromIndex: number,
  toZone: CombinedTabStripZone,
  toIndex: number,
): { mainKeys: PersistentTabKey[]; isoKeys: PersistentTabKey[] } | null {
  const fromList = fromZone === 'main' ? mainKeys : isoKeys
  const movedKey = fromList[fromIndex]
  if (movedKey == null) return null

  let nextMain = mainKeys.filter((k) => k !== movedKey)
  let nextIso = isoKeys.filter((k) => k !== movedKey)

  if (fromZone === 'main') {
    nextMain = mainKeys.filter((_, i) => i !== fromIndex)
  } else {
    nextIso = isoKeys.filter((_, i) => i !== fromIndex)
  }

  const target = toZone === 'main' ? [...nextMain] : [...nextIso]
  const insertAt = Math.max(0, Math.min(toIndex, target.length))
  target.splice(insertAt, 0, movedKey)

  if (toZone === 'main') nextMain = target
  else nextIso = target

  return { mainKeys: nextMain, isoKeys: nextIso }
}

/** Preserve closed-tab slots in a stored order while applying a new left-to-right open order. */
export function mergeOpenTabOrder<T extends string>(
  fullOrder: readonly T[],
  openInStrip: readonly T[],
): T[] {
  const openSet = new Set(openInStrip)
  const result: T[] = []
  let oi = 0
  for (const tab of fullOrder) {
    if (openSet.has(tab)) {
      if (oi < openInStrip.length) result.push(openInStrip[oi++]!)
    } else {
      result.push(tab)
    }
  }
  while (oi < openInStrip.length) result.push(openInStrip[oi++]!)
  return result
}

function persistentKeysInStripOrder(
  mainKeys: readonly PersistentTabKey[],
  isoKeys: readonly PersistentTabKey[],
): PersistentTabKey[] {
  return [...mainKeys, ...isoKeys]
}

function simTabsFromPersistentKeys(keys: readonly PersistentTabKey[]): SimDocumentStripTab[] {
  return keys
    .map((k) => {
      if (k.startsWith('dm:')) {
        const dmId = k.slice(3)
        if (dmId === 'client' || dmId === 'server') return dmId
        if (isSimClientInstanceId(dmId)) return dmId
        if (dmId.startsWith('place-server:')) {
          return simPlaceServerTabId(dmId.slice('place-server:'.length))
        }
        return null
      }
      if (k.startsWith('script:')) return k.slice(7) as MainScriptTabId
      return null
    })
    .filter((t): t is SimDocumentStripTab => t != null)
}

function scriptIdsFromPersistentKeys(keys: readonly PersistentTabKey[]): MainScriptTabId[] {
  const seen = new Set<MainScriptTabId>()
  const result: MainScriptTabId[] = []
  for (const key of keys) {
    if (!key.startsWith('script:')) continue
    const id = key.slice(7) as MainScriptTabId
    if (!seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  }
  return result
}

function isoIdsFromPersistentKeys(keys: readonly PersistentTabKey[]): EditIsolationTabId[] {
  return keys
    .filter((k): k is `iso:${EditIsolationTabId}` => k.startsWith('iso:'))
    .map((k) => k.slice(4) as EditIsolationTabId)
}

/** After test-mode sim strip reorder, mirror script tab order for edit mode. */
export function syncScriptOrderFromSimOrder(
  simOrder: readonly SimDocumentStripTab[],
  scriptOrder: readonly MainScriptTabId[],
): MainScriptTabId[] {
  const openScripts = simOrder.filter(
    (t): t is MainScriptTabId =>
      t !== 'client' &&
      t !== 'server' &&
      !isSimClientInstanceId(t) &&
      !isSimPlaceServerTab(t),
  )
  return mergeOpenTabOrder(scriptOrder, openScripts)
}

/** After edit-mode script strip reorder, mirror script slots in sim document order. */
export function syncSimOrderFromScriptOrder(
  simOrder: readonly SimDocumentStripTab[],
  scriptOrder: readonly MainScriptTabId[],
): SimDocumentStripTab[] {
  const dmTabs = simOrder.filter(
    (t) =>
      t === 'client' ||
      t === 'server' ||
      isSimClientInstanceId(t) ||
      isSimPlaceServerTab(t),
  )
  return mergeOpenTabOrder(simOrder, [...dmTabs, ...scriptOrder])
}

/** Main-zone persistent keys for a play-session sim strip (Server & Clients client-N tabs included). */
export function persistentMainZoneKeysForSimOrder(
  simOrder: readonly SimDocumentStripTab[],
  scriptOrder: readonly MainScriptTabId[],
  isScriptOpen: (tab: MainScriptTabId) => boolean,
): PersistentTabKey[] {
  const keys: PersistentTabKey[] = []
  for (const id of simOrder) {
    const key = simStripTabToPersistent(id)
    if (defaultPersistentTabZone(key) === 'main' && !keys.includes(key)) {
      keys.push(key)
    }
  }
  for (const id of scriptOrder) {
    if (!isScriptOpen(id)) continue
    const key = scriptPersistentKey(id)
    if (!keys.includes(key)) keys.push(key)
  }
  return keys
}

/** Sync sim, script, and isolation stored orders from zone placement (test + edit). */
export function syncAllDocumentOrdersFromPersistentZones(
  mainKeys: readonly PersistentTabKey[],
  isoKeys: readonly PersistentTabKey[],
  simOrder: readonly SimDocumentStripTab[],
  scriptOrder: readonly MainScriptTabId[],
  isoTabOrder: readonly EditIsolationTabId[],
): {
  simOrder: SimDocumentStripTab[]
  scriptOrder: MainScriptTabId[]
  isoTabOrder: EditIsolationTabId[]
} {
  const stripOrder = persistentKeysInStripOrder(mainKeys, isoKeys)
  const openSim = simTabsFromPersistentKeys(stripOrder)
  const openScripts = scriptIdsFromPersistentKeys(stripOrder)
  const openIso = isoIdsFromPersistentKeys(stripOrder)

  return {
    simOrder: mergeOpenTabOrder(simOrder, openSim),
    scriptOrder: mergeOpenTabOrder(scriptOrder, openScripts),
    isoTabOrder: mergeOpenTabOrder(isoTabOrder, openIso),
  }
}

export function syncSimOrderFromZoneKeys(
  mainKeys: readonly CombinedTabKey[],
  isoKeys: readonly CombinedTabKey[],
  simOrder: readonly SimDocumentStripTab[],
): SimDocumentStripTab[] {
  const main = normalizePersistentZoneKeys(mainKeys) ?? []
  const iso = normalizePersistentZoneKeys(isoKeys) ?? []
  return syncAllDocumentOrdersFromPersistentZones(main, iso, simOrder, [], []).simOrder
}

export function syncIsoOrderFromZoneKeys(
  mainKeys: readonly CombinedTabKey[],
  isoKeys: readonly CombinedTabKey[],
  isoOrder: readonly EditIsolationTabId[],
): EditIsolationTabId[] {
  const main = normalizePersistentZoneKeys(mainKeys) ?? []
  const iso = normalizePersistentZoneKeys(isoKeys) ?? []
  return syncAllDocumentOrdersFromPersistentZones(main, iso, [], [], isoOrder).isoTabOrder
}

export function syncScriptOrderFromZoneKeys(
  mainKeys: readonly CombinedTabKey[],
  isoKeys: readonly CombinedTabKey[],
  scriptOrder: readonly MainScriptTabId[],
): MainScriptTabId[] {
  const main = normalizePersistentZoneKeys(mainKeys) ?? []
  const iso = normalizePersistentZoneKeys(isoKeys) ?? []
  return syncAllDocumentOrdersFromPersistentZones(main, iso, [], scriptOrder, []).scriptOrder
}

export function tabKeyInZone(
  key: CombinedTabKey,
  zone: CombinedTabStripZone,
  mainKeys: readonly CombinedTabKey[],
  isoKeys: readonly CombinedTabKey[],
): boolean {
  const persistent = combinedKeyToPersistent(key)
  if (persistent == null) return false
  const main = normalizePersistentZoneKeys(mainKeys) ?? []
  const iso = normalizePersistentZoneKeys(isoKeys) ?? []
  return zone === 'main' ? main.includes(persistent) : iso.includes(persistent)
}

function isSessionClientInstancePersistentKey(key: PersistentTabKey): boolean {
  return /^dm:client-\d+$/.test(key)
}

export function sessionClientPersistentKeys(clientCount: number): PersistentTabKey[] {
  const keys: PersistentTabKey[] = []
  for (let i = 1; i <= clientCount; i++) {
    keys.push(`dm:client-${i}` as PersistentTabKey)
  }
  return keys
}

/** Defaults for Server & Clients — all session client tabs precede server/scripts. */
export function injectMultiClientMainZoneDefaults(
  defaults: readonly PersistentTabKey[],
  clientCount: number,
  active: boolean,
): PersistentTabKey[] {
  if (!active || clientCount < 1) return [...defaults]
  const session = sessionClientPersistentKeys(clientCount)
  const rest = defaults.filter(
    (k) => k !== 'dm:client' && !isSessionClientInstancePersistentKey(k),
  )
  return [...session, ...rest]
}

/** Ensure explicit main-zone order lists every client in the active session. */
export function ensureMultiClientMainZoneKeys(
  mainKeys: readonly PersistentTabKey[],
  clientCount: number,
  active: boolean,
): PersistentTabKey[] {
  if (!active || clientCount < 1) return [...mainKeys]
  const session = sessionClientPersistentKeys(clientCount)
  const rest = mainKeys.filter(
    (k) => k !== 'dm:client' && !isSessionClientInstancePersistentKey(k),
  )
  const merged: PersistentTabKey[] = [...session]
  for (const k of rest) {
    if (!merged.includes(k)) merged.push(k)
  }
  return merged
}

/**
 * Merge stored zone order with defaults after drag or tab open/close.
 * Cross-zone keys stay in the zone the user dropped them into (not filtered by default zone).
 */
export function reconcileCombinedZoneKeys(
  mainExplicit: readonly (CombinedTabKey | PersistentTabKey)[] | null | undefined,
  isoExplicit: readonly (CombinedTabKey | PersistentTabKey)[] | null | undefined,
  defaultMain: readonly PersistentTabKey[],
  defaultIso: readonly PersistentTabKey[],
): { main: PersistentTabKey[]; iso: PersistentTabKey[] } {
  const mainNorm = normalizePersistentZoneKeys(mainExplicit)
  const isoNorm = normalizePersistentZoneKeys(isoExplicit)

  if (mainNorm == null && isoNorm == null) {
    return { main: [...defaultMain], iso: [...defaultIso] }
  }

  const openKeys = new Set([...defaultMain, ...defaultIso])
  const main = (mainNorm ?? []).filter(
    (k) =>
      openKeys.has(k) ||
      isSessionClientInstancePersistentKey(k) ||
      k.startsWith('dm:place-server:'),
  )
  const iso = (isoNorm ?? []).filter((k) => openKeys.has(k))
  const assigned = new Set<PersistentTabKey>([...main, ...iso])

  for (const key of defaultMain) {
    if (!assigned.has(key)) {
      main.push(key)
      assigned.add(key)
    }
  }
  for (const key of defaultIso) {
    if (!assigned.has(key)) {
      iso.push(key)
      assigned.add(key)
    }
  }

  return { main, iso }
}
