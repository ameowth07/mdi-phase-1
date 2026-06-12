import { publicAssetUrl } from '../../publicAssetUrl'
import { droneRacerGame } from './workspaceModel/workspaceConfig'

export type AssetCatalogRow = {
  id: string
  name: string
  assetId: string
  type: string
  dateModified: string
  placeId?: string
  thumb?: 'model' | 'audio' | 'place'
  thumbUrl?: string
}

export function skylineDriftPlaceRows(): AssetCatalogRow[] {
  return droneRacerGame.places.map((place) => ({
    id: `place-${place.id}`,
    placeId: place.id,
    name: place.displayName,
    assetId: '',
    type: 'Place',
    dateModified: '12 June 2024',
    thumb: 'place',
  }))
}

export const SKYLINE_DRIFT_ASSETS: AssetCatalogRow[] = [
  {
    id: 'drift-track',
    name: 'DriftTrack',
    assetId: '',
    type: 'Model',
    dateModified: '12 June 2024',
    thumb: 'model',
    thumbUrl: publicAssetUrl('assets/asset-isolation.jpg'),
  },
  {
    id: 'neon-barriers',
    name: 'NeonBarriers',
    assetId: '49481118822',
    type: 'Model',
    dateModified: '12 June 2024',
    thumb: 'model',
    thumbUrl: publicAssetUrl('assets/asset-isolation-selected.jpg'),
  },
  {
    id: 'music-loop',
    name: 'MusicLoop_High',
    assetId: '49481118822',
    type: 'Audio',
    dateModified: '12 June 2024',
    thumb: 'audio',
  },
  {
    id: 'race-car',
    name: 'RaceCarBody',
    assetId: '49481118822',
    type: 'Model',
    dateModified: '12 June 2024',
    thumb: 'model',
    thumbUrl: publicAssetUrl('assets/Model.png'),
  },
  {
    id: 'skyline-bg',
    name: 'SkylineBackgroud',
    assetId: '49481118822',
    type: 'Model',
    dateModified: '12 June 2024',
    thumb: 'model',
    thumbUrl: publicAssetUrl('assets/bunny-viewport.png'),
  },
]

export function assetById(assetId: string): AssetCatalogRow | undefined {
  return SKYLINE_DRIFT_ASSETS.find((asset) => asset.id === assetId)
}

export function isPlaceCatalogRow(row: AssetCatalogRow): boolean {
  return row.type === 'Place'
}
