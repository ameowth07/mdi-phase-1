export type FloatingPlaceDocumentPosition = {
  left: number
  top: number
}

export type FloatingPlaceDocumentWindowState = {
  windowId: string
  placeId: string
  position: FloatingPlaceDocumentPosition | null
  defaultSlot: number
}

let floatingPlaceWindowIdSeq = 0

export function newFloatingPlaceWindowId(): string {
  floatingPlaceWindowIdSeq += 1
  return `floating-place-${floatingPlaceWindowIdSeq}`
}

export function createFloatingPlaceWindow(
  placeId: string,
  defaultSlot: number,
): FloatingPlaceDocumentWindowState {
  return {
    windowId: newFloatingPlaceWindowId(),
    placeId,
    position: null,
    defaultSlot,
  }
}

export function findFloatingPlaceWindow(
  windows: readonly FloatingPlaceDocumentWindowState[],
  placeId: string,
): FloatingPlaceDocumentWindowState | undefined {
  return windows.find((window) => window.placeId === placeId)
}
