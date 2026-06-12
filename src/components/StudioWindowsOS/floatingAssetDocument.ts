export type FloatingAssetDocumentPosition = {
  left: number
  top: number
}

export type FloatingAssetDocumentWindowState = {
  windowId: string
  assetId: string
  position: FloatingAssetDocumentPosition | null
  defaultSlot: number
}

let floatingAssetWindowIdSeq = 0

export function newFloatingAssetWindowId(): string {
  floatingAssetWindowIdSeq += 1
  return `floating-asset-${floatingAssetWindowIdSeq}`
}

export function createFloatingAssetWindow(
  assetId: string,
  defaultSlot: number,
): FloatingAssetDocumentWindowState {
  return {
    windowId: newFloatingAssetWindowId(),
    assetId,
    position: null,
    defaultSlot,
  }
}

export function findFloatingAssetWindow(
  windows: readonly FloatingAssetDocumentWindowState[],
  assetId: string,
): FloatingAssetDocumentWindowState | undefined {
  return windows.find((window) => window.assetId === assetId)
}
