/** Move item at `from` to `to` in a copy of `items` (indices in the visible list). */
export function reorderVisibleTabs<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return [...items]
  }
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved!)
  return next
}

/**
 * Reorder the visible subset while preserving positions of tabs not in `visible`.
 * `visible` is the left-to-right open tabs in the strip; `fullOrder` is the stored order.
 */
export function mergeVisibleTabReorder<T extends string>(
  fullOrder: readonly T[],
  visible: readonly T[],
  from: number,
  to: number,
): T[] {
  const reordered = reorderVisibleTabs(visible, from, to)
  const visibleSet = new Set(visible)
  const result: T[] = []
  let ri = 0
  for (const tab of fullOrder) {
    if (visibleSet.has(tab)) {
      if (ri < reordered.length) result.push(reordered[ri++]!)
    } else {
      result.push(tab)
    }
  }
  while (ri < reordered.length) result.push(reordered[ri++]!)
  return result
}
