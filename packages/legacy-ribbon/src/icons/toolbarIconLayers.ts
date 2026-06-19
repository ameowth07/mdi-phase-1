import type { IconLayer } from './IconStack'

/** Layer stacks from Figma Ribbon node 5814:42199 — fills baked in SVG assets. */
export const TOOLBAR_ICON_LAYERS = {
  select: [
    { kind: 'svg', asset: 'imgSubtract1', inset: '4% 10.33% 10.07% 3.91%' },
    { kind: 'svg', asset: 'imgSelectStroke', inset: '4% 10.33% 10.07% 3.91%' },
  ],
  move: [
    { kind: 'svg', asset: 'imgEllipse1249', inset: '26.56% 25.75% 26.56% 26.56%' },
    { kind: 'svg', asset: 'imgUnion3', inset: '6.3% 5.28% 6.23% 6.24%' },
  ],
  scale: [
    { kind: 'svg', asset: 'imgRectangle3269', inset: '46.88% 46.88% 9.38% 9.38%' },
    { kind: 'svg', asset: 'imgVector1', inset: '9.38%' },
  ],
  rotate: [
    { kind: 'svg', asset: 'imgSubtract3', inset: '21.87% 21.88% 21.88% 21.88%' },
    { kind: 'svg', asset: 'imgVector2', inset: '6.25% 6.25% 6.35% 6.25%' },
  ],
  transform: [
    { kind: 'svg', asset: 'imgUnion4', inset: '12.5% 6.25%' },
    { kind: 'svg', asset: 'imgVector2362', inset: '37.5% 32.44% 33.33% 32.39%' },
  ],
  geometric: [{ kind: 'svg', asset: 'imgVector3', inset: '6.25%' }],
  part: [
    { kind: 'svg', asset: 'imgUnion5', inset: '3.45% 8.17% 2.84% 8.16%' },
    { kind: 'svg', asset: 'imgPartSubtract', inset: '9.7% 19.12% 53.75% 19.11%' },
  ],
  terrain: [
    { kind: 'svg', asset: 'imgSubtract4', inset: '9.37% 6.25% 10.67% 6.25%' },
    { kind: 'svg', asset: 'imgSubtract5', inset: '9.37% 6.25% 10.14% 6.25%' },
  ],
  character: [
    { kind: 'svg', asset: 'imgVector5', inset: '7.01% 10.56% 16.45% 9.79%' },
    { kind: 'svg', asset: 'imgUnion6', inset: '6.45% 6.03% 5.6% 6.47%' },
  ],
  gui: [
    { kind: 'swatch', inset: '21.88% 10.42% 19.79% 68.75%', swatch: 'gui' },
    { kind: 'svg', asset: 'imgUnion7', inset: '16.67% 4.17% 14.58% 8.33%' },
  ],
  script: [
    { kind: 'svg', asset: 'imgVector3887', inset: '12.5% 62.5% 12.5% 18.75%' },
    { kind: 'svg', asset: 'imgUnion8', inset: '6.25% 6.41% 6.25% 12.5%' },
  ],
  'import-3d': [
    { kind: 'svg', asset: 'imgUnion9', inset: '9.38% 14.06% 50% 15.63%' },
    { kind: 'svg', asset: 'imgUnion10', inset: '6.48% 0.01% 2.37% 10.96%' },
  ],
  material: [
    { kind: 'svg', asset: 'imgUnion11', inset: '10.71% 6.25% 6.24% 23.63%' },
    { kind: 'svg', asset: 'imgUnion12', inset: '6.25%' },
  ],
  color: [
    { kind: 'svg', asset: 'imgEllipse1271Stroke', inset: '6.25%' },
    { kind: 'svg', asset: 'imgSubtract6', inset: '50% 50% 12.5% 12.5%' },
    { kind: 'svg', asset: 'imgSubtract7', inset: '50% 50% 12.5% 22.64%' },
    { kind: 'svg', asset: 'imgSubtract8', inset: '50% 23.48% 12.5% 50%' },
    { kind: 'svg', asset: 'imgSubtract9', inset: '23.48% 12.5% 50% 50%' },
    { kind: 'svg', asset: 'imgSubtract10', inset: '23.48% 12.5% 50% 50%' },
    { kind: 'svg', asset: 'imgSubtract11', inset: '12.5% 23.48% 50% 50%' },
    { kind: 'svg', asset: 'imgSubtract12', inset: '12.5% 50% 50% 22.64%' },
    { kind: 'svg', asset: 'imgSubtract13', inset: '24.35% 50% 50% 12.5%' },
  ],
  group: [
    { kind: 'svg', asset: 'imgUnion13', inset: '6.25% 6.7% 6.25% 5.8%' },
    { kind: 'svg', asset: 'imgSubtract14', inset: '25% 37.5% 37.5% 25%' },
  ],
  lock: [
    { kind: 'svg', asset: 'imgSubtractStroke1', inset: '62.69% 12.5% 7.42% 12.5%' },
    { kind: 'svg', asset: 'imgUnion14', inset: '6.25% 12.51% 6.71% 12.5%' },
  ],
  anchor: [{ kind: 'svg', asset: 'imgVector6', inset: '6.45% 4.01% 6.58% 4.13%' }],
  toolbox: [
    { kind: 'svg', asset: 'imgVector3882', inset: '56.25% 63.54% 9.47% 13.54%' },
    { kind: 'svg', asset: 'imgUnion15', inset: '7.01% 6.25% 6.24% 53.05%' },
    { kind: 'svg', asset: 'imgUnion16', inset: '6.25% 56.25% 6.35% 6.25%' },
  ],
  explorer: [
    { kind: 'swatch', inset: '9.96% 66.06% 66.41% 10.31%', swatch: 'explorer' },
    { kind: 'svg', asset: 'imgUnion17', inset: '6.25%' },
  ],
  properties: [
    { kind: 'svg', asset: 'imgPropertiesBackMuted', inset: '6.25%' },
    { kind: 'svg', asset: 'imgPropertiesBackOutline', inset: '6.25%' },
    { kind: 'svg', asset: 'imgUnion18', inset: '6.25%' },
  ],
  assets: [
    { kind: 'svg', asset: 'imgAssetsBackMuted', inset: '6.25%' },
    { kind: 'svg', asset: 'imgAssetManager', inset: '6.25%' },
  ],
} as const satisfies Record<string, IconLayer[]>

export type ToolbarIconId = keyof typeof TOOLBAR_ICON_LAYERS

export const SPIN_ICON_LAYERS = {
  move: [{ kind: 'svg', asset: 'imgMove', inset: '0' }],
  rotate: [{ kind: 'svg', asset: 'imgRotate', inset: '0' }],
} as const satisfies Record<string, IconLayer[]>
