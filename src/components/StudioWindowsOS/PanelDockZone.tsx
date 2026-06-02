import type { PointerEvent, ReactNode } from 'react'
import type { DockPanelId, DockZoneId, PanelStackState } from './panelDock'
import PanelDockStack, { type PanelDockStackProps } from './PanelDockStack'
import dockStyles from './PanelDock.module.css'
import styles from './StudioWindowsOS.module.css'

export type PanelDockZoneProps = {
  zone: DockZoneId
  stacks: PanelStackState[]
  onStacksChange: (stacks: PanelStackState[]) => void
  isDropTarget: (target: { kind: 'new-stack'; zone: DockZoneId; stackIndex: number }) => boolean
  isMergeDropTarget: (zone: DockZoneId, stackIndex: number) => boolean
  renderPanel: (
    panelId: DockPanelId,
    ctx: { tabbed: boolean; placeDocumentTabStripInDock: boolean },
  ) => ReactNode
  resolvePlaceDisplayName?: (placeId: string) => string | undefined
  renderPlaceDocumentTab?: PanelDockStackProps['renderPlaceDocumentTab']
  onPlaceTabStripPointerDown?: (e: PointerEvent<HTMLElement>) => void
  className?: string
}

export default function PanelDockZone({
  zone,
  stacks,
  onStacksChange,
  isDropTarget,
  isMergeDropTarget,
  renderPanel,
  resolvePlaceDisplayName,
  renderPlaceDocumentTab,
  onPlaceTabStripPointerDown,
  className,
}: PanelDockZoneProps) {
  const zoneClass =
    zone === 'right'
      ? `${dockStyles.zone} ${dockStyles.zoneRight}`
      : `${dockStyles.zone} ${dockStyles.zoneBottom}`

  const updateStack = (stackIndex: number, stack: PanelStackState) => {
    const next = stacks.map((s, i) => (i === stackIndex ? stack : s))
    onStacksChange(next)
  }

  return (
    <div className={`${zoneClass} ${className ?? ''}`.trim()} data-panel-dock-zone={zone}>
      {stacks.map((stack, stackIndex) => (
        <div
          key={stack.stackId}
          className={zone === 'bottom' ? dockStyles.bottomStackWrap : undefined}
        >
          <div
            className={[
              dockStyles.insertBefore,
              isDropTarget({ kind: 'new-stack', zone, stackIndex }) ? dockStyles.insertBeforeActive : null,
            ]
              .filter(Boolean)
              .join(' ')}
            data-panel-dock-insert={stackIndex}
            data-panel-dock-zone={zone}
            aria-hidden
          />
          <PanelDockStack
            zone={zone}
            stackIndex={stackIndex}
            stack={stack}
            onStackChange={(s) => updateStack(stackIndex, s)}
            mergeDropActive={isMergeDropTarget(zone, stackIndex)}
            renderPanel={renderPanel}
            resolvePlaceDisplayName={resolvePlaceDisplayName}
            renderPlaceDocumentTab={renderPlaceDocumentTab}
            onPlaceTabStripPointerDown={onPlaceTabStripPointerDown}
            fixedHeight={
              stack.tabs.length === 1 && stack.tabs[0] === 'prototypeSettings'
            }
            stackMajor={
              stack.tabs.some((t) => t === 'explorer' || t === 'properties') &&
              !stack.tabs.includes('prototypeSettings')
            }
          />
          {zone === 'bottom' && stackIndex < stacks.length - 1 ? (
            <div className={styles.centerDockPanelGutter} aria-hidden />
          ) : null}
        </div>
      ))}
      <div
        className={[
          dockStyles.insertBefore,
          isDropTarget({ kind: 'new-stack', zone, stackIndex: stacks.length })
            ? dockStyles.insertBeforeActive
            : null,
        ]
          .filter(Boolean)
          .join(' ')}
        data-panel-dock-insert={stacks.length}
        data-panel-dock-zone={zone}
        aria-hidden
      />
    </div>
  )
}
