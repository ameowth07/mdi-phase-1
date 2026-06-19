import css from '../ribbon.module.css'
import { IconStack } from './IconStack'
import { SPIN_ICON_LAYERS, TOOLBAR_ICON_LAYERS, type ToolbarIconId } from './toolbarIconLayers'

export function ToolbarIcon({ id }: { id: ToolbarIconId }) {
  return (
    <IconStack
      size={24}
      layers={TOOLBAR_ICON_LAYERS[id]}
      className={id === 'color' ? css.ribbonIconPreserveAccents : undefined}
    />
  )
}

export function SpinIcon({ kind }: { kind: keyof typeof SPIN_ICON_LAYERS }) {
  return <IconStack size={16} layers={SPIN_ICON_LAYERS[kind]} />
}

export type { ToolbarIconId } from './toolbarIconLayers'
