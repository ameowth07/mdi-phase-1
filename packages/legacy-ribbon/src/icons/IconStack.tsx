import css from '../ribbon.module.css'
import { InlineSvg } from './InlineSvg'
import { getRibbonSvg } from './svgRegistry'

export type IconLayer =
  | { kind: 'svg'; asset: string; inset: string }
  | { kind: 'swatch'; inset: string; swatch: 'gui' | 'explorer' }

type IconStackProps = {
  size: 16 | 24
  layers: IconLayer[]
  className?: string
}

export function IconStack({ size, layers, className }: IconStackProps) {
  return (
    <span
      className={[css.iconStack, size === 16 ? css.iconStack16 : css.iconStack24, className]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      {layers.map((layer, index) => {
        if (layer.kind === 'swatch') {
          const swatchClass =
            layer.swatch === 'gui'
              ? css.guiAccentSwatch
              : layer.swatch === 'explorer'
                ? css.explorerAccentSwatch
                : null
          return (
            <span
              key={`swatch-${index}`}
              className={[css.iconLayer, swatchClass].filter(Boolean).join(' ')}
              style={{ inset: layer.inset }}
            />
          )
        }
        return (
          <span key={`${layer.asset}-${index}`} className={css.iconLayer} style={{ inset: layer.inset }}>
            <InlineSvg svg={getRibbonSvg(layer.asset)} />
          </span>
        )
      })}
    </span>
  )
}
