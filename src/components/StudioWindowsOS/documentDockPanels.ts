import { isAssetDockPanelId, type AssetDockPanelId } from './assetDockPanels'
import { isPlaceDockPanelId, type PlaceDockPanelId } from './placeDockPanels'

export type DocumentDockPanelId = PlaceDockPanelId | AssetDockPanelId

export function isDocumentDockPanelId(panelId: string): panelId is DocumentDockPanelId {
  return isPlaceDockPanelId(panelId) || isAssetDockPanelId(panelId)
}
