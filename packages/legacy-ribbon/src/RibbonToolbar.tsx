import { useState, type ReactNode } from 'react'
import css from './ribbon.module.css'
import Checkbox from './Checkbox'
import NumberInput from './NumberInput'
import { RibbonChevronSmIcon } from './icons/mezzanineIcons'
import { SpinIcon, ToolbarIcon, type ToolbarIconId } from './icons/ToolbarIcon'

const DEFAULT_ACTIVE_RIBBON_TOOL = 'select' as const

const PANEL_TOGGLE_IDS = ['toolbox', 'explorer', 'properties', 'assets'] as const
export type RibbonPanelToggleId = (typeof PANEL_TOGGLE_IDS)[number]
type PanelToggleId = RibbonPanelToggleId

export type RibbonPanelToggles = Record<RibbonPanelToggleId, boolean>

const DEFAULT_PANEL_TOGGLES: RibbonPanelToggles = {
  toolbox: true,
  explorer: true,
  properties: true,
  assets: true,
}

export type RibbonToolbarProps = {
  panelToggles?: RibbonPanelToggles
  onPanelToggle?: (panelId: RibbonPanelToggleId, open: boolean) => void
}

function G24({ children }: { children: ReactNode }) {
  return <div className={css.b24}>{children}</div>
}

function VDiv() {
  return <div className={css.vDivider} aria-hidden />
}

function ToggleTool({
  toolId,
  label,
  active,
  onPress,
  children,
  variant = 'tool',
}: {
  toolId: string
  label: string
  active: boolean
  onPress: (toolId: string) => void
  children: ReactNode
  variant?: 'tool' | 'panel'
}) {
  const activeClass = variant === 'panel' ? css.panelToggleActive : css.ribbonToolActive
  const colActiveClass = variant === 'panel' ? css.panelToggleColActive : css.toggleColActive

  return (
    <div className={`${css.toggleCol} ${variant === 'panel' ? css.panelToggleCol : ''} ${active ? colActiveClass : ''}`}>
      <button
        type="button"
        className={`${css.toggleBtn} ${active ? activeClass : ''}`}
        aria-pressed={active}
        onClick={() => onPress(toolId)}
      >
        {children}
      </button>
      <div className={css.toggleLabel}>
        <span>{label}</span>
      </div>
    </div>
  )
}

function SplitTool({
  toolId,
  label,
  active,
  onPress,
  iconId,
}: {
  toolId: string
  label: string
  active: boolean
  onPress: (toolId: string) => void
  iconId: ToolbarIconId
}) {
  return (
    <div className={css.splitTool}>
      <div className={css.splitTop}>
        <button
          type="button"
          className={`${css.splitMain} ${active ? css.ribbonToolActive : ''}`}
          aria-pressed={active}
          onClick={() => onPress(toolId)}
        >
          <G24>
            <ToolbarIcon id={iconId} />
          </G24>
        </button>
        <button type="button" className={css.splitDrop} aria-label={`${label} options`}>
          <RibbonChevronSmIcon className={css.chevSvg} />
        </button>
      </div>
      <div className={css.toggleLabel}>
        <span>{label}</span>
      </div>
    </div>
  )
}

function SpinPair() {
  const [moveSnapEnabled, setMoveSnapEnabled] = useState(true)
  const [rotateSnapEnabled, setRotateSnapEnabled] = useState(true)
  const [moveStuds, setMoveStuds] = useState(1)
  const [rotateDegrees, setRotateDegrees] = useState(45)

  return (
    <div className={css.spinCol}>
      <div className={css.spinRow}>
        <Checkbox
          checked={moveSnapEnabled}
          onCheckedChange={setMoveSnapEnabled}
          aria-label="Move snap"
        />
        <NumberInput
          aria-label="Move snap increment"
          value={String(moveStuds)}
          unit="stud"
          leadingIcon={<SpinIcon kind="move" />}
          decrementDisabled={moveStuds <= 1}
          onDecrement={() => setMoveStuds((n) => Math.max(1, n - 1))}
          onIncrement={() => setMoveStuds((n) => n + 1)}
        />
      </div>
      <div className={css.spinRow}>
        <Checkbox
          checked={rotateSnapEnabled}
          onCheckedChange={setRotateSnapEnabled}
          aria-label="Rotate snap"
        />
        <NumberInput
          aria-label="Rotate snap increment"
          value={String(rotateDegrees)}
          unit="°"
          leadingIcon={<SpinIcon kind="rotate" />}
          decrementDisabled={rotateDegrees <= 1}
          onDecrement={() => setRotateDegrees((n) => Math.max(1, n - 1))}
          onIncrement={() => setRotateDegrees((n) => n + 1)}
        />
      </div>
    </div>
  )
}

/** Lower ribbon row — Figma Studio Starter Kit node 5814:42199. */
export function RibbonToolbar({
  panelToggles: panelTogglesProp,
  onPanelToggle,
}: RibbonToolbarProps = {}) {
  const [activeTool, setActiveTool] = useState<string>(DEFAULT_ACTIVE_RIBBON_TOOL)
  const [internalPanelToggles, setInternalPanelToggles] = useState(DEFAULT_PANEL_TOGGLES)
  const panelToggles = panelTogglesProp ?? internalPanelToggles
  const isActive = (toolId: string) => activeTool === toolId
  const pressTool = (toolId: string) => {
    setActiveTool((current) => (current === toolId ? '' : toolId))
  }
  const isPanelOn = (toolId: PanelToggleId) => panelToggles[toolId]
  const pressPanelToggle = (toolId: string) => {
    if (!(PANEL_TOGGLE_IDS as readonly string[]).includes(toolId)) return
    const panelId = toolId as PanelToggleId
    const next = !panelToggles[panelId]
    if (panelTogglesProp == null) {
      setInternalPanelToggles((current) => ({
        ...current,
        [panelId]: next,
      }))
    }
    onPanelToggle?.(panelId, next)
  }

  return (
    <div className={css.toolbar} data-node-id="5814:42199">
      <div className={css.toolGroup} data-node-id="5814:42199;3:240668">
        <ToggleTool toolId="select" label="Select" active={isActive('select')} onPress={pressTool}>
          <G24>
            <ToolbarIcon id="select" />
          </G24>
        </ToggleTool>
        <ToggleTool toolId="move" label="Move" active={isActive('move')} onPress={pressTool}>
          <G24>
            <ToolbarIcon id="move" />
          </G24>
        </ToggleTool>
        <ToggleTool toolId="scale" label="Scale" active={isActive('scale')} onPress={pressTool}>
          <G24>
            <ToolbarIcon id="scale" />
          </G24>
        </ToggleTool>
        <ToggleTool toolId="rotate" label="Rotate" active={isActive('rotate')} onPress={pressTool}>
          <G24>
            <ToolbarIcon id="rotate" />
          </G24>
        </ToggleTool>
        <ToggleTool toolId="transform" label="Transform" active={isActive('transform')} onPress={pressTool}>
          <G24>
            <ToolbarIcon id="transform" />
          </G24>
        </ToggleTool>
      </div>

      <VDiv />

      <div className={css.toolGroup} data-node-id="5814:42199;3:240675">
        <SplitTool
          toolId="geometric"
          label="Geometric"
          iconId="geometric"
          active={isActive('geometric')}
          onPress={pressTool}
        />
        <SpinPair />
      </div>

      <VDiv />

      <div className={css.toolGroup} data-node-id="5814:42199;3:240738">
        <SplitTool toolId="part" label="Part" iconId="part" active={isActive('part')} onPress={pressTool} />
        <ToggleTool toolId="terrain" label="Terrain" active={isActive('terrain')} onPress={pressTool}>
          <G24>
            <ToolbarIcon id="terrain" />
          </G24>
        </ToggleTool>
        <SplitTool
          toolId="character"
          label="Character"
          iconId="character"
          active={isActive('character')}
          onPress={pressTool}
        />
        <SplitTool toolId="gui" label="GUI" iconId="gui" active={isActive('gui')} onPress={pressTool} />
        <SplitTool toolId="script" label="Script" iconId="script" active={isActive('script')} onPress={pressTool} />
        <ToggleTool toolId="import-3d" label="Import 3D" active={isActive('import-3d')} onPress={pressTool}>
          <G24>
            <ToolbarIcon id="import-3d" />
          </G24>
        </ToggleTool>
      </div>

      <VDiv />

      <div className={css.toolGroup} data-node-id="5814:42199;3:240746">
        <SplitTool
          toolId="material"
          label="Material"
          iconId="material"
          active={isActive('material')}
          onPress={pressTool}
        />
        <SplitTool toolId="color" label="Color" iconId="color" active={isActive('color')} onPress={pressTool} />
        <ToggleTool toolId="group" label="Group" active={isActive('group')} onPress={pressTool}>
          <G24>
            <ToolbarIcon id="group" />
          </G24>
        </ToggleTool>
        <SplitTool toolId="lock" label="Lock" iconId="lock" active={isActive('lock')} onPress={pressTool} />
        <SplitTool toolId="anchor" label="Anchor" iconId="anchor" active={isActive('anchor')} onPress={pressTool} />
      </div>

      <VDiv />

      <div className={`${css.toolGroup} ${css.panelToggleGroup}`} data-node-id="5814:42199;3:240754">
        <ToggleTool
          toolId="toolbox"
          label="Toolbox"
          active={isPanelOn('toolbox')}
          onPress={pressPanelToggle}
          variant="panel"
        >
          <G24>
            <ToolbarIcon id="toolbox" />
          </G24>
        </ToggleTool>
        <ToggleTool
          toolId="explorer"
          label="Explorer"
          active={isPanelOn('explorer')}
          onPress={pressPanelToggle}
          variant="panel"
        >
          <G24>
            <ToolbarIcon id="explorer" />
          </G24>
        </ToggleTool>
        <ToggleTool
          toolId="properties"
          label="Properties"
          active={isPanelOn('properties')}
          onPress={pressPanelToggle}
          variant="panel"
        >
          <G24>
            <ToolbarIcon id="properties" />
          </G24>
        </ToggleTool>
        <ToggleTool
          toolId="assets"
          label="Assets"
          active={isPanelOn('assets')}
          onPress={pressPanelToggle}
          variant="panel"
        >
          <G24>
            <ToolbarIcon id="assets" />
          </G24>
        </ToggleTool>
      </div>
    </div>
  )
}
