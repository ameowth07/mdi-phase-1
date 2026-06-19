export type ToolboxItem = {
  id: string
  name: string
}

export type ToolboxCategory = {
  id: string
  label: string
  items: ToolboxItem[]
}

/** Starter Toolbox catalog — common insertable models. */
export const TOOLBOX_CATEGORIES: ToolboxCategory[] = [
  {
    id: 'parts',
    label: 'Parts',
    items: [
      { id: 'block', name: 'Block' },
      { id: 'sphere', name: 'Sphere' },
      { id: 'cylinder', name: 'Cylinder' },
      { id: 'wedge', name: 'Wedge' },
      { id: 'corner-wedge', name: 'Corner Wedge' },
      { id: 'truss', name: 'Truss' },
    ],
  },
  {
    id: 'effects',
    label: 'Effects',
    items: [
      { id: 'fire', name: 'Fire' },
      { id: 'smoke', name: 'Smoke' },
      { id: 'sparkles', name: 'Sparkles' },
    ],
  },
  {
    id: 'lights',
    label: 'Lights',
    items: [
      { id: 'point-light', name: 'PointLight' },
      { id: 'spot-light', name: 'SpotLight' },
      { id: 'surface-light', name: 'SurfaceLight' },
    ],
  },
]
