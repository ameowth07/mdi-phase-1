import type { SimViewportFocus } from './prototypeDefaults'

/** Explorer / footer tint — which datamodel has UI focus. */
export type DatamodelTintFocus = 'client' | 'server' | 'drone'

export type ExplorerRetentionKind = 'sim-client' | 'sim-server' | 'edit-drone' | 'drone-isolation'

/** Matches Explorer `data-explorer-tint` selected-row hues (Testing UI). */
export function resolveDatamodelTintFocus(
  tintActive: boolean,
  clientSim: boolean,
  simViewportFocus: SimViewportFocus,
  explorerWhileScriptFocus: ExplorerRetentionKind | null,
  droneDocumentFocused: boolean,
  hideAssetTinting = false,
): DatamodelTintFocus | null {
  if (!tintActive) return null

  let focus: DatamodelTintFocus | null = null

  if (droneDocumentFocused) focus = 'drone'
  else if (
    explorerWhileScriptFocus === 'drone-isolation' ||
    explorerWhileScriptFocus === 'edit-drone'
  ) {
    focus = 'drone'
  } else if (explorerWhileScriptFocus === 'sim-server') focus = 'server'
  else if (explorerWhileScriptFocus === 'sim-client') focus = 'client'
  else if (clientSim) focus = simViewportFocus

  if (focus === 'drone' && hideAssetTinting) return null
  return focus
}
