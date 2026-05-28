export type FloatingDocumentPosition = {
  left: number
  top: number
}

export type FloatingDocumentWindowState = {
  position: FloatingDocumentPosition | null
}

export function createFloatingDocumentWindow(): FloatingDocumentWindowState {
  return { position: null }
}
