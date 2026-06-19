const svgModules = import.meta.glob<string>('./svg/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export function getRibbonSvg(asset: string): string {
  const svg = svgModules[`./svg/${asset}.svg`]
  if (svg == null) {
    throw new Error(`Missing ribbon SVG asset: ${asset}`)
  }
  return svg
}
