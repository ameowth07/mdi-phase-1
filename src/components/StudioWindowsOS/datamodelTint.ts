import type { SimViewportFocus } from './prototypeDefaults'

/** Explorer / footer tint — which datamodel has UI focus. */
export type DatamodelTintFocus = 'client' | 'server' | 'drone'

export type ExplorerRetentionKind = 'sim-client' | 'sim-server' | 'edit-drone' | 'drone-isolation'

/** Default Properties (and similar) input focus border when Selection tint is off. */
export const SELECTION_TINT_INPUT_FOCUS_DEFAULT = '#657BF4'

/** Viewport / panel inset stroke colors — match semantic focus rings in StudioWindowsOS.module.css. */
export const DATAMODEL_INSET_FOCUS_BORDER: Record<DatamodelTintFocus, string> = {
  client: '#4ec8e9',
  server: '#47B84F',
  drone: 'rgba(255, 255, 255, 0.5)',
}

export function propertiesInputFocusBorderColor(
  selectionTintActive: boolean,
  tintFocus: DatamodelTintFocus | null,
): string {
  if (!selectionTintActive || tintFocus == null) return SELECTION_TINT_INPUT_FOCUS_DEFAULT
  return DATAMODEL_INSET_FOCUS_BORDER[tintFocus]
}

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
