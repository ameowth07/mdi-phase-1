export const ASSET_DOCK_PANEL_PREFIX = 'asset:' as const

export type AssetDockPanelId = `${typeof ASSET_DOCK_PANEL_PREFIX}${string}`

export function assetDockPanelId(assetId: string): AssetDockPanelId {
  return `${ASSET_DOCK_PANEL_PREFIX}${assetId}`
}

export function isAssetDockPanelId(panelId: string): panelId is AssetDockPanelId {
  return panelId.startsWith(ASSET_DOCK_PANEL_PREFIX)
}

export function assetIdFromDockPanel(panelId: AssetDockPanelId): string {
  return panelId.slice(ASSET_DOCK_PANEL_PREFIX.length)
}
